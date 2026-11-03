import { waitForHydration } from './support/hydration'
import {
  PANEL_ROUTES,
  PUBLIC_ROUTES,
  smallTouchTargets,
} from './support/responsive'
import { expect, test } from './support/test'

/**
 * Touch targets of 44x44 CSS px on every screen, WCAG 2.5.8 with the house margin
 * (`frontend.md` §10.2). Runs only in the `mobile` project (the config's `testMatch`):
 * the size is a rule for a finger, and `sm` and up are allowed to be smaller.
 */

test.describe('visitor', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has no target under 44px`, async ({ page }) => {
      await page.goto(route)
      await waitForHydration(page)

      // Polled, not read once: the images settle a moment after hydration.
      await expect.poll(() => smallTouchTargets(page)).toEqual([])
    })
  }
})

test.describe('administrator', () => {
  test.use({ role: 'owner' })

  for (const route of PANEL_ROUTES) {
    test(`${route} has no target under 44px`, async ({ page }) => {
      await page.goto(route)
      await waitForHydration(page)

      await expect.poll(() => smallTouchTargets(page)).toEqual([])
    })
  }
})
