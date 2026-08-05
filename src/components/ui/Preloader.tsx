import { useEffect, useRef, useState } from 'react'

const TARGET = 'ARSHAD PARANGODATH'
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@*+=<>/'

/**
 * Launch sequence: random glyphs resolve left-to-right into the name, hold for
 * a beat, then the whole plate zooms toward the viewer and dissolves into the
 * site behind it.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState(() =>
    TARGET.split('').map((c) => (c === ' ' ? ' ' : GLYPHS[0])).join(''),
  )
  const [phase, setPhase] = useState<'scramble' | 'hold' | 'out'>('scramble')
  const done = useRef(false)

  // Resolve one character at a time while scrambling everything to its right.
  useEffect(() => {
    const chars = TARGET.split('')
    let settled = 0
    let frame = 0
    let raf = 0

    const tick = () => {
      frame++
      // Lock in a new character every ~4 frames.
      if (frame % 4 === 0) settled = Math.min(settled + 1, chars.length)

      setText(
        chars
          .map((c, i) => {
            if (c === ' ') return ' '
            if (i < settled) return c
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join(''),
      )

      if (settled < chars.length) raf = requestAnimationFrame(tick)
      else setPhase('hold')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Hold, then play the zoom-out and hand over to the site.
  useEffect(() => {
    if (phase !== 'hold') return
    const t = window.setTimeout(() => setPhase('out'), 520)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'out') return
    const t = window.setTimeout(() => {
      if (!done.current) {
        done.current = true
        onDone()
      }
    }, 1100)
    return () => window.clearTimeout(t)
  }, [phase, onDone])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 900ms cubic-bezier(.7,0,.84,0) 180ms',
        pointerEvents: phase === 'out' ? 'none' : 'auto',
      }}
      aria-label="Loading"
      role="status"
    >
      <span
        className="px-6 text-center font-display font-semibold uppercase text-white"
        style={{
          // Small, tight, gothic — closer to a grotesque logotype than a title.
          fontSize: 'clamp(0.8rem, 2.1vw, 1.5rem)',
          letterSpacing: '0.2em',
          // The zoom that carries the viewer into the site.
          transform: phase === 'out' ? 'scale(3.4)' : 'scale(1)',
          filter: phase === 'out' ? 'blur(9px)' : 'none',
          transition: 'transform 1100ms cubic-bezier(.76,0,.24,1), filter 1100ms ease-in',
        }}
      >
        {/* Fixed-width cells so swapping glyphs never shifts the line. */}
        {text.split('').map((c, i) => (
          <span key={i} className="inline-block text-center" style={{ width: '0.86em' }}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </div>
  )
}
