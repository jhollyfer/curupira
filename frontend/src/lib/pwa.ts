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
