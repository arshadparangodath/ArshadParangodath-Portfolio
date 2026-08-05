import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fires once when the element first scrolls into view. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, seen }
}

/** Fades and lifts its children into place on first view. */
export function Reveal({
  children,
  delay = 0,
  y = 34,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const { ref, seen } = useInView<HTMLDivElement>(0.15)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'none' : `translateY(${y}px)`,
        transition: `opacity 900ms cubic-bezier(.16,1,.3,1) ${delay}ms, transform 1000ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/** A heading whose lines wipe up from behind a mask, staggered. */
export function LineReveal({
  lines,
  className = '',
  delay = 0,
}: {
  lines: string[]
  className?: string
  delay?: number
}) {
  const { ref, seen } = useInView<HTMLDivElement>(0.2)
  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <span
            className="block"
            style={{
              transform: seen ? 'translateY(0)' : 'translateY(110%)',
              transition: `transform 1100ms cubic-bezier(.16,1,.3,1) ${delay + i * 110}ms`,
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </div>
  )
}

/** An image that un-masks and settles from a slight zoom as it enters view. */
export function ImageReveal({
  src,
  alt,
  className = '',
  imgClassName = '',
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  const { ref, seen } = useInView<HTMLDivElement>(0.2)
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${imgClassName}`}
        style={{
          transform: seen ? 'scale(1)' : 'scale(1.18)',
          clipPath: seen ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
          transition: 'transform 1500ms cubic-bezier(.16,1,.3,1), clip-path 1200ms cubic-bezier(.16,1,.3,1)',
        }}
      />
    </div>
  )
}

/** Counts up to a target the first time it is seen. */
export function Counter({
  to,
  suffix = '',
  duration = 1600,
}: {
  to: number
  suffix?: string
  duration?: number
}) {
  const { ref, seen } = useInView<HTMLSpanElement>(0.4)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3)))) // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  )
}

/** Translates its children as the page scrolls, for depth. */
export function Parallax({
  children,
  speed = 0.15,
  className = '',
}: {
  children?: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const mid = r.top + r.height / 2 - window.innerHeight / 2
      el.style.transform = `translate3d(0, ${-mid * speed}px, 0)`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed])
  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

/** Cursor-driven parallax — shifts a few pixels with the pointer. */
export function CursorParallax({
  children,
  strength = 18,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    let raf = 0
    const move = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.06
      cur.y += (target.y - cur.y) * 0.06
      el.style.transform = `translate3d(${cur.x * strength}px, ${cur.y * strength}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener('pointermove', move)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
    }
  }, [strength])
  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

/** A row of images that slides horizontally as the section scrolls past. */
export function ScrollCarousel({
  images,
  reverse = false,
}: {
  images: { src: string; caption: string }[]
  reverse?: boolean
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const w = wrap.current
    const t = track.current
    if (!w || !t) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      const r = w.getBoundingClientRect()
      // 0 → 1 across the whole time the section is on screen.
      const p = 1 - (r.top + r.height) / (window.innerHeight + r.height)
      const travel = Math.max(t.scrollWidth - w.clientWidth, 0)
      const x = reverse ? -travel * (1 - p) : -travel * p
      t.style.transform = `translate3d(${x}px, 0, 0)`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reverse, images.length])

  return (
    <div ref={wrap} className="overflow-hidden">
      <div ref={track} className="flex gap-5 will-change-transform">
        {images.map((im) => (
          <figure key={im.src + im.caption} className="w-[68vw] shrink-0 sm:w-[38vw] lg:w-[26vw]">
            <div className="aspect-[4/5] overflow-hidden rounded-xl border border-white/10">
              <img src={im.src} alt={im.caption} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              {im.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
