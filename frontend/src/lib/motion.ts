/**
 * Whether the system asks for less motion. For the motion that CSS cannot reach: Leaflet
 * animates the map (zoom, pan, fade) from JavaScript, so `motion-reduce:` never sees it.
 *
 * Read at call time and only in the browser (the map is `ClientOnly`); on the server there
 * is no `matchMedia` and "no preference" is the honest answer.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  // Old WebViews and test DOMs have a `window` and no `matchMedia`.
  if (typeof window.matchMedia !== 'function') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
