import { waitForHydration } from './support/hydration'
import {
  PUBLIC_ROUTES,
  VIEWPORTS,
  horizontalOverflow,
  smallTouchTargets,
} from './support/responsive'
import { expect, test } from './support/test'

/**
 * Responsive regression of the resident app: every public route at every width of the
 * matrix, from a 360px phone to a 1920px monitor, including the landscape phone.
 *
 * Two things are asserted, because they are the two ways a responsive layout fails
 * silently (nothing throws, the page just stops being usable):
 *
 * - no horizontal page scroll (`scrollWidth <= innerWidth`, and never wider than the
 *   requested viewport: see `horizontalOverflow`), at any width;
 * - in the touch project only, no visible interactive target under 44x44 CSS px.
 *
 * Both projects (`responsive-touch`, `responsive-pointer`) run the overflow check; the
 * target size is a touch rule, so the pointer project filters it out with `grep`. The specs read pages
 * only (no report is filed), so they spend nothing from the API's rate limits.
 */

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const route of PUBLIC_ROUTES) {
      test(`${route} has no horizontal scroll`, async ({ page }) => {
        await page.goto(route)
        await waitForHydration(page)

        // Polled, not read once: the map and the images settle a moment after hydration.
        await expect
          .poll(() => horizontalOverflow(page, viewport.width))
          .toBeLessThanOrEqual(0)
      })

      test(`${route} has touch targets of 44px`, async ({ page }) => {
        await page.goto(route)
        await waitForHydration(page)

        await expect.poll(() => smallTouchTargets(page)).toEqual([])
      })
    }
  })
}
