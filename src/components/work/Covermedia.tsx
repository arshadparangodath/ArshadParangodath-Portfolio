import { useRef, useState } from 'react'
import { useInView } from '../pages/motion'
import type { MediaItem } from '../../data/media'

interface CoverMediaProps {
  media: MediaItem | null
  alt: string
  className?: string
  mediaClassName?: string
  /** Applies the same scale/clip-path scroll-reveal HomePage uses for its
   *  featured image. Off by default. */
  reveal?: boolean
  /** Shows a mute/unmute button for video covers (project detail hero only —
   *  smaller previews elsewhere stay silent with no controls). */
  soundToggle?: boolean
  fallbackColor?: string
}

function MuteIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 6h2.5L8 3v10L4.5 10H2z" />
      {muted ? <path d="M11 6l3 3M14 6l-3 3" /> : <path d="M11 5.5a3.2 3.2 0 010 5M12.6 3.8a5.6 5.6 0 010 8.4" />}
    </svg>
  )
}

/**
 * Renders a project's resolved cover media (from `getCoverMedia()`) as
 * whichever type it actually is — image/gif play as a plain `<img>`, video
 * autoplays muted & looped like a GIF, with an optional mute toggle for
 * places (the project detail hero) where sound is worth offering.
 */
export function CoverMedia({
  media,
  alt,
  className = '',
  mediaClassName = '',
  reveal = false,
  soundToggle = false,
  fallbackColor,
}: CoverMediaProps) {
  const { ref, seen } = useInView<HTMLDivElement>(0.2)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const revealStyle = reveal
    ? {
        transform: seen ? 'scale(1)' : 'scale(1.18)',
        clipPath: seen ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
        transition: 'transform 1500ms cubic-bezier(.16,1,.3,1), clip-path 1200ms cubic-bezier(.16,1,.3,1)',
      }
    : undefined

  if (!media || !media.url) {
    return <div ref={reveal ? ref : undefined} className={className} style={{ background: fallbackColor }} />
  }

  if (media.type === 'video') {
    return (
      <div ref={reveal ? ref : undefined} className={`relative overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          src={media.url}
          className={`h-full w-full object-cover ${mediaClassName}`}
          style={revealStyle}
          autoPlay
          muted={muted}
          loop
          playsInline
          draggable={false}
        />
        {soundToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMuted((m) => !m)
            }}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            <MuteIcon muted={muted} />
          </button>
        )}
      </div>
    )
  }

  // image or gif — GIFs animate natively in a plain <img>, no special handling needed
  return (
    <div ref={reveal ? ref : undefined} className={`overflow-hidden ${className}`}>
      <img
        src={media.url}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`h-full w-full object-cover ${mediaClassName}`}
        style={revealStyle}
      />
    </div>
  )
}
