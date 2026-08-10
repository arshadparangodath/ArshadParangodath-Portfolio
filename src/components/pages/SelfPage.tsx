import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/audio'
import { EMAIL, type Route } from './routes'
import { Reveal } from './motion'
import { SelfCarousel } from './SelfCarousel'
import { SiteFooter } from './SiteFooter'
import { BottomNav } from '../ui/BottomNav'
import { SiteHeader } from '../ui/SiteHeader'
import { AdminGate } from '../admin/AdminGate'

/**
 * Self is the story behind the work — where I came from, how I think, and the
 * résumé facts underneath. Its warm ink-and-amber palette sets it apart from
 * the near-black Home and Works pages.
 */

const STORY = [
  {
    heading: 'It started with curiosity',
    body: 'I never followed a traditional design path. I\'m a self-taught designer from Kerala who started by exploring graphic design out of pure curiosity. Every tutorial, every project, and every mistake became part of my learning process. That curiosity still drives everything I create today.',
  },
  {
    heading: 'More than just UI/UX',
    body: 'Over the years, I\'ve worked across branding, visual design, motion graphics, and product design. Being a multidisciplinary designer has taught me to look beyond individual screens and think about the complete experience—from the first impression to the final interaction.',
  },
  {
    heading: 'How I solve problems',
    body: 'I believe every design challenge has a solution. I start by understanding the problem, sketch ideas quickly, prototype early, and refine through feedback. My biggest strength is adaptability—I enjoy learning new tools, technologies, and workflows whenever they help create a better product.',
  },
  {
    heading: 'What I believe',
    body: 'Good design isn\'t about making things look beautiful—it\'s about making them feel effortless. I value simplicity, clarity, accessibility, and performance in every product I design. If an experience solves a real problem while feeling intuitive, then it\'s doing its job.',
  },
]

const FUN = [
  'I own more fountain pens than I can reasonably justify.',
  'I shoot on a 1978 rangefinder and develop at home, badly.',
  'I cook a decent biryani and an indefensible pasta.',
  'I can name a typeface from three letters roughly 70% of the time.',
  'I run at 5am mostly to be somewhere with no screens.',
  'My first website was a Geocities page about cricket statistics.',
]

const EXPERIENCE = [
  {
    role: 'Brand & Motion Designer',
    org: 'MyD Bucket — Remote(Dubai)',
    period: '2025 — Present',
    years: '1 yrs',
    points: [
      'Crafted brand identities, website visuals, and motion experiences.',
      'Designed intuitive UI/UX interfaces with a focus on clarity and usability.',
      'Produced AI-powered creatives, animations, and premium visual assets.',
    ],
  },
  {
    role: 'Founding Designer',
    org: 'Healine — Remote (Dubai)',
    period: '2024 — 2025',
    years: '1 yrs',
    points: [
      'Led the end-to-end product design as the Founding Designer, transforming early ideas into a scalable healthcare platform through user research, UX strategy, wireframing, prototyping, and high-fidelity UI design.',
      'Built and maintained the complete design ecosystem, including the design system, brand identity, marketing creatives, website design, motion graphics, and product animations, ensuring a cohesive experience across every touchpoint.',
      'Collaborated closely with founders and developers throughout the product lifecycle, rapidly iterating on feedback, defining product direction, and delivering production-ready designs that accelerated development and business growth.',
    ],
  },
  {
    role: 'Interaction Designer',
    org: 'Studio Field — Bengaluru',
    period: '2018 — 2020',
    years: '2 yrs',
    points: [
      'Designed and built product interfaces for early-stage SaaS teams.',
      'Established the studio’s first component library and accessibility baseline.',
    ],
  },
  {
    role: 'Junior Designer',
    org: 'Freelance — Kerala',
    period: '2014 — 2018',
    years: '4 yrs',
    points: [
      'Brand identities, print collateral, and small marketing sites for local businesses and musicians.',
      'Self-taught HTML, CSS, and JavaScript while completing a design degree.',
    ],
  },
]

