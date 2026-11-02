import AxeBuilder from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

import { API_URL, SITE_ORIGIN, apiClient } from './api'
import { generatedOperatorCredentials, ownerCredentials } from './credentials'

type Role = 'anonymous' | 'owner' | 'operator'

type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>

type Fixtures = Readonly<{
  /**
   * Scans the tab with axe and fails on serious or critical violations
   * (_doc-lib/playwright.md#docs/accessibility-testing). It only catches what
   * a machine can detect; the rest is left to manual review.
   */
  expectAccessible: (page: Page) => Promise<void>
  /** `test.use({ role: 'owner' })` opens every page of the block already signed in. */
  role: Role
  /** The ADMINISTRATOR's API client, for what the screens cannot show (the stored photo). */
  ownerApi: APIRequestContext
}>

type Sessions = Readonly<{
  owner: () => Promise<StorageState>
  operator: () => Promise<StorageState>
}>

type WorkerFixtures = Readonly<{ sessions: Sessions }>

/** Runs `open` once, on first use: a spec that never needs the operator never creates one. */
function once<T>(open: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined

  return () => {
    pending ??= open()

    return pending
  }
}

/**
 * The suite's `test`. Sessions are opened once per worker, through the API: each screen
 * sign-in spends one of the five attempts per minute the limiter gives the IP, and the
 * blocked IP stays blocked for ten minutes.
 *
 * The operator does not come from the seeder, so the owner creates it here (409 means a
 * previous run already did).
 */
export const test = base.extend<Fixtures, WorkerFixtures>({
  expectAccessible: async ({}, provide) => {
    await provide(async (page) => {
      const results = await new AxeBuilder({ page }).analyze()
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === 'serious' || violation.impact === 'critical',
      )
      expect(blocking).toEqual([])
    })
  },

  role: ['anonymous', { option: true }],

  sessions: [
    async ({ playwright }, provide) => {
      const owner = once(async () => {
        const client = await apiClient(playwright, ownerCredentials())
        const state = await client.storageState()
        await client.dispose()

        return state
      })

      const operator = once(async () => {
        const credentials = generatedOperatorCredentials()

        // The owner's session is already open: signing in again would spend one more of
        // the five attempts a minute the limiter gives the IP.
        const admin = await playwright.request.newContext({
          storageState: await owner(),
          baseURL: API_URL,
          extraHTTPHeaders: { Origin: SITE_ORIGIN },
        })
        const created = await admin.post('/management/users', {
          data: {
            name: 'Operador E2E',
            ...credentials,
            passwordConfirmation: credentials.password,
            role: 'OPERATOR',
          },
        })
        if (!created.ok()) {
          throw new Error(`creating the operator answered ${created.status()}`)
        }
        await admin.dispose()

        const client = await apiClient(playwright, credentials)
        const state = await client.storageState()
        await client.dispose()

        return state
      })

      await provide({ owner, operator })
    },
    { scope: 'worker' },
  ],

  storageState: async ({ role, sessions }, provide) => {
    const states = {
      anonymous: async () => undefined,
      owner: sessions.owner,
      operator: sessions.operator,
    } satisfies Record<Role, () => Promise<StorageState | undefined>>

    await provide(await states[role]())
  },

  ownerApi: async ({ sessions, playwright }, provide) => {
    const client = await playwright.request.newContext({
      storageState: await sessions.owner(),
      baseURL: API_URL,
      extraHTTPHeaders: { Origin: SITE_ORIGIN },
    })
    await provide(client)
    await client.dispose()
  },
})

export { expect }
