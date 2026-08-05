import { useState } from 'react'
import { playSfx } from '../../audio/audio'
import { EMAIL, type Route } from './routes'
import { LineReveal, Reveal } from './motion'
import { SiteFooter } from './SiteFooter'
import { BottomNav } from '../ui/BottomNav'
import { SiteHeader } from '../ui/SiteHeader'

const BUDGETS = ['Under $5k', '$5k — $15k', '$15k — $40k', '$40k+', 'Not sure yet']

export function ContactPage({ onNavigate }: { onNavigate: (r: Route) => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    company: '',
    budget: '',
    description: '',
  })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const ready = form.firstName.trim() && form.email.trim() && form.description.trim()

  /** Compose the enquiry into a mail draft addressed to me. */
  const send = () => {
    if (!ready) return
    playSfx('open')
    const subject = `New enquiry — ${form.firstName} ${form.lastName}`.trim()
    const body = [
      `Name: ${form.firstName} ${form.lastName}`.trim(),
      `Email: ${form.email}`,
      form.mobile && `Mobile: ${form.mobile}`,
      form.company && `Company: ${form.company}`,
      form.budget && `Budget: ${form.budget}`,
      '',
      form.description,
    ]
      .filter(Boolean)
      .join('\n')
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-20 sm:px-10">
        <button
          onClick={() => {
            playSfx('nav')
            onNavigate('home')
          }}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          ← Back home
        </button>

        <header className="mt-14">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">
              Contact — available for new work
            </p>
          </Reveal>
          <LineReveal
            lines={['Let’s build', 'something good.']}
            delay={100}
            className="mt-5 font-display text-[clamp(2.6rem,8.5vw,6.5rem)] font-light leading-[0.92] tracking-[-0.035em]"
          />
          <Reveal delay={380}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60">
              Tell me about the project — the idea, the timeline, the thing you are not sure is
              possible. I reply to every message personally, usually within two days.
            </p>
          </Reveal>
        </header>

        <div className="mt-20 grid gap-16 lg:grid-cols-[1.35fr_0.65fr]">
          {/* ---------- form ---------- */}
          <Reveal>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="space-y-7"
            >
              <div className="grid gap-7 sm:grid-cols-2">
                <Input label="First name" required value={form.firstName} onChange={(v) => set('firstName', v)} />
                <Input label="Last name" value={form.lastName} onChange={(v) => set('lastName', v)} />
                <Input label="Email" type="email" required value={form.email} onChange={(v) => set('email', v)} />
                <Input label="Mobile" type="tel" value={form.mobile} onChange={(v) => set('mobile', v)} />
                <Input label="Company" value={form.company} onChange={(v) => set('company', v)} />
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Budget
                  </span>
                  <select
                    value={form.budget}
                    onChange={(e) => set('budget', e.target.value)}
                    className="mt-2 w-full appearance-none border-b border-white/20 bg-transparent py-3 text-base text-white outline-none transition focus:border-white/70"
                  >
                    <option value="" className="bg-[#0b0d14]">
                      Select a range
                    </option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b} className="bg-[#0b0d14]">
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Project description <span className="text-white/25">*</span>
                </span>
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What are you building, and what does success look like?"
                  className="mt-2 w-full resize-y border-b border-white/20 bg-transparent py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/70"
                />
              </label>

              <button
                type="submit"
                disabled={!ready}
                className="group mt-4 flex items-center gap-4 rounded-full bg-white px-9 py-4 text-xs font-medium uppercase tracking-[0.2em] text-black transition enabled:hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Connect with me now
                <span className="transition-transform group-enabled:group-hover:translate-x-1">→</span>
              </button>
              <p className="text-xs text-white/35">
                This opens your mail client with the message pre-filled, addressed to me.
              </p>
            </form>
          </Reveal>

          {/* ---------- details + socials ---------- */}
          <Reveal delay={140}>
            <aside className="space-y-12">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Direct
                </p>
                <a
                  href={`mailto:${EMAIL}`}
                  className="mt-3 block break-all text-lg text-white/85 underline decoration-white/25 underline-offset-4 transition hover:decoration-white"
                >
                  {EMAIL}
                </a>
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  Kozhikode, India — working with teams worldwide.
                  <br />
                  Currently booking projects from next month.
                </p>
              </div>

            </aside>
          </Reveal>
        </div>
      </div>

      <SiteFooter />
      <SiteHeader onNavigate={onNavigate} />
      <BottomNav active="contact" onNavigate={onNavigate} />
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label} {required && <span className="text-white/25">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-base text-white outline-none transition focus:border-white/70"
      />
    </label>
  )
}
