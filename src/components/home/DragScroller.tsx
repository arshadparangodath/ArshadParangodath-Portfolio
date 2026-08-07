import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

/**
 * Auto-scrolling infinite rail using translate3d — the same technique as
 * TechMarquee. Two copies of children sit side by side; x advances left until
 * it equals one copy's width, then jumps back to 0. No scrollLeft involved,
 * so this works regardless of overflow or flex quirks in any browser.
 *
 * Drag gesture pauses the auto-scroll and lets the user throw the rail.
 * A drag of > 6 px suppresses the subsequent click so cards don't open
 * when the user is just scrubbing.
 */
export function DragScroller({
  children,
  speed = 26,
  className = '',
  gapClassName = 'gap-8',
  label,
  showScrollbar = false,
  noPauseOnHover = false,
}: {
  children: ReactNode
  speed?: number
  className?: string
  gapClassName?: string
  label?: string
  showScrollbar?: boolean
  noPauseOnHover?: boolean
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const x = useRef(0)
  const paused = useRef(false)
  const drag = useRef({ active: false, startX: 0, startOffset: 0, moved: false })
  const [thumbLeft, setThumbLeft] = useState(0)
  const [thumbW, setThumbW] = useState(0.25)

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now

      if (!paused.current && !drag.current.active) {
        x.current -= speed * dt
      }

      // Seamless wrap: jump back by one copy's width.
      const w = inner.current?.offsetWidth ?? 0
      if (w > 0) {
        if (-x.current >= w) x.current += w
        if (x.current > 0) x.current = 0
      }

      if (track.current) {
        track.current.style.transform = `translate3d(${x.current}px, 0, 0)`
      }

      if (showScrollbar && w > 0 && viewport.current) {
        const vw = viewport.current.offsetWidth
        const frac = (-x.current % w) / w
        setThumbLeft(frac)
        setThumbW(Math.min(vw / w, 0.5))
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed, showScrollbar])

  // Attach a non-passive wheel listener so we can prevent default and scroll
  // the carousel horizontally with the mouse wheel.
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      // Prefer horizontal delta; fall back to vertical so a standard scroll
      // wheel also pans the carousel left/right.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return
      e.preventDefault()
      x.current -= delta * 1.2
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Note: pointer capture is intentionally NOT taken here. Capturing on
    // every pointerdown (including a plain click) retargets the resulting
    // synthetic `click` event to this element instead of the button that was
    // actually clicked — per the Pointer Events spec, once an element holds
    // pointer capture, compatibility mouse/click events are redirected to it.
    // That silently broke clicks on cards. We only capture once we've
    // confirmed an actual drag, in onPointerMove below.
    drag.current = { active: true, startX: e.clientX, startOffset: x.current, moved: false }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(dx) > 10) {
      drag.current.moved = true
      // Now that we know this is a real drag (not a click), capture the
      // pointer so the rest of the gesture tracks correctly even if the
      // cursor leaves the viewport.
      try {
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
      } catch {
        /* pointer may already be gone — safe to ignore */
      }
    }
    if (drag.current.moved) {
      x.current = drag.current.startOffset + dx
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    drag.current.active = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    }
    // Defer reset so the click event (which fires right after pointerup) can
    // still read the moved flag before we clear it.
    requestAnimationFrame(() => { drag.current.moved = false })
  }, [])

  return (
    <div className="relative">
      {/* Clip the overflowing track without disrupting layout. */}
      <div
        ref={viewport}
        aria-label={label}
        className={`overflow-hidden ${className}`}
        onPointerEnter={() => { if (!noPauseOnHover) paused.current = true }}
        onPointerLeave={() => { paused.current = false }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // Suppress click if the user was dragging (moved more than threshold).
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      onClick={(e) => {
          // Secondary guard: never let a dragged interaction reach children.
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        style={{ cursor: drag.current.active ? 'grabbing' : 'grab' }}
      >
        {/* The moving strip — two copies for seamless looping. */}
        <div ref={track} className={`flex w-max will-change-transform ${gapClassName}`}>
          <div ref={inner} className={`flex shrink-0 ${gapClassName}`}>
            {children}
          </div>
          <div className={`flex shrink-0 ${gapClassName}`} aria-hidden>
            {children}
          </div>
        </div>
      </div>

      {showScrollbar && (
        <div className="mx-6 mt-5 h-px bg-white/10 sm:mx-10">
          <div
            className="h-full bg-white/40"
            style={{
              position: 'relative',
              left: `${thumbLeft * 100}%`,
              width: `${thumbW * 100}%`,
              transition: 'left 80ms linear',
            }}
          />
        </div>
      )}
    </div>
  )
}
