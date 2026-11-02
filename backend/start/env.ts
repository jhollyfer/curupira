/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

import { CorsOrigins } from '#core/cors-origins'
import { TrustedProxies } from '#core/trusted-proxies'

/**
 * The single environment reader (_standards/backend.md §6), in blocks in the house
 * order. Every key declared here is read by some `env.get()`, and vice versa -
 * `pattern:check` enforces both directions; a key that lost its reader goes away.
 *
 * Required is the one that brings the boot down when missing - and bringing the boot down is the
 * desired behavior: better that the application does not start than starts with a
 * default hidden in the code.
 */
export default await Env.create(new URL('../', import.meta.url), {
  /*
  |----------------------------------------------------------------------------
  | Node
  |----------------------------------------------------------------------------
  |
  | `TZ` is read by Node itself, not by `env.get()`, and so went
  | unnoticed: it was in `.env.example` and in no schema. Absent, the
  | process inherits the host timezone, and the same query answers different dates
  | depending on the machine. `UTC` in every environment; whoever converts to the reader's timezone
  | is the presentation layer.
  */
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  TZ: Env.schema.string.optional(),

  // App
  APP_KEY: Env.schema.secret(),
  // This API's own public address (the OpenAPI `servers` entry).
  APP_SERVER_URL: Env.schema.string({ format: 'url', tld: false }),
  // The browser origins allowed to call this API, comma separated: the CORS allowlist and
  // the origin barrier at once (`config/cors.ts`). Required in every environment, development
  // included (an open policy in development hides the day the real origin is wrong), and
  // validated at boot (`app/core/cors-origins.ts`): no `*`, no path, no trailing slash.
  CORS_ORIGINS: CorsOrigins.validate,

  /**
   * Whom Adonis treats as a trusted proxy, so `request.ip()` reads
   * `X-Forwarded-For` only from whoever the proxy actually wrote. A comma-separated list in the
   * `proxy-addr` format: IP, subnet (`10.0.0.0/8`) or alias
   * (`loopback`, `linklocal`, `uniquelocal`). `true`, `*` and catch-all ranges are refused
   * (`app/core/trusted-proxies.ts`).
   *
   * Required: the anonymous report routes are throttled by IP, and with the wrong value
   * every resident shares one bucket. Behind Coolify's Traefik (another container) it is
   * **necessary** (`loopback,uniquelocal`): without it
   * `request.ip()` is the proxy IP and every per-IP limit becomes global. Never
   * `true`: the client would then forge `X-Forwarded-For`.
   */
  TRUSTED_PROXIES: TrustedProxies.validate,

  /**
   * The session cookie domain, when the app and the API are on different
   * hosts of the same parent domain.
   *
   * Without it the cookie is born host-only and the frontend SSR never receives it: every
   * F5 on a private route becomes 401 and goes back to the sign-in screen. In
   * development it does not show up because cookies ignore the port - `localhost:3333` and
   * `localhost:3000` are the same domain.
   *
   * The value is the smallest domain that covers both hosts. Optional on purpose:
   * absent is the behavior this file always had.
   */
  COOKIE_DOMAIN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Database
  |----------------------------------------------------------
  */
  DATABASE_URL: Env.schema.string(),

  /**
   * TLS on the Postgres connection. It is an infrastructure decision, not an environment one:
   * a database on the same private network as the application normally does not speak TLS, and a
   * managed database normally requires it. Tying this to `NODE_ENV` forced one
   * of the two setups not to start.
   */
  DATABASE_SSL: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | File storage
  |----------------------------------------------------------
  |
  | One S3-compatible bucket, the same in every environment: MinIO in dev and tests,
  | and in production whatever `STORAGE_ENDPOINT` points to. There is no per-environment
  | destination choice because the upload is presigned multipart, and multipart is S3 API - a
  | local disk does not have it.
  |
  | The prefix is `STORAGE_`, not a vendor name: what the code depends on
  | is the protocol. R2, S3, Spaces, Linode and MinIO swap places by changing the
  | endpoint.
  |
  | `UPLOAD_MAX_SIZE` is the per-file ceiling, in bytes, and is **required**: how much
  | fits in an upload is the operator's decision, and a default hidden in the code is
  | a ceiling nobody chose and nobody sees. When missing, the application does not start -
  | which is better than starting and refusing files over an invisible limit.
  */
  UPLOAD_MAX_SIZE: Env.schema.number(),

  // Bucket credential and destination: required and with no default. Storage is a
  // base feature, and starting without it is starting with a broken upload.
  STORAGE_KEY: Env.schema.string(),
  STORAGE_SECRET: Env.schema.string(),
  STORAGE_BUCKET: Env.schema.string(),
  STORAGE_ENDPOINT: Env.schema.string(),

  /**
   * MinIO only serves the `endpoint/bucket/key` style; managed buckets
   * also serve the `bucket.endpoint` style. Turning this on in dev and off in
   * production is the only configuration difference between the two.
   */
  STORAGE_FORCE_PATH_STYLE: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------------------------
  | Seeding
  |----------------------------------------------------------------------------
  |
  | Read by the seeders, and optional because the application starts without them - only whoever
  | seeds needs them. Without the password the seeder stops instead of creating an account with a
  | known credential: it used to be a literal in the file, and anyone who
  | read it owned every environment already seeded.
  |
  */
  SEED_OWNER_EMAIL: Env.schema.string.optional(),
  SEED_OWNER_PASSWORD: Env.schema.string.optional(),
})
