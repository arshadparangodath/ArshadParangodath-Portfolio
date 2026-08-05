import { useCallback, useMemo, useState } from 'react'
import { playSfx } from '../../audio/audio'
import { useProjects } from '../../hooks/useProjects'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Project } from '../../data/projects'
import { BottomNav } from '../ui/BottomNav'
import { SiteHeader } from '../ui/SiteHeader'
import { ScrollLitStatement } from '../home/ScrollLitStatement'
import { TechMarquee } from '../home/TechMarquee'
import { DragScroller } from '../home/DragScroller'
import { ProjectDetail } from '../work/ProjectDetail'
import { ImageReveal, Reveal } from './motion'
import { SiteFooter } from './SiteFooter'
import type { Route } from './routes'

export function HomePage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const projects = useProjects()
  const reducedMotion = useReducedMotion()
  const [openId, setOpenId] = useState<string | null>(null)

  // The home page draws from its own curated collections, falling back to the
  // top of the list if nothing has been flagged in the CMS yet.
  const featured = useMemo(
    () => projects.find((p) => p.collection === 'featured') ?? projects[0],
    [projects],
  )
  const scroller = useMemo(() => {
    const picked = projects.filter((p) => p.collection === 'home')
    return (picked.length > 0 ? picked : projects.slice(1, 7)).slice(0, 6)
  }, [projects])

  const open = useMemo(() => projects.find((p) => p.id === openId) ?? null, [projects, openId])

  const openProject = (p: Project) => {
    playSfx('open')
    setOpenId(p.id)
  }

  const next = useCallback(() => {
    setOpenId((cur) => {
      const i = projects.findIndex((p) => p.id === cur)
      return projects[(i + 1) % projects.length].id
    })
  }, [projects])

  return (
    <div className="relative bg-black text-white">
      {/* A faint grid behind the whole page, fading toward the edges. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '84px 84px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black, transparent 100%)',
        }}
      />

      <div className="relative z-10">
        <ScrollLitStatement />
        <TechMarquee />

        {/* ---------- featured work ---------- */}
        {featured && (
          <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-28 sm:px-10 lg:grid-cols-[60%_1fr] lg:gap-16">
            <button
              onClick={() => openProject(featured)}
              className="group block w-full overflow-hidden text-left"
              aria-label={`Open ${featured.title}`}
            >
              <ImageReveal
                src={featured.hero}
                alt={featured.title}
                className="aspect-[4/3] w-full"
                imgClassName="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
              />
            </button>

            <div>
              <Reveal>
                <h2
                  className="font-display font-semibold leading-[0.86] tracking-[-0.04em] text-white"
                  style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
                >
                  Featured
                  <br />
                  Work
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  {featured.client} — {featured.year}
                </p>
                <h3 className="mt-4 font-display text-3xl font-light tracking-[-0.02em]">
                  {featured.title}
                </h3>
                <p className="mt-5 max-w-md leading-relaxed text-white/60">{featured.summary}</p>
                <button
                  onClick={() => openProject(featured)}
                  className="group mt-9 inline-flex items-center gap-3 border-b border-white/25 pb-2 text-sm text-white/85 transition hover:border-white hover:text-white"
                >
                  View complete case study
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </button>
              </Reveal>
            </div>
          </section>
        )}

        {/* ---------- selected works — 4:3 landscape cards ---------- */}
        <section className="py-20" aria-label="Selected projects">
          <div className="mx-auto flex max-w-7xl items-end justify-between px-6 sm:px-10">
            <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.6rem)] font-light tracking-[-0.03em]">
              Selected projects
            </h2>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-white/30 sm:block">
              Drag to explore
            </p>
          </div>

          <DragScroller
            className="mt-12 px-6 pb-4 sm:px-10"
            gapClassName="gap-8"
            label="Selected projects"
            showScrollbar
            speed={30}
          >
            {scroller.map((p) => (
              <button
                key={p.id}
                onClick={() => openProject(p)}
                className="group w-[86vw] shrink-0 text-left sm:w-[58vw] lg:w-[38vw]"
              >
                <div className="overflow-hidden">
                  <img
                    src={p.hero}
                    alt={p.title}
                    loading="lazy"
                    draggable={false}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-white/10 pt-5">
                  <h3 className="font-display text-2xl font-light tracking-[-0.02em]">{p.title}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    {p.category.join(' · ')}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
                  {[
                    ['Client', p.client],
                    ['Scope', p.meta.scope],
                    ['Role', p.meta.role],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">{k}</dt>
                      <dd className="mt-1.5 text-xs leading-relaxed text-white/65">{v}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            ))}
          </DragScroller>
        </section>

        {/* ---------- gateway to the full gallery ---------- */}
        <section className="px-6 py-32 text-center sm:px-10">
          <button
            onClick={() => {
              playSfx('nav')
              onNavigate('works')
            }}
            className="group inline-block"
          >
            <span
              className="block font-display font-bold leading-[0.9] tracking-[-0.045em] text-white/25 transition-colors duration-500 group-hover:text-white"
              style={{ fontSize: 'clamp(2.6rem, 11vw, 9rem)' }}
            >
              Other works
            </span>
            <span className="mt-6 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 transition group-hover:text-white/80">
              Enter the gallery
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </span>
          </button>
        </section>

        <SiteFooter />
      </div>

      {open && (
        <ProjectDetail
          project={open}
          reducedMotion={reducedMotion}
          onClose={() => setOpenId(null)}
          onNext={next}
        />
      )}

      <SiteHeader onNavigate={onNavigate} />
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  )
}
