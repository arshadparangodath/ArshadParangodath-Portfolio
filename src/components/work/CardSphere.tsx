import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import { buildPool, CELL_W, CELL_H, COLS, ROWS, CAMERA_Z, DRAG_ZOOM_OUT } from './layout'
import { dragState, DRAG_THRESHOLD } from './dragState'
import { useProjects } from '../../hooks/useProjects'
import { ProjectCard } from './ProjectCard'

const FRICTION = 0.94
const DRAG = 0.04 // px → surface units
const MAX_VEL = 0.28

interface CardSphereProps {
  hoveredKey: string | null
  selectedKey: string | null
  activeFilter: string | null
  reducedMotion: boolean
  onHover: (key: string | null) => void
  onSelect: (id: string, key: string) => void
}

/**
 * An infinite flat wall of cards. Drag pans a virtual offset in a straight
 * line in both axes (plain 2D translation — no spherical trigonometry); every
 * frame each pooled card is mapped to the nearest logical cell around the
 * current view centre and placed on a flat plane facing the camera, so the
 * grid wraps endlessly in both directions. The curved "inside a barrel" look
 * comes entirely from the BarrelDistortion post-process wrapping this scene,
 * not from the cards' actual 3D placement.
 */
export function CardSphere({
  hoveredKey,
  selectedKey,
  activeFilter,
  reducedMotion,
  onHover,
  onSelect,
}: CardSphereProps) {
  const { gl } = useThree()
  const all = useProjects()
  // Filtering rebuilds the wall from the matching projects, so the gallery
  // only ever contains work in the active discipline.
  const pool = useMemo(() => {
    const list =
      activeFilter === null ? all : all.filter((p) => p.category.includes(activeFilter))
    return buildPool(list.length > 0 ? list : all)
  }, [all, activeFilter])
  const groups = useRef<(Group | null)[]>([])

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    offX: 0,
    offY: 0,
    velX: 0,
    velY: 0,
    ptrX: 0, // normalised pointer, for camera parallax
    ptrY: 0,
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e: PointerEvent) => {
      s.dragging = true
      s.moved = false
      s.lastX = s.startX = e.clientX
      s.lastY = s.startY = e.clientY
      dragState.active = true
      dragState.moved = false
      el.setPointerCapture?.(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      s.ptrX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.ptrY = ((e.clientY - rect.top) / rect.height) * 2 - 1
      if (!s.dragging) return

      // Once the gesture passes the threshold it is permanently a drag.
      if (!s.moved && Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > DRAG_THRESHOLD) {
        s.moved = true
        dragState.moved = true
      }

      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = MathUtils.clamp(-dx * DRAG, -MAX_VEL, MAX_VEL)
      s.velY = MathUtils.clamp(dy * DRAG, -MAX_VEL, MAX_VEL)
    }
    const up = (e: PointerEvent) => {
      s.dragging = false
      dragState.active = false
      el.releasePointerCapture?.(e.pointerId)
      // Keep `moved` set through the click event that follows, then clear it.
      window.setTimeout(() => {
        dragState.moved = false
      }, 0)
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  useFrame((rs, delta) => {
    const s = state.current
    const frozen = selectedKey !== null

    // Cinematic camera parallax — the whole space shifts gently with the mouse.
    if (!reducedMotion) {
      const t = rs.clock.elapsedTime
      const k = 1 - Math.pow(0.02, delta)
      const px = frozen ? 0 : s.ptrX * 0.16 + Math.sin(t * 0.19) * 0.025
      const py = frozen ? 0 : -s.ptrY * 0.12 + Math.cos(t * 0.15) * 0.025
      rs.camera.position.x = MathUtils.lerp(rs.camera.position.x, px, k)
      rs.camera.position.y = MathUtils.lerp(rs.camera.position.y, py, k)
      rs.camera.lookAt(px * 0.175, py * 0.175, 0)
    }

    // Hold-to-zoom-out: the camera eases back slightly while actively
    // dragging, and eases back in on release.
    const zTarget = CAMERA_Z + (s.dragging ? DRAG_ZOOM_OUT : 0)
    const zk = 1 - Math.pow(0.001, delta)
    rs.camera.position.z = MathUtils.lerp(rs.camera.position.z, zTarget, zk)

    if (!frozen) {
      if (!s.dragging) {
        s.velX *= FRICTION
        s.velY *= FRICTION
      }
      s.offX += s.velX
      s.offY += s.velY
    }

    const colCenter = s.offX / CELL_W
    const rowCenter = s.offY / CELL_H

    for (let i = 0; i < pool.length; i++) {
      const g = groups.current[i]
      if (!g) continue
      const { ci, ri } = pool[i]

      // Nearest logical cell (wraps every COLS / ROWS steps around the centre).
      const logicalCol = ci + COLS * Math.round((colCenter - ci) / COLS)
      const logicalRow = ri + ROWS * Math.round((rowCenter - ri) / ROWS)

      const sx = logicalCol * CELL_W - s.offX
      const sy = logicalRow * CELL_H - s.offY

      // Flat placement — a straight-line 2D grid. All the "curved wall" look
      // comes from the BarrelDistortion post-process, not from this position.
      g.position.set(sx, sy, 0)
      g.quaternion.identity()
    }
  })

  return (
    <>
      {pool.map((card, i) => (
        <group key={card.key} ref={(el) => (groups.current[i] = el)}>
          <ProjectCard
            project={card.project}
            cardKey={card.key}
            hovered={hoveredKey === card.key}
            dimmed={false}
            focused={selectedKey === card.key}
            onHover={onHover}
            onSelect={onSelect}
          />
        </group>
      ))}
    </>
  )
}
