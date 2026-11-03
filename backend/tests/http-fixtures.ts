import type { ApiClient, ApiResponse } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'

import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import { COOKIE_TOKEN } from '#config/cookie'
import type User from '#models/user'

/**
 * The body as the specs read it: an object of free fields.
 *
 * The `any` is forced by `@japa/api-client` with the `@tuyau/core` registry: the
 * route matches by path and not by method, so `response.body()` is the union of all
 * responses of that path - the error ones included. It is the only `any` in the
 * suite, and every spec inherits the type from here (`ResponseBody`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- @tuyau/core registry unites the responses of the path
export type ResponseBody = Record<string, any>

/**
 * A payload the typed client would refuse at compile time, sent on purpose to prove the
 * server answers 422 (an unknown enum value, a type outside the allowlist). `JSON.parse`
 * returns `any`, which is the only honest way across the registry's types without `as`.
 */
export function invalidPayload<TExpected>(
  payload: Record<string, unknown>,
): TExpected {
  return JSON.parse(JSON.stringify(payload))
}

export function body(response: ApiResponse): ResponseBody {
  return response.body()
}

/**
 * The seeder's owner (an `ADMINISTRATOR`; the credentials are `SEED_OWNER_*` of
 * `.env.test`). It is the only account no endpoint creates without a session, so every
 * test that needs a session starts from it.
 */
export const ADMINISTRATOR = {
  email: 'owner@mail.com',
  password: 'Owner1234!',
}

export type Session = {
  [COOKIE_TOKEN.ACCESS]: string
  [COOKIE_TOKEN.REFRESH]: string
}

/**
 * Authenticates over HTTP and returns the cookies to chain into the following
 * requests.
 *
 * Deliberately does **not** use the auth plugin's `loginAs`, which builds the session
 * by calling the guard from the inside and so never exercises the real path: the
 * sign-in validator, the token pair issuance and the cookie read by the guard. With
 * a real sign-in, a test proves the whole contract.
 */
export async function authenticate(
  client: ApiClient,
  email: string,
  password: string,
): Promise<Session> {
  const response = await client
    .post('/authentication/sign-in')
    .json({ email, password })

  response.assertStatus(204)

  const access = response.cookie(COOKIE_TOKEN.ACCESS)
  const refresh = response.cookie(COOKIE_TOKEN.REFRESH)
  if (!access || !refresh)
    throw new Error('session cookie missing from the sign-in response')

  return {
    [COOKIE_TOKEN.ACCESS]: access.value,
    [COOKIE_TOKEN.REFRESH]: refresh.value,
  }
}

/** Shortcut to the seeder administrator's session, which is the most used. */
export function authenticateAsAdministrator(
  client: ApiClient,
): Promise<Session> {
  return authenticate(client, ADMINISTRATOR.email, ADMINISTRATOR.password)
}

/**
 * An operator session, the factory's default role: works the reports and the notices and
 * nothing else of the panel. It is the other side of every administrator-only assertion.
 */
export async function authenticateAsOperator(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client)

  return session
}

/**
 * Creates the account through the factory and signs in with it. Returns the account
 * along with the session, so the test can compare who acted.
 */
export async function signInWithFactory(
  client: ApiClient,
  state?: 'administrator' | 'inactive',
): Promise<{ user: User; session: Session }> {
  const factory = UserFactory.query()
  if (state) factory.apply(state)
  const user = await factory.create()

  return {
    user,
    session: await authenticate(client, user.email, FACTORY_PASSWORD),
  }
}

/**
 * Empties the database and recreates the administrator.
 *
 * `truncate` also erases the administrator, and it is the only user no endpoint
 * creates without a session - without seeding again, no panel test would have
 * anywhere to start.
 */
export async function resetDatabase() {
  // `truncate()` does NOT truncate: it runs the migrations and **returns** the function
  // that truncates, which Japa registers as the test teardown. Discarding that return
  // means the database is never cleaned, and a test sees the previous one's data.
  const teardown = await testUtils.db().truncate()

  await testUtils.db().seed()

  return teardown
}
