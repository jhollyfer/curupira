import { waitForHydration } from './support/hydration'
import {
  PUBLIC_ROUTES,
  VIEWPORTS,
  expectTouchTargets,
  horizontalOverflow,
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
 * target size is a touch rule, so only the project with `hasTouch` asserts it. The specs
 * read pages only (no report is filed), so they spend nothing from the API's rate limits.
 */

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const route of PUBLIC_ROUTES) {
      // One navigation per route: the overflow and, with touch, the 44px targets are read
      // from the same page, which halves the visits of the touch project.
      test(`${route} fits the viewport`, async ({ page }, testInfo) => {
        await page.goto(route)
        await waitForHydration(page)

        // Polled, not read once: the map and the images settle a moment after hydration.
        await expect
          .poll(() => horizontalOverflow(page, viewport.width))
          .toBeLessThanOrEqual(0)

        await expectTouchTargets(page, Boolean(testInfo.project.use.hasTouch))
      })
    }
  })
}
