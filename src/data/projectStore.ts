import { projects as seedProjects, type Project } from './projects'

/**
 * A tiny persistent content store for projects — the backend behind the CMS.
 *
 * Seed projects ship with the build; anything the CMS adds, edits, or deletes
 * is layered on top and persisted to localStorage, so the gallery and project
 * pages are fully data-driven. Swapping this module for real API calls is the
 * only change needed to move to a hosted database later.
 */

const STORAGE_KEY = 'ap:projects:v1'

interface Overlay {
  /** Projects created through the CMS. */
  added: Project[]
  /** Partial edits applied to seed projects, keyed by id. */
  edited: Record<string, Partial<Project>>
  /** Ids of seed projects hidden via the CMS. */
  removed: string[]
}

const EMPTY: Overlay = { added: [], edited: {}, removed: [] }

function read(): Overlay {
  if (typeof localStorage === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Overlay) }
  } catch {
    return EMPTY
  }
}

function write(next: Overlay) {
  overlay = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota or private mode — the session still works, it just won't persist */
  }
  cache = null
  listeners.forEach((fn) => fn())
}

let overlay: Overlay = read()
let cache: Project[] | null = null
const listeners = new Set<() => void>()

/** The resolved project list: seeds (minus removals, plus edits) then additions. */
export function getProjects(): Project[] {
  if (cache) return cache
  cache = [
    ...seedProjects
      .filter((p) => !overlay.removed.includes(p.id))
      .map((p) => (overlay.edited[p.id] ? { ...p, ...overlay.edited[p.id] } : p)),
    ...overlay.added,
  ]
  return cache
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isSeed(id: string): boolean {
  return seedProjects.some((p) => p.id === id)
}

export function saveProject(project: Project) {
  const next = structuredClone(overlay)
  if (isSeed(project.id)) {
    // Store only the fields that differ from the seed.
    const seed = seedProjects.find((p) => p.id === project.id)!
    const diff: Partial<Project> = {}
    for (const key of Object.keys(project) as (keyof Project)[]) {
      if (JSON.stringify(project[key]) !== JSON.stringify(seed[key])) {
        Object.assign(diff, { [key]: project[key] })
      }
    }
    next.edited[project.id] = diff
  } else {
    const i = next.added.findIndex((p) => p.id === project.id)
    if (i >= 0) next.added[i] = project
    else next.added.push(project)
  }
  next.removed = next.removed.filter((id) => id !== project.id)
  write(next)
}

export function deleteProject(id: string) {
  const next = structuredClone(overlay)
  next.added = next.added.filter((p) => p.id !== id)
  delete next.edited[id]
  if (isSeed(id)) next.removed.push(id)
  write(next)
}

/** Discard every CMS change and fall back to the shipped seed content. */
export function resetProjects() {
  write(structuredClone(EMPTY))
}

/** Export the overlay so content can be backed up or moved between browsers. */
export function exportJSON(): string {
  return JSON.stringify(overlay, null, 2)
}

export function importJSON(raw: string) {
  const parsed = JSON.parse(raw) as Overlay
  write({ ...EMPTY, ...parsed })
}

/** A blank project pre-filled with sensible defaults for the CMS form. */
export function emptyProject(): Project {
  return {
    id: '',
    title: '',
    client: '',
    year: new Date().getFullYear(),
    category: [],
    thumb: '',
    hero: '',
    summary: '',
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
