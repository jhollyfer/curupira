import { createHmac } from 'node:crypto'

import limiter from '@adonisjs/limiter/services/main'

import env from '#start/env'

/**
 * The keys of the limits that are not the IP, in methods that can be tested without a database.
 */
export class LimiterKey {
  /**
   * The sign-in account, by the normalized e-mail (`trim` and lower case): the same
   * account with different case or spacing counts in the same bucket
   * (_standards/backend.md §4.10). With no e-mail in the body there is no account to protect, and
   * `null` is how the limiter receives "apply no ceiling here".
   */
  static account(email: unknown): string | null {
    if (typeof email !== 'string') return null

    const normalized = email.trim().toLowerCase()

    if (normalized.length === 0) return null

    return `signin:${normalized}`
  }

  /**
   * The anonymous caller, by a keyed hash of the IP.
   *
   * The default key is `ip_<address>` in clear text in `rate_limits`, which would keep the
   * address of whoever files a report next to the report routes for as long as the row
   * lives. HMAC-SHA256 keeps the bucket per IP (same IP, same key) while the table, a
   * backup or a leaked dump no longer lists addresses; the secret is derived from
   * `APP_KEY`, so the small IPv4 space cannot be walked to recover them
   * (_doc-lib/adonisjs.md#guides/security/rate-limiting,
   * https://docs.adonisjs.com/guides/security/rate-limiting).
   */
  static anonymous(ip: string, secret: string): string {
    return `anon:${createHmac('sha256', secret).update(ip).digest('hex')}`
  }

  /** The anonymous key of the running application: the secret comes from its `APP_KEY`. */
  static byIp(ip: string): string {
    return LimiterKey.anonymous(ip, LimiterKey.ipSecret())
  }

  private static derivedSecret: string | undefined

  private static ipSecret(): string {
    LimiterKey.derivedSecret ??= LimiterKey.secretFrom(env.get('APP_KEY').release())

    return LimiterKey.derivedSecret
  }

  /**
   * A purpose-bound secret derived from `APP_KEY`: the application key is never used as
   * the HMAC key itself, so rotating it rotates the buckets and nothing else leaks from it.
   */
  static secretFrom(appKey: string): string {
    return createHmac('sha256', appKey).update('curupira:rate-limit:ip').digest('hex')
  }

  /**
   * The authenticated user in a limit policy. `null` without a session: the per-user
   * ceiling only exists after `auth()`, and inventing a key would put
   * all anonymous users in a single bucket.
   */
  static user(scope: string, user: { readonly id: string } | undefined): string | null {
    if (!user) return null

    return `${scope}:${user.id}`
  }
}

/**
 * The attempt ceilings, per route.
 *
 * The default key is the IP, read with the `trustProxy` of `config/app.ts`. It is not
 * perfect - several people behind the same NAT count together -, but whoever signs in
 * has no session yet, and there is nothing else to count. An authenticated route counts
 * per user (`LimiterKey.user`).
 */

/**
 * The panel door, by IP. Five attempts per minute is generous for whoever
 * mistypes the password and tight for whoever guesses it.
 *
 * `blockFor` is what turns the ceiling into a cost: without it the window expires by itself
 * and the attacker tries five times again in the next minute, indefinitely.
 * With it, blowing the ceiling costs ten minutes stopped.
 */
export const signInThrottle = limiter.define('signIn', function () {
  return limiter.allowRequests(5).every('1 minute').blockFor('10 mins')
})

/**
 * The same door, counted per account.
 *
 * The per-IP ceiling alone does not protect the account: whoever has many addresses tries the
 * same password on each one and never blows any one's limit. Counting by e-mail
 * closes that.
 *
 * It is a second limit and not a composite `ip:email` key, which would be the opposite
 * of what is wanted: with the joint key, the same IP would get five attempts **per
 * e-mail**, and enumerating accounts would get cheaper, not more expensive.
 *
 * Looser than the IP one - twenty per hour - because this is the limit a person
 * who forgot their own password runs into, and locking them out by mistake is the abuse
 * it could cause itself.
 */
