import { useEffect, useMemo, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  MathUtils,
  type MeshBasicMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  VideoTexture,
} from 'three'
import { CARD_W, CARD_H } from './layout'
import { dragState } from './dragState'
import { tagRowTexture } from './tagTexture'
import { disciplineTags } from '../../data/tags'
import { getCoverMedia, type MediaItem } from '../../data/media'
import type { Project } from '../../data/projects'

// --- card geometry -------------------------------------------------------
// Metadata sits in the four corners and the image floats in the middle with
// generous breathing room on every side, as in the reference layout.
const EDGE = 0.17 // gutter from the card edge to the metadata
const PAD_X = 0.5 // horizontal padding around the image
const PAD_TOP = 0.46 // space above the image (below the top metadata row)
const PAD_BOTTOM = 0.62 // space below the image (above the tag row)

const IMG_W = CARD_W - PAD_X * 2
const IMG_H = CARD_H - PAD_TOP - PAD_BOTTOM
const IMG_CENTER_Y = CARD_H / 2 - PAD_TOP - IMG_H / 2

const TEXT_L = -CARD_W / 2 + EDGE
const TEXT_R = CARD_W / 2 - EDGE
const ROW_TOP = CARD_H / 2 - EDGE
const ROW_BOTTOM = -CARD_H / 2 + EDGE

const META_SIZE = 0.088
const TAG_H = 0.135

const STROKE = 0.02 // hairline frame width
const STROKE_BASE = new Color('#3a3b44')

const loader = new TextureLoader()
loader.setCrossOrigin('anonymous')

/** A soft radial falloff used as the hover edge-glow — opaque centre (hidden
 *  behind the card) fading to transparent so only a soft fringe shows. */
const GLOW_TEX = (() => {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.24, s / 2, s / 2, s * 0.5)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new CanvasTexture(c)
})()

/**
 * Loads a project's cover media as a Three.js texture, whatever type it is:
 *  - image: a plain static texture, same as before.
 *  - video: THREE.VideoTexture, which Three updates every frame on its own.
 *  - gif: browsers only decode/animate GIFs inside real <img> elements, not
 *    WebGL textures, so we draw the (animating) <img> onto an offscreen
 *    canvas every frame and use that canvas as the texture — `tick()` does
 *    that redraw and must be called once per frame from the caller's own
 *    useFrame (it's a no-op for the other two types).
 * Never suspends, so the card is visible immediately either way.
 */
function useAsyncTexture(media: MediaItem | null): { texture: Texture | null; tick: () => void } {
  const [texture, setTexture] = useState<Texture | null>(null)
  const gifImg = useRef<HTMLImageElement | null>(null)
  const gifCanvas = useRef<HTMLCanvasElement | null>(null)
  const gifCtx = useRef<CanvasRenderingContext2D | null>(null)

  const url = media?.url ?? ''
  const type = media?.type ?? 'image'

  useEffect(() => {
    let active = true
    setTexture(null)
    gifImg.current = null
    gifCanvas.current = null
    gifCtx.current = null
    if (!url) return

    if (type === 'video') {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.src = url
      video.play().catch(() => {})
      const vt = new VideoTexture(video)
      vt.colorSpace = SRGBColorSpace
      if (active) setTexture(vt)
      return () => {
        active = false
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    if (type === 'gif') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (!active) return
        const c = document.createElement('canvas')
        c.width = img.naturalWidth || 1
        c.height = img.naturalHeight || 1
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const ct = new CanvasTexture(c)
        ct.colorSpace = SRGBColorSpace
        gifImg.current = img
        gifCanvas.current = c
        gifCtx.current = ctx
        setTexture(ct)
      }
      img.src = url
      return () => {
        active = false
      }
    }

    loader.load(
      url,
      (t) => {
        if (!active) return
        t.colorSpace = SRGBColorSpace
        setTexture(t)
      },
      undefined,
      () => {}, // on error keep the accent-colour fallback
    )
    return () => {
      active = false
    }
  }, [url, type])

  const tick = () => {
    if (type !== 'gif' || !gifCtx.current || !gifImg.current || !gifCanvas.current) return
    gifCtx.current.drawImage(gifImg.current, 0, 0, gifCanvas.current.width, gifCanvas.current.height)
    if (texture) texture.needsUpdate = true
  }

  return { texture, tick }
}

/** Build a heavily-blurred version of a loaded image by downsampling it to a
 *  tiny canvas and letting the GPU smear it back up. */
function makeBlurred(img: CanvasImageSource): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 20
  c.height = 27
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

interface ProjectCardProps {
  project: Project
  cardKey: string
  hovered: boolean
  dimmed: boolean
  focused: boolean
  onHover: (key: string | null) => void
  onSelect: (id: string, key: string) => void
}

/**
 * A framed 3:4 card: a dark panel with a padded thumbnail up top and a caption
 * below. A thin stroke is always present. Hovering does not resize the card —
 * instead a heavily-blurred copy of its image blooms behind it and a soft
 * accent edge-glow wraps the frame. Positioning is handled by the parent wall.
 */
