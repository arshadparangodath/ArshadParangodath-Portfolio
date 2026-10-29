import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list } from '@vercel/blob'

/** Admin-only, paginated inventory. The Blob credential never leaves Vercel. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.ADMIN_PASS || req.headers['x-admin-token'] !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Sign in to the admin again to browse Blob folders.' })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Connect the asset Blob store to this Vercel project using BLOB_READ_WRITE_TOKEN, then redeploy.' })
  }
  const prefix = req.query.prefix
  const cursor = req.query.cursor
  if (typeof prefix !== 'string' || !prefix || prefix.length > 1000 ||
      prefix.startsWith('/') || prefix.includes('\\') || prefix.split('/').some((p) => p === '..' || p === '.') ||
      (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 4000))) {
    return res.status(400).json({ error: 'Enter a folder path such as Assets/Projects/.' })
  }
  try {
    const result = await list({
      prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
      cursor: typeof cursor === 'string' ? cursor : undefined,
      limit: 1000,
      abortSignal: AbortSignal.timeout(20000),
    })
    const files = result.blobs
      .filter((b) => !b.pathname.split('/').some((part) => part.startsWith('.') || part === '__MACOSX'))
      .filter((b) => /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|m4v)$/i.test(b.pathname))
      .map(({ pathname, url }) => ({ pathname, url }))
    return res.status(200).json({ files, cursor: result.hasMore ? result.cursor : null })
  } catch (error) {
    console.error('Could not list Blob assets:', error)
    return res.status(502).json({ error: 'Could not read Blob assets. Check the connected store and try again.' })
  }
}
