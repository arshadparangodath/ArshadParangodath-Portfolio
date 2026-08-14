import { useEffect, useState } from 'react'
import { ProjectAdmin } from './ProjectAdmin'
import { pauseLenis, resumeLenis } from '../../lib/lenisController'

const USER = 'ArshadPrg'
const PASS = 'Winter@123'

/**
 * Credential prompt in front of the content manager. This is a convenience lock
 * on a client-side app, not real security — anyone can read the bundle — so it
 * only keeps the panel out of the way of ordinary visitors.
 */
export function AdminGate({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Both the login form and the CMS panel below are fixed full-screen
  // overlays with their own scroll areas — same reasoning as ProjectDetail:
  // pause the global Lenis smooth-scroll so it doesn't fight the panel's own
  // scrolling for as long as this is mounted.
  useEffect(() => {
    pauseLenis()
    return () => resumeLenis()
  }, [])

  if (unlocked) return <ProjectAdmin onClose={onClose} />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (user === USER && pass === PASS) setUnlocked(true)
    else setError(true)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#0b0d13] p-8"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
          Restricted
        </p>
        <h2 className="mt-3 font-display text-2xl font-light text-white">Content manager</h2>

        <label className="mt-8 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Username
          </span>
          <input
            autoFocus
            autoComplete="username"
            value={user}
            onChange={(e) => {
              setUser(e.target.value)
              setError(false)
            }}
            className="mt-2 w-full border-b border-white/20 bg-transparent py-2.5 text-white outline-none transition focus:border-white/70"
          />
        </label>

        <label className="mt-6 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value)
              setError(false)
            }}
            className="mt-2 w-full border-b border-white/20 bg-transparent py-2.5 text-white outline-none transition focus:border-white/70"
          />
        </label>

        {error && (
          <p role="alert" className="mt-5 text-xs text-red-400">
            Those credentials do not match.
          </p>
        )}

        <div className="mt-9 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/85"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/50 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