export function ProjectCard({ project, cardKey, hovered, dimmed, focused, onHover, onSelect }: ProjectCardProps) {
  const inner = useRef<Group>(null)
  const image = useRef<MeshBasicMaterial>(null)
  const stroke = useRef<MeshBasicMaterial>(null)
  const glow = useRef<MeshBasicMaterial>(null)
  const blur = useRef<MeshBasicMaterial>(null)
  const imgBase = useRef(new Color(project?.accent ?? '#888888'))
  const accent = useRef(new Color(project?.accent ?? '#ffffff'))
  const h = useRef(0) // smoothed hover factor
  const local = useRef({ x: 0, y: 0 }) // cursor pos within the card, -1..1
  // Spring state for the lift (position.z) — critically-damped-ish feel.
  const lift = useRef({ v: 0, x: 0 })

  const cover = useMemo(() => getCoverMedia(project ?? {}), [project])
  const { texture: tex, tick: tickCoverTexture } = useAsyncTexture(cover)
  const tags = useMemo(() => tagRowTexture(disciplineTags(project)), [project])

  useEffect(() => {
    if (!tex) return
    if (image.current) {
      image.current.map = tex
      image.current.needsUpdate = true
      imgBase.current.set('#ffffff')
    }
    const src = tex.image as CanvasImageSource | undefined
    if (src && blur.current) {
      blur.current.map = makeBlurred(src)
      blur.current.needsUpdate = true
      blur.current.color.set('#ffffff')
    }
  }, [tex])

  useFrame((_, delta) => {
    tickCoverTexture()
    const g = inner.current
    if (!g) return
    const k = 1 - Math.pow(0.0015, delta)

    h.current = MathUtils.lerp(h.current, hovered ? 1 : 0, k)

    // Spring-driven lift toward the camera: gentle on hover, dramatic on focus.
    const targetZ = focused ? 3.4 : hovered ? 0.102 : 0
    const s = lift.current
    const dt = Math.min(delta, 1 / 30)
    const STIFF = 150
    const DAMP = 22
    s.v += (-STIFF * (s.x - targetZ) - DAMP * s.v) * dt
    s.x += s.v * dt
    g.position.z = s.x

    const targetScale = focused ? 2.3 : hovered ? 1.0105 : 1
    g.scale.setScalar(MathUtils.lerp(g.scale.x, targetScale, k))

    // Gentle 3D rotation toward the cursor + a few-pixels magnetic follow.
    const tiltAmt = focused ? 0 : h.current
    g.rotation.y = MathUtils.lerp(g.rotation.y, local.current.x * 0.048 * tiltAmt, k)
    g.rotation.x = MathUtils.lerp(g.rotation.x, -local.current.y * 0.048 * tiltAmt, k)
    if (!focused) {
      g.position.x = MathUtils.lerp(g.position.x, local.current.x * 0.015 * h.current, k)
      g.position.y = MathUtils.lerp(g.position.y, -local.current.y * 0.015 * h.current, k)
    }

    if (image.current) {
      const bright = hovered || focused ? 1 : dimmed ? 0.42 : 0.9
      image.current.color.copy(imgBase.current).multiplyScalar(bright)
    }
    if (stroke.current) {
      stroke.current.color.copy(STROKE_BASE).lerp(accent.current, h.current)
    }
    if (glow.current) glow.current.opacity = h.current * 0.7
    if (blur.current) blur.current.opacity = h.current * 0.85
  })

  if (!project) return null

  return (
    <group
      ref={inner}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(cardKey)
        document.body.style.cursor = 'pointer'
      }}
      onPointerMove={(e) => {
        if (!e.uv) return
        local.current.x = e.uv.x * 2 - 1
        local.current.y = e.uv.y * 2 - 1
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(null)
        local.current.x = 0
        local.current.y = 0
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        // A drag that passed the threshold must never open a project.
        if (dragState.moved) return
        onSelect(project.id, cardKey)
      }}
    >
      {/* blurred image backdrop (hover only) */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[CARD_W * 1.105, CARD_H * 1.09]} />
        <meshBasicMaterial
          ref={blur}
          color={project.accent}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* soft accent edge-glow (hover only) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[CARD_W * 1.18, CARD_H * 1.165]} />
        <meshBasicMaterial
          ref={glow}
          map={GLOW_TEX}
          color={project.accent}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* always-on thin stroke frame */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[CARD_W + STROKE * 2, CARD_H + STROKE * 2]} />
        <meshBasicMaterial ref={stroke} color={STROKE_BASE} side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* card panel */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial color="#0c0d12" side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* generously padded thumbnail, floating in the middle of the card */}
      <mesh position={[0, IMG_CENTER_Y, 0.01]}>
        <planeGeometry args={[IMG_W, IMG_H]} />
        <meshBasicMaterial ref={image} color={project.accent} side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* top-left: client */}
      <Text
        position={[TEXT_L, ROW_TOP, 0.02]}
        anchorX="left"
        anchorY="top"
        fontSize={META_SIZE * 1.16}
        color="#efece4"
        maxWidth={CARD_W * 0.42}
      >
        {project.client}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#efece4" />
      </Text>

      {/* top-right: project title */}
      <Text
        position={[TEXT_R, ROW_TOP, 0.02]}
        anchorX="right"
        anchorY="top"
        textAlign="right"
        fontSize={META_SIZE}
        letterSpacing={0.09}
        color="#b9b5ac"
        maxWidth={CARD_W * 0.52}
      >
        {project.title.toUpperCase()}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#b9b5ac" />
      </Text>

      {/* bottom-left: discipline tags */}
      <mesh position={[TEXT_L + (TAG_H * tags.aspect) / 2, ROW_BOTTOM + TAG_H / 2, 0.02]}>
        <planeGeometry args={[TAG_H * tags.aspect, TAG_H]} />
        <meshBasicMaterial
          map={tags.texture}
          transparent
          depthWrite={false}
          side={FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* bottom-right: year */}
      <Text
        position={[TEXT_R, ROW_BOTTOM, 0.02]}
        anchorX="right"
        anchorY="bottom"
        fontSize={META_SIZE}
        letterSpacing={0.09}
        color="#8b8880"
      >
        {String(project.year)}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#8b8880" />
      </Text>
    </group>
  )
}
