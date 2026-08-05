import { useRef } from 'react'

/**
 * Pure CSS-animation infinite marquee — guaranteed to scroll regardless of
 * overflow behaviour. Two copies of the strip sit side-by-side; the animation
 * shifts the whole track left by exactly one copy's width (50% of the container),
 * then snaps back seamlessly.
 */

const SHOTS = [
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Studio, 6am — the only quiet hour', year: '2024' },
  { src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Sketchbook before software, always', year: '2023' },
  { src: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Workshop week in Bengaluru', year: '2023' },
  { src: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Talking type at a meet-up', year: '2022' },
  { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Coast road, camera in the bag', year: '2022' },
  { src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=700&h=900&fit=crop&auto=format&q=80', caption: 'Late review, better coffee', year: '2021' },
]

export function SelfCarousel({ accent }: { accent: string }) {
  return (
    <div className="-mx-6 overflow-hidden sm:-mx-10">
      {/* The track is 200% wide (two copies). The animation moves it -50% (= one copy). */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          width: 'max-content',
          animation: 'marquee-left 38s linear infinite',
        }}
      >
        {/* copy 1 */}
        {SHOTS.map((s) => (
          <PhotoCard key={`a-${s.src}`} shot={s} accent={accent} />
        ))}
        {/* copy 2 — seamless repeat */}
        {SHOTS.map((s) => (
          <PhotoCard key={`b-${s.src}`} shot={s} accent={accent} aria-hidden />
        ))}
      </div>
    </div>
  )
}

function PhotoCard({
  shot,
  accent,
  'aria-hidden': ariaHidden,
}: {
  shot: { src: string; caption: string; year: string }
  accent: string
  'aria-hidden'?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const narrow = 'clamp(140px, 16vw, 210px)'
  const wide = 'clamp(260px, 28vw, 340px)'

  return (
    <div
      ref={ref}
      aria-hidden={ariaHidden}
      className="relative shrink-0 overflow-hidden"
      style={{
        width: narrow,
        height: 'clamp(300px, 54vh, 560px)',
        borderRadius: '14px',
        transition: 'width 540ms cubic-bezier(.16,1,.3,1)',
      }}
      onMouseEnter={() => {
        if (ref.current) ref.current.style.width = wide
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.width = narrow
      }}
    >
      <img
        src={shot.src}
        alt={shot.caption}
        draggable={false}
        className="h-full w-full object-cover"
        style={{ transition: 'transform 700ms cubic-bezier(.16,1,.3,1)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 52%, transparent 70%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: accent }}>
          {shot.year}
        </p>
        <p className="mt-1 text-sm leading-snug text-white/85">{shot.caption}</p>
      </div>
    </div>
  )
}
