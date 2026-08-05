import { playSfx } from '../../audio/audio'
import { useSound } from '../../hooks/useSound'
import type { Route } from '../pages/routes'

/**
 * The site header, identical on every page: the wordmark, the sound toggle with
 * its little equaliser, and the Let's Talk button.
 */
export function SiteHeader({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const { soundOn, toggleSound } = useSound()

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 sm:px-10">
      <button
        onClick={() => {
          playSfx('nav')
          onNavigate('home')
        }}
        className="pointer-events-auto flex items-center gap-3"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-sm text-white">
          ✳
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
          ArshadParangodath
        </span>
      </button>

      <div className="pointer-events-auto flex items-center gap-4">
        <button
          onClick={toggleSound}
          aria-pressed={soundOn}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[2px] bg-current"
                style={{
                  height: soundOn ? '100%' : '3px',
                  transformOrigin: 'bottom',
                  animation: soundOn
                    ? `eq 900ms ${i * 130}ms ease-in-out infinite alternate`
                    : 'none',
                }}
              />
            ))}
          </span>
          Sound [{soundOn ? 'on' : 'off'}]
        </button>
        <button
          onClick={() => {
            playSfx('nav')
            onNavigate('contact')
          }}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Let&apos;s Talk
        </button>
      </div>
    </header>
  )
}
