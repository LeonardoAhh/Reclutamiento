/**
 * Radix positioning props require numbers, so CSS spacing tokens cannot be
 * passed directly. Keep the shared geometry here instead of repeating magic
 * numbers across floating primitives.
 */
export const FLOATING_SURFACE_SIDE_OFFSET = 4;
export const FLOATING_SURFACE_COLLISION_PADDING = 12;

/** Grace period aligned with `{motion.fast}` for crossing into portaled content. */
export const FLOATING_SURFACE_HOVER_CLOSE_DELAY_MS = 150;
