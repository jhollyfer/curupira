/**
 * `CORS_ORIGINS`: the browser origins allowed to call this API, comma separated
 * (`https://curupira.maiyu.com.br,http://localhost:3000`). One list feeds the CORS allowlist
 * and the origin barrier (`config/cors.ts`, `app/middleware/origin.middleware.ts`).
 *
 * Validated at boot, so a bad value brings the boot down instead of the first request:
 *
 * - `*` is refused. The API answers with cookies (`credentials: true`), and the browser does not
 *   send a cookie to a wildcard origin, so it would mean "no session" with an open face.
 * - Each entry is an origin and nothing else: scheme and host (and port), no path and no
 *   trailing slash. The middleware compares the `Origin` header by equality, and a browser never
 *   sends `https://site/`: an entry written with the slash would silently match nobody.
 */
export class CorsOrigins {
  /** The env schema validator: the list, parsed and checked. */
  static validate(key: string, value: string | undefined): string[] {
    if (value === undefined) throw new Error(`${key} is required`)

    return CorsOrigins.parse(value)
  }

  static parse(raw: string): string[] {
    const entries = raw
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)

    if (entries.length === 0)
      throw new Error('CORS_ORIGINS needs at least one origin')

    for (const entry of entries) CorsOrigins.assertOrigin(entry)

    return entries
  }

  private static assertOrigin(entry: string): void {
    if (entry === '*')
      throw new Error('CORS_ORIGINS must not be * (the API uses cookies)')

    const url = CorsOrigins.toUrl(entry)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`CORS_ORIGINS entry must be http or https: ${entry}`)
    }

    if (url.origin !== entry) {
      throw new Error(
        `CORS_ORIGINS entry must be an origin, no path or trailing slash: ${entry}`,
      )
    }
  }

  private static toUrl(entry: string): URL {
    try {
      return new URL(entry)
    } catch (cause) {
      throw new Error(`CORS_ORIGINS entry is not a URL: ${entry}`, { cause })
    }
  }
}
