import type { Project } from '../../data/projects'

export interface PoolCard {
  ci: number
  ri: number
  key: string
  project: Project
}

// A flat grid of cards — NOT a sphere. A fixed pool is recycled in both axes
// as you drag (an *infinite* periodic grid), but each card sits on a plane
// facing the camera directly; dragging moves the grid in a straight line in
// both axes. The barrel/fisheye curve you see is a 2D post-process
// (see BarrelDistortion.tsx) applied to the rendered image, not the cards'
// actual 3D placement.
export const COLS = 14
export const ROWS = 11

// How far back the camera sits from the flat card plane. Smaller = fewer,
// bigger-looking cards on screen (more "zoomed in").
export const CAMERA_Z = 15
// How much further back the camera eases to while actively dragging — a
// subtle "hold to zoom out" release.
export const DRAG_ZOOM_OUT = 2

// Card width chosen to fit ~6 columns across a typical desktop viewport at
// CAMERA_Z above. 3:4 (width:height) — portrait, taller than wide.
export const CARD_W = 3.6
export const CARD_H = (CARD_W * 4) / 4
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
