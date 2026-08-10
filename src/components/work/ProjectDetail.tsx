import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { playSfx } from '../../audio/audio'
import { pauseLenis, resumeLenis } from '../../lib/lenisController'
import type { Project } from '../../data/projects'

interface ProjectDetailProps {
  project: Project
  reducedMotion: boolean
  onClose: () => void
  onNext: () => void
}

/** A metadata row in the editorial header. */
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div data-reveal className="border-t border-white/12 pt-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</dt>
      <dd className="mt-1.5 text-sm leading-snug text-white/85">{value}</dd>
    </div>
  )
}

export function ProjectDetail({ project, reducedMotion, onClose, onNext }: ProjectDetailProps) {
  const root = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const { meta, accent, accentAlt } = project

  // Cinematic entrance — the hero expands out of the gallery card so the
  // transition reads as entering the project rather than loading a page.
  useLayoutEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 })
        .fromTo(
          hero.current,
          { scale: 0.28, yPercent: 14, filter: 'brightness(1.5) blur(6px)', autoAlpha: 0 },
          {
            scale: 1,
            yPercent: 0,
            filter: 'brightness(1) blur(0px)',
            autoAlpha: 1,
            duration: 1.15,
            ease: 'expo.out',
          },
          '<',
        )
        .fromTo(
          '[data-reveal]',
          { yPercent: 110, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.045 },
          '-=0.8',
        )
    }, root)
    return () => ctx.revert()
  }, [project.id, reducedMotion])

  const handleClose = () => {
    if (closing.current) return
    closing.current = true
    playSfx('close')
    if (reducedMotion) {
      onClose()
      return
    }
    gsap.to(root.current, {
      autoAlpha: 0,
      scale: 0.97,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: onClose,
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The page behind this overlay is `position: fixed`, so it's invisible but
  // still "there" — without this, the global Lenis smooth-scroll keeps
  // capturing the mouse wheel and applies it to that hidden background page
  // instead of this modal's own scroll container. Pausing Lenis for the
  // lifetime of this component fixes that.
  //
  // Deliberately NOT also locking body scroll (e.g. `body.style.overflow =
  // 'hidden'`) here — that combination (a hidden-overflow body plus a fixed,
  // independently-scrolling modal) is a well-known trap on mobile Safari/
  // Chrome that can freeze scrolling on *both* the body and the modal's own
  // scroll container, and doesn't always cleanly recover when toggled back
  // on close. It's also unnecessary: the modal already fully covers the
  // viewport, so there's nothing for the user to see or scroll behind it.
  useEffect(() => {
    pauseLenis()
    return () => resumeLenis()
  }, [])

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} — project detail`}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: '#05060a' }}
    >
      {/* Per-project atmosphere: layered gradients + blurred colour shapes
          derived from the project's own palette, so no two pages feel alike. */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `
            radial-gradient(120% 80% at 12% -10%, ${accent}55, transparent 60%),
            radial-gradient(90% 70% at 100% 8%, ${accentAlt}40, transparent 62%),
            radial-gradient(140% 110% at 50% 120%, ${accent}22, transparent 70%),
            linear-gradient(180deg, #07080d 0%, #05060a 55%, #04050a 100%)`,
        }}
      />
      <div
        className="pointer-events-none fixed -left-40 top-24 h-[36rem] w-[36rem] rounded-full opacity-30"
        style={{ background: accent, filter: 'blur(180px)' }}
      />
      <div
        className="pointer-events-none fixed -right-40 top-[38rem] h-[32rem] w-[32rem] rounded-full opacity-25"
        style={{ background: accentAlt, filter: 'blur(190px)' }}
      />
      {/* Fine grain so the gradients never look like flat CSS. */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <button
        onClick={handleClose}
        autoFocus
        className="fixed right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur transition hover:scale-105 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Close project"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l12 12M14 2L2 14" />
        </svg>
      </button>

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-28 pt-20 sm:px-10">
        {/* --- editorial header --- */}
        <div className="overflow-hidden">
          <p data-reveal className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/55">
            {meta.industry} — {project.year}
          </p>
        </div>
        <div className="mt-4 overflow-hidden">
          <h1
            data-reveal
            className="font-display text-[clamp(3rem,11vw,9rem)] font-light leading-[0.88] tracking-[-0.03em] text-white"
          >
            {project.title}
          </h1>
        </div>
        <div className="mt-6 max-w-3xl overflow-hidden">
          <p data-reveal className="font-display text-xl font-light leading-snug text-white/80 sm:text-2xl">
            {project.summary}
          </p>
        </div>

        {project.caseStudyUrl && (
          <div data-reveal className="mt-8 overflow-hidden">
            <a
              href={project.caseStudyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/5 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85 backdrop-blur transition hover:border-white/50 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Complete case study
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4M8.5 3.5V8" />
              </svg>
            </a>
          </div>
        )}

        <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
          <Meta label="Client" value={project.client} />
          <Meta label="Collaboration" value={meta.partner} />
          <Meta label="Industry" value={meta.industry} />
          <Meta label="Region" value={meta.region} />
          <Meta label="Year" value={String(project.year)} />
          <Meta label="Duration" value={meta.duration} />
          <Meta label="Role" value={meta.role} />
          <Meta label="Scope" value={meta.scope} />
          <Meta label="Services" value={meta.services.join(', ')} />
          <Meta label="Deliverables" value={meta.deliverables.join(', ')} />
          <Meta label="Technologies" value={meta.technologies.join(', ')} />
          {meta.awards.length > 0 && <Meta label="Recognition" value={meta.awards.join(' · ')} />}
        </dl>

        {/* --- hero --- */}
        <div
          ref={hero}
          className="mt-16 aspect-[16/10] w-full origin-center overflow-hidden rounded-2xl border border-white/10 bg-black/40"
          style={{ willChange: 'transform', boxShadow: `0 40px 120px -40px ${accent}80` }}
        >
          <img
            src={project.hero}
            alt={`${project.title} for ${project.client}`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* --- narrative --- */}
        <div className="mt-24 grid gap-x-12 gap-y-10 border-t border-white/12 pt-14 md:grid-cols-[220px_1fr]">
          <h3 data-reveal className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Overview
          </h3>
          <p data-reveal className="max-w-2xl text-lg leading-relaxed text-white/75">
            {project.client} came to us wanting more than a website — they wanted a moment. We began
            with a single organising idea and pressure-tested it in code within the first week, so
            concept and craft could evolve hand in hand rather than in sequence.
          </p>

          <h3 data-reveal className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            The work
          </h3>
          <p data-reveal className="max-w-2xl text-lg leading-relaxed text-white/75">
            The result pairs a bespoke {project.category[0].toLowerCase()} system with a real-time
            rendering pipeline, custom shaders, and a motion language tuned frame by frame. Every
            transition is designed to feel inevitable — nothing arbitrary, nothing wasted.
          </p>
        </div>

        {/* --- gallery --- */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          <div data-reveal className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 sm:col-span-2">
            <img
              src={project.gallery?.[0] || project.hero}
              alt={`${project.title} — full-bleed still`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div data-reveal className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
            <img
              src={project.gallery?.[1] || project.thumb}
              alt={`${project.title} — detail`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div
            data-reveal
            className="flex aspect-[4/3] flex-col justify-end rounded-xl border border-white/12 p-6"
            style={{ background: `linear-gradient(160deg, ${accent}33, ${accentAlt}11 60%, transparent)` }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Outcome</p>
            <p className="mt-3 text-lg leading-relaxed text-white/85">
              Launched to a global audience with zero jank
              {meta.awards.length > 0 ? `, ${meta.awards[0]},` : ','} and a measurable lift in
              time-on-page for {project.client}.
            </p>
          </div>
        </div>

        <div className="mt-20 flex items-center justify-between border-t border-white/12 pt-8">
          <button
            onClick={handleClose}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ← Back to work
          </button>
          <button
            onClick={() => {
              playSfx('nav')
              onNext()
            }}
            className="group flex items-center gap-3 font-display text-xl font-light text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Next project
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
