import { useState } from 'react'
import { ProjectAdmin } from './ProjectAdmin'
import { setAdminToken } from '../../lib/adminAuth'

/**
 * Credential prompt in front of the content manager. Verification now happens
 * server-side (see /api/admin-login) against ADMIN_USER/ADMIN_PASS
 * environment variables — the real credentials no longer live inside the
 * shipped client bundle the way they used to.
 */
export function AdminGate({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  if (unlocked) return <ProjectAdmin onClose={onClose} />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(false)
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      })
      if (res.ok) {
        // Reused as the write-auth token for saves/deletes — see
        // src/lib/adminAuth.ts. Held in memory only, never persisted.
        setAdminToken(pass)
        setUnlocked(true)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
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
            disabled={submitting}
            className="rounded-full bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {submitting ? 'Checking…' : 'Unlock'}
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
