import type { ReactNode } from 'react'
import { EMAIL, SOCIALS } from './routes'
import { CursorParallax } from './motion'

/**
 * The shared closing footer: a full-bleed horizontal row of social links sitting
 * directly above the oversized mail signature. Both share the same faint
 * opacity and lift to full white on hover, so the block reads as one gesture.
 */
export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/10">
      {children}

      {/* full-width horizontal socials */}
      <nav
        aria-label="Elsewhere"
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-10 sm:px-12 lg:px-16"
      >
        {SOCIALS.filter((s) => s.label !== 'Email').map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/[0.28] transition-colors duration-300 hover:text-white"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* oversized mail signature */}
      {/* extra bottom room so the fixed nav bar never sits on the signature */}
      <div className="overflow-hidden pb-32">
        <CursorParallax strength={10}>
          <a
            href={`mailto:${EMAIL}`}
            aria-label={`Email ${EMAIL}`}
            className="block whitespace-nowrap px-6 text-center font-display font-bold leading-none tracking-[-0.045em] text-white/[0.07] transition-colors duration-500 hover:text-white/20"
            style={{ fontSize: 'clamp(2rem, 8.2vw, 9rem)' }}
          >
            {EMAIL}
          </a>
        </CursorParallax>
      </div>
    </footer>
  )
}
