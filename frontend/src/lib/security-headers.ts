import { env } from '#/env'

/** The OpenStreetMap tile server the public map loads its tiles from. */
const TILES_ORIGIN = 'https://tile.openstreetmap.org'

/**
 * The origin of the bucket, from `STORAGE_PUBLIC_URL` (the backend `STORAGE_ENDPOINT` seen
 * from the browser). Read per request, without `VITE_`: the image is the same in every
 * environment and only the server's environment says where its bucket is. Absent or not a
 * URL, the policy opens nothing for it and the photo upload is blocked, on purpose: a
 * wrong value must not widen `connect-src`.
 */
function storageOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (!URL.canParse(value)) return undefined

  return new URL(value).origin
}

/**
 * The `Content-Security-Policy` of the frontend server (`frontend.md` §3.3). `connect-src`
 * and `img-src` open only the API and, with the presigned upload, the storage's public
 * origin; `frame-ancestors 'none'` keeps another site from embedding the sign-in screen.
 * `unsafe-inline` in script and style because Start writes the hydration scripts inline
 * and emits no nonce.
 * _doc-lib/nitro.md#config (route rules and server entry).
 */
export function contentSecurityPolicy(storagePublicUrl: string | undefined) {
  const origins = ["'self'", env.VITE_API_URL, storageOrigin(storagePublicUrl)]
    .filter(Boolean)
    .join(' ')

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${origins} ${TILES_ORIGIN} data: blob:`,
    "font-src 'self' data:",
    `connect-src ${origins}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

/** The security headers of every response of the production server. */
export function securityHeaders(
  storagePublicUrl: string | undefined,
): Readonly<Record<string, string>> {
  return {
    'Content-Security-Policy': contentSecurityPolicy(storagePublicUrl),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // No `preload`: joining the list is a commitment that cannot be undone.
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}
