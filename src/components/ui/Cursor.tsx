import { useEffect, useRef, useState } from 'react'
import { dragState } from '../work/dragState'

type Mode = 'default' | 'card' | 'button' | 'grabbing'

/**
 * A custom cursor that eases toward the pointer rather than snapping, with a
 * trailing ring that lags further behind. Reacts to interaction context:
 * project cards show a "View Project" label, buttons get a small halo, and
 * dragging collapses the ring into a grabbing dot.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('default')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Skip entirely on touch-primary devices — there is no cursor to style.
    if (!window.matchMedia('(pointer: fine)').matches) return

    const target = { x: innerWidth / 2, y: innerHeight / 2 }
    const d = { x: target.x, y: target.y }
    const r = { x: target.x, y: target.y }
    let raf = 0

    const move = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      setVisible(true)

      if (dragState.active && dragState.moved) {
        setMode('grabbing')
        return
      }
      const el = e.target as HTMLElement | null
      if (el?.closest('button, a, [role="button"]')) setMode('button')
      else if (el?.tagName === 'CANVAS') setMode('card')
      else setMode('default')
    }

    const loop = () => {
      d.x += (target.x - d.x) * 0.32
      d.y += (target.y - d.y) * 0.32
      r.x += (target.x - r.x) * 0.14
      r.y += (target.y - r.y) * 0.14
      if (dot.current) dot.current.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) translate(-50%, -50%)`
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const leave = () => setVisible(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerout', leave)
    document.documentElement.classList.add('has-custom-cursor')
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerout', leave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  const ringSize = mode === 'card' ? 76 : mode === 'button' ? 46 : mode === 'grabbing' ? 26 : 34

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 250ms ease' }}
    >
      <div
        ref={ring}
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-white/45 backdrop-blur-[1px]"
        style={{
          width: ringSize,
          height: ringSize,
          transition: 'width 420ms cubic-bezier(.16,1,.3,1), height 420ms cubic-bezier(.16,1,.3,1), background-color 300ms ease, border-color 300ms ease',
          backgroundColor: mode === 'grabbing' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)',
          borderColor: mode === 'grabbing' ? 'transparent' : 'rgba(255,255,255,0.45)',
        }}
      >
        <span
          className="select-none whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.18em] text-white"
          style={{
            opacity: mode === 'card' ? 1 : 0,
            transition: 'opacity 260ms ease',
          }}
        >
          View
          <br />
          Project
        </span>
      </div>
      <div
        ref={dot}
        className="absolute left-0 top-0 rounded-full bg-white"
        style={{
          width: 5,
          height: 5,
          opacity: mode === 'card' || mode === 'grabbing' ? 0 : 1,
          transition: 'opacity 260ms ease',
        }}
      />
    </div>
  )
}
