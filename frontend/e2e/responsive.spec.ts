import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { waitForHydration } from './support/hydration'
import {
  PANEL_ROUTES,
  PUBLIC_ROUTES,
  horizontalOverflow,
} from './support/responsive'
import { expect, test } from './support/test'

/**
 * Every screen of every profile (visitor, administrator, operator) at the viewport of the
 * project that runs it (`mobile` 360x740, `tablet` 768x1024, `desktop` 1440x900). Two
 * promises, the two ways a responsive layout fails without throwing:
 *
 * - the PAGE never scrolls sideways (a wide table or map may scroll inside its own box);
 * - axe finds no serious or critical violation (the map tiles are third-party markup).
 *
 * It only reads pages: nothing is filed, so no API limit is spent.
 */

/** Below this the sidebar is a drawer (`useIsMobile`, 768px). */
const DRAWER_BELOW = 768

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(route)
  await waitForHydration(page)
}

/** The serious and critical axe findings (the map tiles are third-party markup). */
async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .exclude('.leaflet-container')
    .analyze()

  return results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  )
}

async function openMenu(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? 0
  if (width < DRAWER_BELOW) {
    await page.getByRole('button', { name: 'Alternar barra lateral' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
}

/** Below `md` the site navigation is behind the menu button; from `md` it is in the header. */
async function openSiteMenu(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? 0
  if (width < DRAWER_BELOW) {
    await page.getByRole('button', { name: 'Abrir o menu' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
}

test.describe('visitor', () => {
  test('the site menu reaches a destination and closes by itself', async ({
    page,
  }) => {
    await visit(page, '/')
    await openSiteMenu(page)
    await page.getByRole('link', { name: 'Coleta' }).first().click()

    await expect(page).toHaveURL(/\/schedule$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  for (const route of PUBLIC_ROUTES) {
    test(`${route} fits the viewport and is accessible`, async ({ page }) => {
      await visit(page, route)

      // Polled, not read once: the map and the images settle a moment after hydration.
      await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
      expect(await blockingViolations(page)).toEqual([])
    })
  }
})

test.describe('theme', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`${theme}: the server renders it with no flash and axe finds no contrast failure`, async ({
      page,
      context,
      baseURL,
    }) => {
      await context.addCookies([{ name: 'theme', value: theme, url: baseURL }])

      for (const route of ['/', '/report', '/notices']) {
        await page.goto(route)
        await waitForHydration(page)
        await expect(page.locator('html')).toHaveClass(new RegExp(theme))

        const results = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .exclude('.leaflet-container')
          .analyze()
        expect(results.violations, `${theme} contrast on ${route}`).toEqual([])
      }
    })
  }
})

test.describe('administrator', () => {
  test.use({ role: 'owner' })

  for (const route of PANEL_ROUTES) {
    test(`${route} fits the viewport and is accessible`, async ({ page }) => {
      await visit(page, route)

      // Polled, not read once: the map and the images settle a moment after hydration.
      await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
      expect(await blockingViolations(page)).toEqual([])
    })
  }

  test('the report detail fits and the menu navigates', async ({ page }) => {
    await page.goto('/management/reports')
    await waitForHydration(page)

    // The first protocol of the list: a link in the table, or in a card on a phone.
    await page.getByRole('link', { name: /^CUR-/ }).first().click()
    await expect(page).toHaveURL(/\/management\/reports\/[0-9a-f-]{36}/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)

    await openMenu(page)
    await page.getByRole('link', { name: 'Avisos' }).first().click()
    await expect(page).toHaveURL(/\/management\/notices/)
    await expect(
      page.getByRole('heading', { name: 'Avisos', level: 1 }),
    ).toBeVisible()
  })

  test('the filters stay in the URL when the width changes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/management/reports?status=RECEIVED&kind=BURNING')
    await waitForHydration(page)

    await page.setViewportSize({ width: 360, height: 740 })
    await expect(
      page.getByRole('button', { name: 'Filtros (2)' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/status=RECEIVED/)
    await expect(page).toHaveURL(/kind=BURNING/)

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.getByRole('search')).toBeVisible()
    await expect(page).toHaveURL(/status=RECEIVED/)
  })
})

test.describe('operator', () => {
  test.use({ role: 'operator' })

  test('no way into schedules, neighborhoods or accounts', async ({ page }) => {
    await page.goto('/management')
    await waitForHydration(page)

    await openMenu(page)
    for (const name of ['Cronograma', 'Bairros', 'Contas']) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0)
    }
    await expect(
      page.getByRole('link', { name: 'Ocorrências' }).first(),
    ).toBeVisible()

    for (const route of [
      '/management/schedules',
      '/management/neighborhoods',
      '/management/users',
    ]) {
      await page.goto(route)
      await waitForHydration(page)
      await expect(page).toHaveURL(/\/management$/)
    }
  })
})
