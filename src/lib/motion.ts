/** Exit duration for a deleted task, in ms. Mirrors --duration-fast. */
export const TASK_EXIT_MS = 150;

/** True when the user asked for less motion (or the environment cannot tell). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
