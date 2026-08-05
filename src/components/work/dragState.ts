/**
 * Shared pointer-gesture state. The gallery wall writes it; cards read it so a
 * drag that starts or ends on a card never counts as a click.
 */
export const dragState = { active: false, moved: false }

/** Past this many px of pointer travel the gesture is a drag, never a click. */
export const DRAG_THRESHOLD = 8
