import { playSfx } from '../../audio/audio'
import { NAV, type Route } from '../pages/routes'

const GLASS = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
} as const

/**
 * The persistent Apple-glass tab bar. Fixed to the viewport so it rides along on
 * the long scrolling pages as well as the fixed-height gallery.
 */
export function BottomNav({
  active,
  onNavigate,
}: {
  active: Route
  onNavigate: (route: Route) => void
}) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
        style={GLASS}
      >
        {NAV.map((item) => (
          <button
            key={item.route}
            onClick={() => {
              playSfx('nav')
              onNavigate(item.route)
            }}
            aria-current={active === item.route ? 'page' : undefined}
            className={`rounded-full px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              active === item.route
                ? 'bg-white text-black shadow-sm'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
