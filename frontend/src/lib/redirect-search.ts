/** Percent-encoded control characters (`%00` to `%1F`, `%7F`). */
const ENCODED_CONTROL = /%(?:[01][0-9a-f]|7f)/i

const BACKSLASH = 92
const DELETE = 127
const SPACE = 32

/** Raw control characters and `\`: never part of an honest path here. */
function hasControlOrBackslash(value: string): boolean {
  if (ENCODED_CONTROL.test(value)) return true

  // `charCodeAt` and not a regex: ESLint's `no-control-regex` rejects the class.
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0)

    return code < SPACE || code === DELETE || code === BACKSLASH
  })
}

const BASE = 'http://x'

function stayedOnSite(path: string): boolean {
  if (!URL.canParse(path, BASE)) return false

  return new URL(path, BASE).origin === BASE
}

/** Where to go back to after signing in, when the guard blocked someone midway. */
export type RedirectSearch = {
  redirect?: string
}

/**
 * Validates the authentication screen's `?redirect=`.
 *
 * By hand, and not with a Zod schema: the rule is about the path (`/`, never `//` or
 * `/\`), not the shape, and the router's `validateSearch` has to return the
 * clean object, without throwing.
 *
 * Lives outside `routes/` so it can be tested without the route tree generator
 * treating the test file as a route.
 */
export function validateRedirectSearch(
  search: Record<string, unknown>,
): RedirectSearch {
  const value = search.redirect

  if (typeof value !== 'string') return {}

  // Internal paths only. `https://evil.com` is obvious, but `//evil.com` is also
  // external navigation: the browser reads it as "same protocol, other host".
  // Without this line, a link with `?redirect=` takes the user off-site right
  // after typing the password, and the address bar gives nothing away.
  if (!value.startsWith('/') || value.startsWith('//')) return {}

  // The browser's own parser is the judge of the rest. It drops tabs and newlines
  // inside a URL (`/\t/evil.com` becomes `//evil.com`) and turns `\` into `/`, which are
  // exactly the spellings a string check misses. A path is internal only if resolving it
  // against a base stays on that base.
  if (hasControlOrBackslash(value)) return {}
  if (!stayedOnSite(value)) return {}

  return { redirect: value }
}
