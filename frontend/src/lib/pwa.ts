/**
 * Registers the service worker that `vite-plugin-pwa` generates at build (`sw.js`).
 *
 * Client only and after load, so it never competes with the first paint on a slow
 * network. Only in production: in `vite dev` there is no worker file, and a stale
 * one from a previous build would serve old pages while developing. A failure is
 * silent on purpose: the app works the same without the worker, only not offline.
 *
 * Reference (not covered by `_doc-lib`): https://vite-pwa-org.netlify.app/guide/register-service-worker
 */
export async function registerServiceWorker(): Promise<void> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    // No worker: the app still works online.
  }
}

/**
 * Every Cache Storage bucket that may hold a rendered page. The service worker caches the
 * HTML of each public navigation (`pages`); the panel is excluded from it in
 * `vite.config.ts`, but a worker installed before that exclusion may still hold panel
 * pages, so sign-out empties the bucket whatever is in it.
 */
const PAGE_CACHES = ['pages'] as const

/**
 * Forgets the pages the worker saved. Called on sign-out: the next person on a shared
 * phone must not be able to open the previous session's panel pages from the cache.
 * Silent on failure (no Cache Storage, private mode): there is nothing else to do.
 */
export async function clearPageCaches(): Promise<void> {
  if (typeof caches === 'undefined') return

  try {
    await Promise.all(PAGE_CACHES.map((name) => caches.delete(name)))
  } catch {
    // Cache Storage refused: the session is already over on the server.
  }
}
