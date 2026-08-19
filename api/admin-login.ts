import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Verifies the CMS login server-side against ADMIN_USER / ADMIN_PASS
 * environment variables. Previously these credentials were hardcoded
 * directly in the client component and compared in the browser — anyone
 * could read them straight out of the shipped JS bundle. Now the real
 * values only ever live in Vercel's environment variables.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { user, pass } = (req.body ?? {}) as { user?: string; pass?: string }

  if (
    process.env.ADMIN_USER &&
    process.env.ADMIN_PASS &&
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS
  ) {
    res.status(200).json({ ok: true })
  } else {
    res.status(401).json({ ok: false })
  }
}