export const signInAccountThrottle = limiter.define('signInAccount', function (context) {
  // Normalized before the validator, because the limit runs before it.
  const key = LimiterKey.account(context.request.input('email'))

  // Inventing a key for the malformed body would put every invalid request in a
  // single bucket, and twenty of them would lock out the login of someone who did nothing.
  if (!key) return null

  return limiter.allowRequests(20).every('1 hour').blockFor('10 mins').usingKey(key)
})

/**
 * Session renewal, by IP. It stays outside `auth()` and writes a cookie: the refresh
 * token is opaque and high-entropy, so there is no practical brute force, and the
 * light ceiling (30 per minute) only protects the cost of the per-request lookup.
 */
export const refreshThrottle = limiter.define('refresh', function () {
  return limiter.allowRequests(30).every('1 minute')
})

/**
 * The upload, **per user**: the route is authenticated, and counting by IP would put the
 * whole school behind the same NAT in a single quota. Higher than the rest because a
 * large file becomes several parts, and each part is a request - the ceiling
 * counts requests, not files. Only the library writes (open, request
 * parts, complete) use it; the panel reads do not spend this quota.
 */
export const uploadThrottle = limiter.define('upload', function (context) {
  const key = LimiterKey.user('upload', context.auth.user)

  if (!key) return null

  return limiter.allowRequests(60).every('1 hour').usingKey(key)
})

/**
 * E-mail and password change (`PUT /account`), per user: it requires the current
 * password, and without a ceiling the route serves as a password oracle for whoever stole a session.
 */
export const accountUpdateThrottle = limiter.define('accountUpdate', function (context) {
  const key = LimiterKey.user('account-update', context.auth.user)

  if (!key) return null

  return limiter.allowRequests(10).every('1 hour').blockFor('10 mins').usingKey(key)
})

/**
 * The anonymous report routes, **by IP**: there is no account to count, and the IP is all
 * there is (`TRUSTED_PROXIES` makes it the resident's and not the proxy's).
 *
 * Filing a report: 10 per hour. A real resident files one or two; a script filing
 * hundreds would bury the team's queue, and `blockFor` turns blowing the ceiling into a
 * cost instead of a one-minute pause.
 */
export const reportCreateThrottle = limiter.define('reportCreate', function (context) {
  return limiter
    .allowRequests(10)
    .every('1 hour')
    .blockFor('10 mins')
    .usingKey(LimiterKey.byIp(context.request.ip()))
})

/**
 * The photo upload (open and confirm), by IP. Each report carries up to 3 photos and each
 * photo is two requests, plus retries on a bad connection - hence higher than the report
 * ceiling. It also bounds the `PENDING` rows an anonymous caller can create.
 */
export const reportPhotoThrottle = limiter.define('reportPhoto', function (context) {
  return limiter
    .allowRequests(60)
    .every('1 hour')
    .blockFor('10 mins')
    .usingKey(LimiterKey.byIp(context.request.ip()))
})

/**
 * The protocol lookup, by IP. The protocol is the only key to the status page: 2^40
 * combinations make a walk hopeless on their own, and the ceiling makes it also expensive.
 * Generous enough for a resident who reloads the page to see if the status moved.
 */
export const reportLookupThrottle = limiter.define('reportLookup', function (context) {
  return limiter
    .allowRequests(30)
    .every('10 mins')
    .blockFor('10 mins')
    .usingKey(LimiterKey.byIp(context.request.ip()))
})

/**
 * The public map, by IP. It is a cheap read, but anonymous and the biggest response of the
 * public block, so a script polling it is a free way to burn the database and the
 * bandwidth. One load per page view and a refresh every ten seconds fit comfortably.
 */
export const reportMapThrottle = limiter.define('reportMap', function (context) {
  return limiter
    .allowRequests(60)
    .every('10 mins')
    .blockFor('10 mins')
    .usingKey(LimiterKey.byIp(context.request.ip()))
})
