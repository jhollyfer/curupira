import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { test } from '@japa/runner'

/**
 * The "read-only storefront" net (_standards/backend.md §7): an anonymous route that is not
 * `GET` only exists if it is in the list declared below, and nothing under `/storefront`
 * writes. It reads the authorization baseline, which is what `authz:check` already enforces
 * against `openapi.json`.
 */
const BASELINE: Record<string, string> = JSON.parse(
  readFileSync(join(import.meta.dirname, 'authz-baseline.json'), 'utf-8'),
)
const ANONYMOUS = 'anonymous'

/**
 * The anonymous writes that exist by design: signing in, renewing the session through the
 * refresh cookie, and the resident's report with its photo upload (each throttled per IP
 * in `start/routes.ts`; the e2e spec of the throttles proves it).
 */
const DECLARED_ANONYMOUS_WRITES = [
  'POST /authentication/refresh',
  'POST /authentication/sign-in',
  'POST /storefront/report-photos',
  'POST /storefront/report-photos/{id}/complete',
  'POST /storefront/reports',
] as const

/** The writes under `/storefront`: exactly the report ones, nothing else may be born there. */
const DECLARED_STOREFRONT_WRITES = DECLARED_ANONYMOUS_WRITES.filter((route) =>
  route.includes(' /storefront'),
)

function routesWhere(
  predicate: (route: string, protection: string) => boolean,
): string[] {
  return Object.entries(BASELINE)
    .filter(([route, protection]) => predicate(route, protection))
    .map(([route]) => route)
    .sort()
}

test.group('public routes (unit)', () => {
  test('an anonymous route that is not GET is in the declared list', ({
    assert,
  }) => {
    const writes = routesWhere(
      (route, protection) =>
        protection === ANONYMOUS && !route.startsWith('GET '),
    )

    assert.deepEqual(writes, [...DECLARED_ANONYMOUS_WRITES])
  })

  test('under /storefront only the report writes exist', ({ assert }) => {
    const writes = routesWhere(
      (route) => route.includes(' /storefront') && !route.startsWith('GET '),
    )

    assert.deepEqual(writes, [...DECLARED_STOREFRONT_WRITES])
  })

  test('the scan sees the storefront: without a target, the guard would not guard', ({
    assert,
  }) => {
    const storefront = routesWhere((route) => route.includes(' /storefront'))

    assert.isAbove(storefront.length, 0)
    assert.isTrue(storefront.every((route) => BASELINE[route] === ANONYMOUS))
  })
})
