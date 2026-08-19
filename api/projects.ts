import type { VercelRequest, VercelResponse } from '@vercel/node'
import { head, put } from '@vercel/blob'

/**
 * Single source of truth for project data, stored as one JSON blob. Replaces
 * the old localStorage-only CMS store — edits made here are visible to every
 * visitor, on every browser and device, instead of just the browser that
 * made them.
 *
 * GET  — public, returns the current project list (or `[]` on first run,
 *        before anything has ever been saved — the client falls back to its
 *        bundled seed list in that case).
 * POST — requires the `x-admin-token` header to match ADMIN_PASS. Body is
 *        the full project array; it fully replaces what's stored.
 */

const BLOB_PATH = 'data/projects.json'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const meta = await head(BLOB_PATH)
      const upstream = await fetch(meta.url, { cache: 'no-store' })
      if (!upstream.ok) throw new Error(`blob fetch failed: ${upstream.status}`)
      const data = await upstream.json()
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(data)
    } catch {
      // No blob yet (nothing has been saved through the CMS) — the client
      // knows to fall back to its bundled seed list in this case.
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json([])
    }
    return
  }

  if (req.method === 'POST') {
    const token = req.headers['x-admin-token']
    if (!process.env.ADMIN_PASS || token !== process.env.ADMIN_PASS) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const projects = req.body
    if (!Array.isArray(projects)) {
      res.status(400).json({ error: 'Expected an array of projects' })
      return
    }

    try {
      await put(BLOB_PATH, JSON.stringify(projects), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
      })
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Failed to write projects blob:', err)
      res.status(500).json({ error: 'Failed to save' })
    }
    return
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: 'Method not allowed' })
}
