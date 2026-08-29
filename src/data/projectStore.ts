import { projects as seedProjects, type Project } from './projects'
import { getAdminToken } from '../lib/adminAuth'

/**
 * The CMS's data store. Project data lives in Vercel Blob storage via the
 * /api/projects serverless route — edits made through the CMS are visible to
 * every visitor, on every browser and device, not just the one that made
 * them (the old version of this file kept everything in localStorage, which
 * is why edits never showed up anywhere else and vanished if site data was
 * cleared).
 *
 * `getProjects()` still needs to be synchronous — React's
 * `useSyncExternalStore` requires that — so this module keeps an in-memory
 * cache that's populated by a background fetch on first use, then kept in
 * sync as the CMS makes changes.
 */

let projects: Project[] = seedProjects
let loaded = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

async function load() {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' })
    const data = (await res.json()) as Project[]
    // An empty response means nothing has ever been saved through the CMS
    // yet (fresh deploy, blob not created) — fall back to the bundled seed.
    if (Array.isArray(data) && data.length > 0) projects = data
  } catch {
    // Offline, or the API isn't reachable — keep showing the bundled seed
    // rather than an empty site.
  } finally {
    loaded = true
    notify()
  }
}

let loadPromise: Promise<void> | null = null
function ensureLoaded() {
  if (!loadPromise) loadPromise = load()
  return loadPromise
}
ensureLoaded()

async function persist(next: Project[]) {
  const token = getAdminToken()
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token ?? '',
    },
    body: JSON.stringify(next),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Save failed (${res.status})`)
  }
}

/** The current, synchronously-readable project list. */
export function getProjects(): Project[] {
  return projects
}

/** Whether the initial fetch from the server has completed (success or not). */
export function isLoaded(): boolean {
  return loaded
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isSeed(id: string): boolean {
  return seedProjects.some((p) => p.id === id)
}

/** Create or update a project, then persist the full list to the server. */
export async function saveProject(project: Project) {
  const next = [...projects]
  const i = next.findIndex((p) => p.id === project.id)
  if (i >= 0) next[i] = project
  else next.push(project)
  projects = next
  notify() // optimistic UI update — reflects immediately while the save is in flight
  await persist(next)
}

export async function deleteProject(id: string) {
  const next = projects.filter((p) => p.id !== id)
  projects = next
  notify()
  await persist(next)
}

/** Discard every CMS change and fall back to the shipped seed content. */
export async function resetProjects() {
  projects = seedProjects
  notify()
  await persist(seedProjects)
}

/** Export the full project list so it can be backed up or moved elsewhere. */
export function exportJSON(): string {
  return JSON.stringify(projects, null, 2)
}

export async function importJSON(raw: string) {
  const parsed = JSON.parse(raw) as Project[]
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of projects')
  projects = parsed
  notify()
  await persist(parsed)
}

/** A blank project pre-filled with sensible defaults for the CMS form. */
export function emptyProject(): Project {
  return {
    id: '',
    title: '',
    client: '',
    year: new Date().getFullYear(),
    category: [],
    gallery: [],
    caseStudyUrl: '',
    summary: '',
    overview: '',
    process: '',
    outcome: '',
    accent: '#8b6ad1',
    accentAlt: '#6ad1b0',
    collection: 'works',
    meta: {
      industry: '',
      region: '',
      services: [],
      scope: '',
      role: '',
      duration: '',
      deliverables: [],
      technologies: [],
      partner: '',
      awards: [],
    },
  }
}