const EDUCATION = [
  {
    title: 'B.Des — Communication Design',
    org: 'National Institute of Design',
    period: '2014 — 2018',
    note: 'Graduated with distinction. Thesis on kinetic typography in digital interfaces.',
  },
  {
    title: 'Foundation — Visual Arts',
    org: 'Kerala Institute of Fine Arts',
    period: '2013 — 2014',
    note: 'Drawing, colour theory, and printmaking fundamentals.',
  },
]

const CERTIFICATIONS = [
  { title: 'Advanced WebGL & Shader Programming', org: 'Three.js Journey', year: '2023' },
  { title: 'Creative Coding with GLSL', org: 'School of Motion', year: '2022' },
  { title: 'Accessibility for Web Practitioners', org: 'Deque University', year: '2022' },
  { title: 'Motion Design Fundamentals', org: 'Motion Design School', year: '2021' },
  { title: 'Google UX Design Professional', org: 'Google / Coursera', year: '2020' },
]

const SKILLS = [
  {
    group: 'Design',
    items: [
      { name: 'Art direction', level: 92 },
      { name: 'Typography', level: 95 },
      { name: 'Motion design', level: 90 },
      { name: 'Design systems', level: 88 },
    ],
  },
  {
    group: 'Engineering',
    items: [
      { name: 'TypeScript / React', level: 94 },
      { name: 'Three.js / WebGL', level: 89 },
      { name: 'GLSL shaders', level: 78 },
      { name: 'Performance tuning', level: 86 },
    ],
  },
]

const TOOLBOX = [
  'Figma', 'Blender', 'After Effects', 'React', 'Next.js', 'TypeScript',
  'Three.js', 'React Three Fiber', 'GSAP', 'GLSL', 'Tailwind', 'Framer Motion',
  'Node.js', 'Vite', 'Git', 'Spline',
]

const LANGUAGES = [
  { name: 'English', level: 'Fluent' },
  { name: 'Malayalam', level: 'Native' },
  { name: 'Hindi', level: 'Conversational' },
  { name: 'Tamil', level: 'Conversational' },
]

const AMBER = '#c8f135'

