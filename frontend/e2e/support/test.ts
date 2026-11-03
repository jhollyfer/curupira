import AxeBuilder from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

import { API_URL, SITE_ORIGIN } from './api'
import { AUTH_FILES } from './auth-files'

type Role = 'anonymous' | 'owner' | 'operator'

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

/**
 * The suite's `test`. Sessions come from the `setup` project (`auth.setup.ts`), written once per run: each screen
 * sign-in would spend one of the five attempts per minute the limiter gives the IP, and the
 * blocked IP stays blocked for ten minutes.
 *
 * The operator is the demonstration seeder's (`operator@example.com`, `E2E_DEMO_PASSWORD`).
 */
export const test = base.extend<Fixtures>({
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

  storageState: async ({ role }, provide) => {
    const states = {
      anonymous: undefined,
      owner: AUTH_FILES.owner,
      operator: AUTH_FILES.operator,
    } satisfies Record<Role, string | undefined>

    await provide(states[role])
  },

  ownerApi: async ({ playwright }, provide) => {
    const client = await playwright.request.newContext({
      storageState: AUTH_FILES.owner,
      baseURL: API_URL,
      extraHTTPHeaders: { Origin: SITE_ORIGIN },
    })
    await provide(client)
    await client.dispose()
  },
})

export { expect }
