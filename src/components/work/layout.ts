import type { Project } from '../../data/projects'

export interface PoolCard {
  ci: number
  ri: number
  key: string
  project: Project
}

// The viewer sits at the centre of a curved wall. The wall is an *infinite*
// periodic grid — a fixed pool of cards is recycled in both axes as you drag,
// so there is never an edge in any direction.
// A larger radius flattens the wall — less barrel curvature across the view.
export const RADIUS = 11
export const COLS = 14
export const ROWS = 11

// Landscape cards placed edge-to-edge (no gaps), scaled to the wall radius so
// their apparent size stays constant as the curvature flattens.
export const CARD_W = 3.6
export const CARD_H = (CARD_W * 3) / 4
export const CELL_W = CARD_W
export const CELL_H = CARD_H

/** The recyclable pool. Card (ci,ri) always shows the same project, so its
 *  texture never needs reloading as it wraps around. */
export function buildPool(projects: Project[]): PoolCard[] {
  const pool: PoolCard[] = []
  if (projects.length === 0) return pool
  for (let ri = 0; ri < ROWS; ri++) {
    for (let ci = 0; ci < COLS; ci++) {
      pool.push({
        ci,
        ri,
        key: `${ri}-${ci}`,
        project: projects[(ci + ri * COLS) % projects.length],
      })
    }
  }
  return pool
}
