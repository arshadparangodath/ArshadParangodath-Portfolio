import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

/** A finite project rail. Wheel gestures return to the page at either end. */
export function DragScroller({
  children,
  className = '',
  gapClassName = 'gap-8',
  label,
  showScrollbar = false,
}: {
  children: ReactNode
  className?: string
  gapClassName?: string
  label?: string
  showScrollbar?: boolean
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startOffset: 0, moved: false })
  const [progress, setProgress] = useState({ left: 0, width: 1 })

  useEffect(() => {
    const el = viewport.current
    const content = track.current
    if (!el || !content) return

    const updateProgress = () => {
      const max = el.scrollWidth - el.clientWidth
      const width = Math.min(el.clientWidth / Math.max(el.scrollWidth, 1), 1)
      setProgress({ width, left: max > 0 ? (el.scrollLeft / max) * (1 - width) : 0 })
    }
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // Preserve trackpad pinch zoom.
      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const delta = rawDelta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1)
      const max = el.scrollWidth - el.clientWidth
      const canScroll = delta > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1
      if (!delta || max <= 1 || !canScroll) return

      // Keep Lenis from consuming a gesture used by the rail. At a boundary,
      // leave the event untouched so normal page scrolling reaches the footer.
      e.preventDefault()
      e.stopPropagation()
      el.scrollLeft = Math.max(0, Math.min(max, el.scrollLeft + delta))
    }

    const observer = new ResizeObserver(updateProgress)
    observer.observe(el)
    observer.observe(content)
    el.addEventListener('scroll', updateProgress, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    updateProgress()
    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', updateProgress)
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Touch uses native horizontal swipe and vertical page scrolling.
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { active: true, startX: e.clientX, startOffset: e.currentTarget.scrollLeft, moved: false }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(dx) > 10) {
      drag.current.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (drag.current.moved) e.currentTarget.scrollLeft = drag.current.startOffset - dx
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    // Preserve the drag flag until the following click has been suppressed.
    requestAnimationFrame(() => { drag.current.moved = false })
  }, [])

  return (
    <div className="relative">
      <div
        ref={viewport}
        aria-label={label}
        tabIndex={0}
        className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => { if (!drag.current.moved) drag.current.active = false }}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        style={{ cursor: 'grab' }}
      >
        <div ref={track} className={`flex w-max ${gapClassName}`}>
          {children}
        </div>
      </div>
      {showScrollbar && (
        <div className="mx-6 mt-5 h-px bg-white/10 sm:mx-10">
          <div
            className="relative h-full bg-white/40"
            style={{ left: `${progress.left * 100}%`, width: `${progress.width * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
