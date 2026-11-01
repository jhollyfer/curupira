import { defineConfig } from '@adonisjs/cors'

import env from '#start/env'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */

/**
 * The allowlist comes from `SITE_URL`, read once here and
 * exported: the origin middleware reads the same list instead of parsing again.
 *
 * It must be explicit: with `credentials: true` below, the protocol refuses
 * `*` - the browser does not send a cookie to a wildcard origin. So either the
 * frontend origin is listed, or there is no session between the two.
 */
export const corsOrigins: ReadonlyArray<string> = [env.get('SITE_URL')]

/**
 * Only the site origin, in every environment, development included: an open policy in
 * development hides the day the real origin is wrong. `SITE_URL` is required, so the boot
 * stops without it instead of starting with no frontend allowed.
 */
const origin: string[] = [...corsOrigins]

const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  origin,

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * The headers the preflight allows, not `true`.
   *
   * `true` reflects back whatever the browser asked for. The
   * explicit list is what makes a new header enter by decision and not by accident.
   *
   * `content-type` and `accept` are the minimum of any JSON request;
   * `x-request-id` is what the log correlates.
   */
  headers: ['content-type', 'accept', 'x-request-id'],

  /**
   * Response headers exposed to the browser.
   *
   * `content-disposition` is not among the simple response headers, so
   * without this line the page JavaScript reads `null` when looking for it - even with the
   * API sending the header, and even in development. It is how the
   * CSV export finds out the file name to save.
   */
  exposeHeaders: ['content-disposition'],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
