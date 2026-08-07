import type Lenis from 'lenis'

/**
 * App.tsx owns the single Lenis instance and registers it here. Anything that
 * renders a full-screen overlay with its own scroll container (ProjectDetail,
 * etc.) can then call `pauseLenis`/`resumeLenis` for the duration it's
 * mounted, so the global smooth-scroll doesn't keep hijacking the mouse wheel
 * for a page that's sitting behind the overlay, invisible.
 *
 * Calls are reference-counted so nested/overlapping overlays don't fight over
 * a single stop/start flag.
 */
let instance: Lenis | null = null
let stopCount = 0

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis
  stopCount = 0
}

export function pauseLenis() {
  stopCount += 1
  instance?.stop()
}

export function resumeLenis() {
  stopCount = Math.max(0, stopCount - 1)
  if (stopCount === 0) instance?.start()
}
