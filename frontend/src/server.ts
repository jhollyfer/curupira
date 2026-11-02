import handler from '@tanstack/react-start/server-entry'

import { securityHeaders } from '#/lib/security-headers'

import { paraglideMiddleware } from './paraglide/server'

/**
 * The SSR server entry. Paraglide's middleware receives the original request and
 * opens its language context before Start renders: without that, two
 * parallel requests would share the language (_standards/i18n.md §2,
 * _doc-lib/paraglide.md#/tanstack-start, #/middleware).
 *
 * It is also where the security headers are written, in the production server only (the
 * dev server needs the HMR websocket and eval). They are set here and not in the Nitro
 * route rules because the policy depends on `STORAGE_PUBLIC_URL`, which is read per
 * request and never frozen into the build (`frontend.md` §3.3). The response is copied:
 * the headers of a `Response` that came from a redirect are immutable.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await paraglideMiddleware(request, () =>
      handler.fetch(request),
    )

    if (!import.meta.env.PROD) return response

    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(
      securityHeaders(process.env.STORAGE_PUBLIC_URL),
    )) {
      headers.set(name, value)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
