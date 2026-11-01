import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { waitForHydration } from './support/hydration'
import { expect, test } from './support/test'

/**
 * The panel at every width it has to serve, against the REAL API like the other specs.
 *
 * Three promises, checked at each size of the matrix:
 *  1. the PAGE never scrolls sideways (`scrollWidth <= innerWidth`) - a wide table or map
 *     may scroll inside its own box, never the document;
 *  2. the menu works: a drawer behind the header button on a phone, the sidebar from the
 *     tablet up, and either one navigates;
 *  3. the OPERATOR never gets the administrator's areas, whatever the width: not in the
 *     menu, and not by typing the address.
 * Axe runs on every screen too, with ZERO violations at any impact (the shared
 * `expectAccessible` only blocks serious and critical).
 */

type Size = Readonly<{ width: number; height: number }>

const MATRIX = [
  { width: 360, height: 740 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  // A phone on its side: short, so the header and sheets must not eat the screen.
  { width: 740, height: 360 },
] as const satisfies ReadonlyArray<Size>

/** Below this the sidebar is a drawer (`useIsMobile`, 768px). */
const DRAWER_BELOW = 768

const ROUTES = [
  '/gestao',
  '/gestao/reports',
  '/gestao/reports?status=RECEIVED',
  '/gestao/schedules',
  '/gestao/neighborhoods',
  '/gestao/neighborhoods/new',
  '/gestao/notices',
  '/gestao/notices/new',
  '/gestao/users',
  '/gestao/users/new',
  '/gestao/account/profile',
  '/gestao/does-not-exist',
] as const

const ADMIN_ONLY = [
  '/gestao/schedules',
  '/gestao/neighborhoods',
  '/gestao/users',
] as const

function label(size: Size): string {
  return `${size.width}x${size.height}`
}

async function fitsTheScreen(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
}

async function openMenu(page: Page, size: Size): Promise<void> {
  if (size.width < DRAWER_BELOW) {
    await page.getByRole('button', { name: 'Alternar barra lateral' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  }
}

async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitForHydration(page)
  await expect(page.locator('main, [id="conteudo"]').first()).toBeVisible()
}

test.describe('administrator', () => {
  test.use({ role: 'owner' })

  for (const size of MATRIX) {
    test(`${label(size)}: no screen scrolls the page sideways and axe is clean`, async ({
      page,
    }) => {
      await page.setViewportSize(size)

      for (const route of ROUTES) {
        await visit(page, route)
        // The data of the screen settles before it is measured: the filters and the
        // cards arrive after the shell.
        await page.waitForLoadState('load')
        expect(
          await fitsTheScreen(page),
          `${route} at ${label(size)}`,
        ).toBeLessThanOrEqual(0)

        const axe = await new AxeBuilder({ page })
          .exclude('.leaflet-container')
          .analyze()
        expect(axe.violations, `axe on ${route} at ${label(size)}`).toEqual([])
      }
    })

    test(`${label(size)}: the report detail fits and the menu navigates`, async ({
      page,
    }) => {
      await page.setViewportSize(size)
      await visit(page, '/gestao/reports')

      // The first protocol of the list: a link in the table, or in a card on a phone.
      await page.getByRole('link', { name: /^CUR-/ }).first().click()
      await expect(page).toHaveURL(/\/gestao\/reports\/[0-9a-f-]{36}/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await fitsTheScreen(page),
        `detail at ${label(size)}`,
      ).toBeLessThanOrEqual(0)

      await openMenu(page, size)
      await page.getByRole('link', { name: 'Avisos' }).first().click()
      await expect(page).toHaveURL(/\/gestao\/notices/)
      await expect(
        page.getByRole('heading', { name: 'Avisos', level: 1 }),
      ).toBeVisible()
    })
  }

  test('the filters stay in the URL when the width changes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/gestao/reports?status=RECEIVED&kind=BURNING')

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

  for (const size of MATRIX) {
    test(`${label(size)}: no way into schedules, neighborhoods or accounts`, async ({
      page,
    }) => {
      await page.setViewportSize(size)
      await visit(page, '/gestao')

      await openMenu(page, size)
      for (const name of ['Cronograma', 'Bairros', 'Contas']) {
        await expect(page.getByRole('link', { name, exact: true })).toHaveCount(
          0,
        )
      }
      await expect(
        page.getByRole('link', { name: 'Ocorrências' }).first(),
      ).toBeVisible()

      for (const route of ADMIN_ONLY) {
        await page.goto(route)
        await waitForHydration(page)
        await expect(page).toHaveURL(/\/gestao$/)
      }
    })
  }
})
