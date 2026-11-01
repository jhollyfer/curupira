import AxeBuilder from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

type Fixtures = Readonly<{
  /**
   * Scans the tab with axe and fails on serious or critical violations
   * (_doc-lib/playwright.md#docs/accessibility-testing). It only catches what
   * a machine can detect; the rest is left to manual review.
   */
  expectAccessible: (page: Page) => Promise<void>
}>

/**
 * The suite's `test`. There is no session fixture: the resident app is anonymous, and
 * the panel's specs (the other team) add theirs next to this file.
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
})

export { expect }
