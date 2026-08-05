import { useEffect, useRef, useState } from 'react'

import { TECH_ICONS } from './techIcons'

const SPEED = 42 // px per second at full tilt

/**
 * An endlessly drifting band of tool names. Two identical tracks sit side by
 * side and the offset wraps at one track's width, so the loop is seamless.
 * Hovering eases the drift down to a crawl rather than stopping it dead.
 */
export function TechMarquee() {
  const track = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [slow, setSlow] = useState(false)
  const slowRef = useRef(false)
  slowRef.current = slow

  useEffect(() => {
    let raf = 0
    let x = 0
    let last = performance.now()
    let rate = SPEED

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      // Ease the rate toward its target so hover-in/out is not a jolt.
      rate += ((slowRef.current ? SPEED * 0.16 : SPEED) - rate) * Math.min(dt * 5, 1)
      x -= rate * dt
      const w = inner.current?.offsetWidth ?? 0
      if (w > 0 && -x >= w) x += w
      if (track.current) track.current.style.transform = `translate3d(${x}px,0,0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section
      className="relative overflow-hidden border-y border-white/[0.07] py-14"
      aria-label="Tools and technologies"
      onPointerEnter={() => setSlow(true)}
      onPointerLeave={() => setSlow(false)}
      style={{
        // soft edges so names dissolve rather than clip
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div ref={track} className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? inner : undefined}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1}
          >
            {TECH_ICONS.map((icon) => (
              <span
                key={icon.name}
                className="px-9 text-white/50 transition-colors duration-300 hover:text-white"
                title={icon.name}
              >
                <svg
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label={icon.name}
                  className="h-9 w-9 sm:h-11 sm:w-11"
                >
                  {icon.glyph}
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
