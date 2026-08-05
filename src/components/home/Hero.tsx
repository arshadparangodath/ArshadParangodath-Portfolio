import { useEffect, useRef } from 'react'

/**
 * The name set very large and cropped by the bottom of the viewport, so only its
 * upper portion is visible at rest. Scrolling lifts it out of frame while the
 * statement section behind it comes up — one continuous move rather than a cut.
 */
export function Hero() {
  const name = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = name.current
    if (!el) return
    let raf = 0
    const measure = () => {
      raf = 0
      // Rise by up to 55% of the viewport over the first screen of scrolling,
      // fading out as it goes.
      const p = Math.min(window.scrollY / window.innerHeight, 1)
      el.style.transform = `translate3d(0, ${-p * 55}vh, 0)`
      el.style.opacity = String(1 - p * 0.9)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section className="relative h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-[34vh] flex justify-center px-6">
        <p className="max-w-md text-center text-sm leading-relaxed text-white/45">
          UI/UX and product design — building interfaces that feel like objects
          rather than documents.
        </p>
      </div>

      {/* Cropped at the bottom edge: the descenders sit below the fold. */}
      <h1
        ref={name}
        className="absolute inset-x-0 bottom-[-14vh] whitespace-nowrap text-center font-display font-semibold leading-[0.8] tracking-[-0.045em] text-white will-change-transform"
        style={{ fontSize: 'clamp(3rem, 14vw, 13rem)' }}
      >
        Arshad Parangodath
      </h1>
    </section>
  )
}
