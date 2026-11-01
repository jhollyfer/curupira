/** Control characters (raw or percent-encoded) and `\`: never part of an honest path here. */
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]|%(?:[01][0-9a-f]|7f)/i

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
  if (CONTROL_OR_BACKSLASH.test(value)) return {}
  if (!stayedOnSite(value)) return {}

  return { redirect: value }
}
