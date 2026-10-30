import { useEffect, useMemo, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  DoubleSide,
  FrontSide,
  Group,
  MathUtils,
  type MeshBasicMaterial,
  Texture,
} from 'three'
import { CARD_W, CARD_H } from './layout'
import { dragState } from './dragState'
import { tagRowTexture } from './tagTexture'
import { acquireCoverTexture, type CoverTexture } from './coverTexture'
import { disciplineTags } from '../../data/tags'
import { getCoverMedia, type MediaItem } from '../../data/media'
import type { Project } from '../../data/projects'

// --- card geometry -------------------------------------------------------
// Metadata sits in the four corners and the image floats in the middle with
// generous breathing room on every side, as in the reference layout.
const EDGE = 0.17 // gutter from the card edge to the metadata
const PAD_X = 0.5 // horizontal padding around the image
const PAD_TOP = 0.62 // space above the image (below the top metadata row)
const PAD_BOTTOM = 0.82 // space below the image (above the tag row)

const IMG_W = CARD_W - PAD_X * 2
const IMG_H = CARD_H - PAD_TOP - PAD_BOTTOM
const IMG_CENTER_Y = CARD_H / 2 - PAD_TOP - IMG_H / 2

const TEXT_L = -CARD_W / 2 + EDGE
const TEXT_R = CARD_W / 2 - EDGE
const ROW_TOP = CARD_H / 2 - EDGE
const ROW_BOTTOM = -CARD_H / 2 + EDGE

const META_SIZE = 0.115
const TAG_H = 0.18
const TAG_W = CARD_W - EDGE * 2 - 0.62

const STROKE = 0.03 // hairline frame width

/** Share decoded animated covers across repeated cards in the wall. */
function useAsyncTexture(media: MediaItem | null): { texture: Texture | null; tick: () => void } {
  const [texture, setTexture] = useState<Texture | null>(null)
  const cover = useRef<CoverTexture | null>(null)
  const url = media?.url ?? ''
  const type = media?.type ?? 'image'

  useEffect(() => {
    setTexture(null)
    cover.current = null
    if (!url) return
    let active = true
    const resource = acquireCoverTexture({ url, type })
    void resource.ready.then((loaded) => {
      if (!active) return
      cover.current = loaded
      setTexture(loaded.texture)
    }, (error: unknown) => {
      if (active) console.warn('Unable to load project cover', error)
    })
    return () => {
      active = false
      cover.current = null
      resource.release()
    }
  }, [url, type])

  return { texture, tick: () => cover.current?.tick() }
}

interface ProjectCardProps {
  project: Project
  cardKey: string
  hovered: boolean
  focused: boolean
  onHover: (key: string | null) => void
  onSelect: (id: string, key: string) => void
}

/** A neutral card with unmodified cover colors and readable metadata. */
export function ProjectCard({ project, cardKey, hovered, focused, onHover, onSelect }: ProjectCardProps) {
  const inner = useRef<Group>(null)
  const image = useRef<MeshBasicMaterial>(null)
  // Spring state for the lift (position.z) — critically-damped-ish feel.
  const lift = useRef({ v: 0, x: 0 })

  const cover = useMemo(() => getCoverMedia(project ?? {}), [project])
  const { texture: tex, tick: tickCoverTexture } = useAsyncTexture(cover)
  const tags = useMemo(() => tagRowTexture(disciplineTags(project), TAG_W / TAG_H), [project])
  const tagHeight = TAG_H * (tags.rows + (tags.rows - 1) * 0.2)
  const source = tex?.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined
  const sourceWidth = source?.videoWidth || source?.width || IMG_W
  const sourceHeight = source?.videoHeight || source?.height || IMG_H
  const aspect = sourceWidth / sourceHeight
  const coverWidth = Math.min(IMG_W, IMG_H * aspect)
  const coverHeight = Math.min(IMG_H, IMG_W / aspect)

  useEffect(() => {
    if (!image.current) return
    image.current.map = tex
    image.current.color.set(tex ? '#ffffff' : (project?.accent ?? '#888888'))
    image.current.needsUpdate = true
  }, [tex, project?.accent])

  useFrame((_, delta) => {
    tickCoverTexture()
    const g = inner.current
    if (!g) return
    const k = 1 - Math.pow(0.0015, delta)

    // Preserve the focused-card transition without changing cover colors.
    const targetZ = focused ? 3.4 : 0
    const s = lift.current
    const dt = Math.min(delta, 1 / 30)
    const STIFF = 150
    const DAMP = 22
    s.v += (-STIFF * (s.x - targetZ) - DAMP * s.v) * dt
    s.x += s.v * dt
    g.position.z = s.x

    const targetScale = focused ? 2.3 : 1
    g.scale.setScalar(MathUtils.lerp(g.scale.x, targetScale, k))
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
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        // A drag that passed the threshold must never open a project.
        if (dragState.moved) return
        onSelect(project.id, cardKey)
      }}
    >
      {/* always-on thin grey stroke frame — distinguishes adjacent cards */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[CARD_W + STROKE * 2, CARD_H + STROKE * 2]} />
        <meshBasicMaterial color={hovered ? '#777985' : '#30323b'} side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* A neutral, opaque panel keeps metadata readable at every position. */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial color="#0c0d12" side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* generously padded thumbnail, floating in the middle of the card */}
      <mesh position={[0, IMG_CENTER_Y, 0.01]}>
        <planeGeometry args={[coverWidth, coverHeight]} />
        <meshBasicMaterial ref={image} color={project.accent} side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* top-left: client */}
      <Text
        position={[TEXT_L, ROW_TOP, 0.02]}
        anchorX="left"
        anchorY="top"
        fontSize={META_SIZE * 1.16}
        color="#ffffff"
        maxWidth={CARD_W * 0.42}
      >
        {project.client}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#ffffff" />
      </Text>

      {/* top-right: project title */}
      <Text
        position={[TEXT_R, ROW_TOP, 0.02]}
        anchorX="right"
        anchorY="top"
        textAlign="right"
        fontSize={META_SIZE}
        lineHeight={1.18}
        letterSpacing={0.03}
        color="#f1f3f7"
        maxWidth={CARD_W * 0.52}
      >
        {project.title.toUpperCase()}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#f1f3f7" />
      </Text>

      {/* bottom-left: discipline tags */}
      <mesh position={[TEXT_L + (tagHeight * tags.aspect) / 2, ROW_BOTTOM + tagHeight / 2, 0.02]}>
        <planeGeometry args={[tagHeight * tags.aspect, tagHeight]} />
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
        letterSpacing={0.03}
        color="#cbd0da"
      >
        {String(project.year)}
        <meshBasicMaterial side={FrontSide} toneMapped={false} color="#cbd0da" />
      </Text>
    </group>
  )
}
