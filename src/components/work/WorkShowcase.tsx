import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { playSfx, duckMusicForDrag, unduckMusicForDrag } from '../../audio/audio'
import { SphereScene } from './SphereScene'
import { ProjectDetail } from './ProjectDetail'
import { BottomNav } from '../ui/BottomNav'
import { SiteHeader } from '../ui/SiteHeader'
import type { Route } from '../pages/routes'

export function WorkShowcase({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const projects = useProjects()
  const reducedMotion = useReducedMotion()
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // While actively holding/dragging the gallery, the background music slows
  // and gets reverbed instead of playing a click sound on every grab/release
  // — the click was firing on every drag gesture and felt repetitive. The
  // "open" click sound (below, in handleSelect) still plays normally when a
  // card is actually clicked to open.
  useEffect(() => {
    const down = () => duckMusicForDrag()
    const up = () => unduckMusicForDrag()
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const handleHover = useCallback((key: string | null) => {
    setHoveredKey((prev) => {
      if (key && key !== prev) playSfx('hover')
      return key
    })
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.category))).sort(),
    [],
  )

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  const handleSelect = useCallback((id: string, key: string) => {
    playSfx('open')
    setSelectedId(id)
    setSelectedKey(key)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedId(null)
    setSelectedKey(null)
  }, [])

  const handleNext = useCallback(() => {
    setSelectedId((cur) => {
      const i = projects.findIndex((p) => p.id === cur)
      return projects[(i + 1) % projects.length].id
    })
  }, [])

  return (
    <section
      className="relative h-screen w-full overflow-hidden bg-[#05060a]"
      aria-label="Selected work"
    >
      <SphereScene
        hoveredKey={hoveredKey}
        selectedKey={selectedKey}
        activeFilter={activeFilter}
        reducedMotion={reducedMotion}
        onHover={handleHover}
        onSelect={handleSelect}
      />

      {/* Edge blur + distortion — two masked, over-scaled backdrop-blur layers.
          The mask ellipses are deliberately narrow on X, tall on Y: this
          keeps roughly 3 columns sharp/legible in the centre while columns
          further out curve into blur (matching the reference), but lets
          more rows stay clear top-to-bottom before the same fade kicks in. */}
      <div
        className="pointer-events-none absolute inset-0 z-10 origin-center"
        style={{
          transform: 'scale(1.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          maskImage:
            'radial-gradient(ellipse 42% 84% at 50% 50%, transparent 34%, rgba(0,0,0,0.6) 70%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 42% 84% at 50% 50%, transparent 34%, rgba(0,0,0,0.6) 70%, black 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 origin-center"
        style={{
          transform: 'scale(1.16)',
          backdropFilter: 'blur(26px) saturate(115%)',
          WebkitBackdropFilter: 'blur(26px) saturate(115%)',
          maskImage:
            'radial-gradient(ellipse 58% 94% at 50% 50%, transparent 52%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 58% 94% at 50% 50%, transparent 52%, black 100%)',
        }}
      />

      {/* Lens glow + edge vignette overlaid on the gallery — same tall-narrow
          shaping as the blur masks above, for a consistent clear window. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(60% 75% at 50% 45%, rgba(80,60,120,0.18), transparent 55%), radial-gradient(78% 135% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <SiteHeader onNavigate={onNavigate} />

      <BottomNav active="works" onNavigate={onNavigate} />

      {/* Filter */}
      <div className="pointer-events-none absolute bottom-8 right-6 z-20 sm:right-10">
        <div className="pointer-events-auto relative">
          {filterOpen && (
            <div
              className="absolute bottom-full right-0 mb-3 w-52 rounded-2xl border border-white/15 p-2 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
              style={{
                background: 'rgba(20,22,30,0.75)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              }}
            >
              <button
                onClick={() => {
                  setActiveFilter(null)
                  setFilterOpen(false)
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.15em] transition hover:bg-white/10 ${
                  activeFilter === null ? 'text-white' : 'text-white/55'
                }`}
              >
                All work
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveFilter(cat)
                    setFilterOpen(false)
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.15em] transition hover:bg-white/10 ${
                    activeFilter === cat ? 'text-white' : 'text-white/55'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              playSfx('click')
              setFilterOpen((o) => !o)
            }}
            aria-expanded={filterOpen}
            className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white/85 transition hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            }}
          >
            {activeFilter ?? 'Filter'}
            <span className="text-white/40">＋</span>
          </button>
        </div>
      </div>

      {/* Keyboard-accessible fallback list */}
      <ul className="sr-only">
        {projects.map((p) => (
          <li key={p.id}>
            <button onClick={() => handleSelect(p.id, `kbd-${p.id}`)}>
              {p.title} — {p.client}, {p.year}. {p.category.join(', ')}. {p.summary}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <ProjectDetail
          project={selected}
          reducedMotion={reducedMotion}
          onClose={handleClose}
          onNext={handleNext}
        />
      )}
    </section>
  )
}
