import type { Project } from './projects'

/**
 * Maps a project's raw categories onto the studio's short discipline vocabulary
 * — the pills shown on each gallery card. Categories that already read well are
 * kept; the rest are translated, and every card is topped up to three tags so
 * the row always feels intentional.
 */
const TRANSLATE: Record<string, string> = {
  WebGL: 'Motion',
  UI: 'UI/UX',
  Product: 'Product',
  Brand: 'Branding',
  'Art Direction': 'Art Direction',
  Industrial: 'Industrial',
  '3D': '3D',
  Motion: 'Motion',
  Data: 'Data Viz',
  Health: 'Product',
  Film: 'Film',
  Commerce: 'E-Commerce',
  AR: 'AR',
  Sound: 'Sound',
  Art: 'Art Direction',
  Culture: 'Social',
  Heritage: 'Editorial',
  Print: 'Print',
  Editorial: 'Editorial',
  Nature: 'Campaign',
  Web: 'Website',
  Campaign: 'Campaign',
  Food: 'Social',
}

/** Filler disciplines, picked deterministically so a card never changes. */
const FILL = ['Website', 'Branding', 'UI/UX', 'Motion', 'Social', 'Campaign', 'Editorial']

export function disciplineTags(project: Project | undefined): string[] {
  if (!project) return []
  const out: string[] = []
  for (const c of project.category) {
    const t = TRANSLATE[c] ?? c
    if (!out.includes(t)) out.push(t)
  }
  // Deterministic top-up from the project id.
  let seed = 0
  for (let i = 0; i < project.id.length; i++) seed = (seed * 31 + project.id.charCodeAt(i)) >>> 0
  let i = 0
  while (out.length < 3 && i < FILL.length * 2) {
    const t = FILL[(seed + i) % FILL.length]
    if (!out.includes(t)) out.push(t)
    i++
  }
  return out.slice(0, 3)
}