export function SelfPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const [cmsOpen, setCmsOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-black text-[#f3ece0]">
      {/* Shared grid atmosphere matching the home page. */}
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
      {/* ── full-viewport split-name hero ── */}
      <SelfHero />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 pt-20 sm:px-10">

        {/* ---------- my story ---------- */}
        <Block label="My story">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
            {STORY.map((s, i) => (
              <Reveal key={s.heading} delay={i * 80}>
                <article className="max-w-xl">
                  <h3 className="font-display text-2xl font-light leading-snug">{s.heading}</h3>
                  <p className="mt-4 leading-relaxed text-[#f3ece0]/65">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Block>

        {/* ---------- photographs ---------- */}
        <Block label="Off the clock">
          <SelfCarousel accent={AMBER} />
        </Block>

        {/* ---------- experience ---------- */}
        <Block label="Experience">
          <div className="relative border-l border-[#f3ece0]/15 pl-8 sm:pl-12">
            {EXPERIENCE.map((e, i) => (
              <Reveal key={e.role} delay={i * 80}>
                <div
                  className="relative"
                  style={{ paddingBottom: i < EXPERIENCE.length - 1 ? '5rem' : 0 }}
                >
                  <span
                    className="absolute -left-[2.35rem] top-2 h-2.5 w-2.5 rounded-full sm:-left-[3.35rem]"
                    style={{ background: AMBER }}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="font-display text-2xl font-light">{e.role}</h3>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f3ece0]/45">
                      {e.period} · {e.years}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: AMBER }}>
                    {e.org}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {e.points.map((p) => (
                      <li key={p} className="flex gap-3 leading-relaxed text-[#f3ece0]/65">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#f3ece0]/40" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Block>

        {/* ---------- education ---------- */}
        <Block label="Education">
          <div className="grid gap-5 sm:grid-cols-2">
            {EDUCATION.map((e, i) => (
              <Reveal key={e.title} delay={i * 80}>
                <div className="h-full rounded-xl border border-[#f3ece0]/15 bg-[#f3ece0]/[0.03] p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#f3ece0]/40">
                    {e.period}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-light">{e.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: AMBER }}>
                    {e.org}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#f3ece0]/60">{e.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Block>

        {/* ---------- certifications ---------- */}
        <Block label="Certifications">
          <div className="divide-y divide-[#f3ece0]/12 border-y border-[#f3ece0]/12">
            {CERTIFICATIONS.map((c, i) => (
              <Reveal key={c.title} delay={i * 55}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 py-5">
                  <h3 className="text-lg font-light">{c.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f3ece0]/45">
                    {c.org} · {c.year}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Block>

        {/* ---------- skills ---------- */}
        <Block label="Skills">
          <div className="grid gap-12 lg:grid-cols-2">
            {SKILLS.map((g, gi) => (
              <div key={g.group}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f3ece0]/40">
                  {g.group}
                </p>
                <div className="mt-5 space-y-5">
                  {g.items.map((s, i) => (
                    <Reveal key={s.name} delay={gi * 60 + i * 70}>
                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-[#f3ece0]/80">{s.name}</span>
                          <span className="font-mono text-[10px] tabular-nums text-[#f3ece0]/40">
                            {s.level}%
                          </span>
                        </div>
                        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#f3ece0]/12">
                          <Bar level={s.level} />
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Reveal>
            <div className="mt-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f3ece0]/40">
                Toolbox
              </p>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {TOOLBOX.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-[#f3ece0]/18 px-4 py-1.5 text-xs text-[#f3ece0]/70 transition hover:border-[#f3ece0]/45 hover:text-[#f3ece0]"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f3ece0]/40">
                Languages
              </p>
              <div className="mt-5 flex flex-wrap gap-x-12 gap-y-3">
                {LANGUAGES.map((l) => (
                  <p key={l.name} className="text-sm text-[#f3ece0]/75">
                    {l.name}
                    <span className="ml-2 text-[#f3ece0]/40">{l.level}</span>
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </Block>

        {/* ---------- fun facts ---------- */}
        <Block label="Small true things">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FUN.map((f, i) => (
              <Reveal key={f} delay={i * 60}>
                <p className="h-full rounded-xl border border-[#f3ece0]/15 bg-[#f3ece0]/[0.03] p-6 text-sm leading-relaxed text-[#f3ece0]/70">
                  {f}
                </p>
              </Reveal>
            ))}
          </div>
        </Block>

        <Reveal>
          <div className="mt-24 flex flex-wrap items-center gap-4 border-t border-[#f3ece0]/15 pt-12">
            <button
              onClick={() => {
                playSfx('nav')
                onNavigate('contact')
              }}
              className="rounded-full px-8 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-[#100d08] transition hover:opacity-85"
              style={{ background: AMBER }}
            >
              Get in touch
            </button>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent('Résumé request')}`}
              className="rounded-full border border-[#f3ece0]/25 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-[#f3ece0]/80 transition hover:border-[#f3ece0]/60 hover:text-[#f3ece0]"
            >
              Request full CV
            </a>
          </div>
        </Reveal>
      </div>

      <SiteFooter>
        {/* Discreet entry to the content manager, credentials required. */}
        <div className="flex justify-end px-6 pt-8 sm:px-12 lg:px-16">
          <button
            onClick={() => setCmsOpen(true)}
            aria-label="Content manager"
            className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/[0.14] transition hover:text-white/50"
          >
            ·
          </button>
        </div>
      </SiteFooter>

      {cmsOpen && <AdminGate onClose={() => setCmsOpen(false)} />}
      <SiteHeader onNavigate={onNavigate} />
      <BottomNav active="self" onNavigate={onNavigate} />
    </div>
  )
}

/** Skill meter that fills the first time it scrolls into view. */
function Bar({ level }: { level: number }) {
  return (
    <span
      className="block h-full rounded-full"
      style={{
        width: `${level}%`,
        background: AMBER,
        transformOrigin: 'left',
        animation: 'barIn 1200ms cubic-bezier(.16,1,.3,1) both',
      }}
    />
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-24">
      <Reveal>
        <h2 className="mb-9 font-mono text-[10px] uppercase tracking-[0.28em] text-[#f3ece0]/40">
          {label}
        </h2>
      </Reveal>
      {children}
    </section>
  )
}

/**
 * Full-viewport hero: full-screen B&W photo behind the names.
 * ARSHAD slides in from the left, PARANGODATH from the right.
 * Stats sit below PARANGODATH. No back button, no scroll cue, no label.
 */
function SelfHero() {
  const [entered, setEntered] = useState(false)
  const firstRef = useRef<HTMLSpanElement>(null)
  const lastRef = useRef<HTMLSpanElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0
        const p = Math.min(window.scrollY / window.innerHeight, 1)
        if (firstRef.current) firstRef.current.style.transform = `translateX(${-p * 50}px)`
        if (lastRef.current) lastRef.current.style.transform = `translateX(${p * 50}px)`
        if (imgRef.current) imgRef.current.style.transform = `scale(${1 + p * 0.08})`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section className="relative z-10 h-screen w-full overflow-hidden">
      {/* full-screen B&W photo */}
      <img
        ref={imgRef}
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&h=900&fit=crop&auto=format&q=85"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: 'grayscale(1) brightness(0.45)',
          transformOrigin: 'center',
          opacity: entered ? 1 : 0,
          transition: 'opacity 1200ms ease 200ms',
        }}
      />

      {/* dark vignette so names pop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ARSHAD — left, mid-height */}
      <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 select-none pl-5 sm:pl-10">
        <span
          ref={firstRef}
          className="block font-display font-bold leading-[0.85] tracking-[-0.04em]"
          style={{
            fontSize: 'clamp(4rem, 12vw, 11rem)',
            color: AMBER,
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateX(0)' : 'translateX(-80px)',
            transition: 'opacity 900ms cubic-bezier(.16,1,.3,1) 200ms, transform 900ms cubic-bezier(.16,1,.3,1) 200ms',
          }}
        >
          Arshad
        </span>
      </div>

      {/* PARANGODATH + subtitle + stats — bottom right */}
      <div className="absolute bottom-10 right-0 z-10 select-none pr-5 sm:pr-10">
        <span
          ref={lastRef}
          className="block font-display font-bold leading-[0.85] tracking-[-0.04em]"
          style={{
            fontSize: 'clamp(2.6rem, 7.5vw, 7.5rem)',
            color: AMBER,
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateX(0)' : 'translateX(80px)',
            transition: 'opacity 900ms cubic-bezier(.16,1,.3,1) 350ms, transform 900ms cubic-bezier(.16,1,.3,1) 350ms',
          }}
        >
          Parangodath
        </span>

        {/* subtitle */}
        <p
          className="mt-3 text-right font-mono text-xs uppercase tracking-[0.24em] text-white/55"
          style={{
            opacity: entered ? 1 : 0,
            transition: 'opacity 700ms ease 600ms',
          }}
        >
          Visual Designer · Kerala, India
        </p>

        {/* stats row */}
        <dl
          className="mt-5 flex justify-end gap-8"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 700ms ease 700ms, transform 700ms cubic-bezier(.16,1,.3,1) 700ms',
          }}
        >
          {[
            { n: '3+', l: 'Years' },
            { n: '68', l: 'Projects' },
            { n: '24', l: 'Clients' },
          ].map((s) => (
            <div key={s.l} className="text-right">
              <dt className="font-display text-2xl font-light tabular-nums" style={{ color: AMBER }}>
                {s.n}
              </dt>
              <dd className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
                {s.l}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
