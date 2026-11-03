import {
  PROTOCOL_PATTERN,
  StorefrontReportMapResponse,
  StorefrontScheduleShowResponse,
  paginatedResponse,
  z,
} from '@curupira/shared'
import type { WasteType } from '@curupira/shared'
import type { APIRequestContext, Page } from '@playwright/test'

import { API_URL, apiClient } from './support/api'
import { waitForHydration } from './support/hydration'
import { hasEmbeddedMetadata, photoWithGps } from './support/photo'
import { expect, test } from './support/test'

/**
 * The resident's flows, against the REAL API (backend on
 * `E2E_API_URL`, seeded with the demonstration seed).
 *
 * The specs file reports on purpose, so the limiter matters: ten reports per hour per IP,
 * blocked for ten minutes after that. Run `truncate rate_limits` on the backend database
 * between runs; the throttle spec is last because it leaves the IP blocked.
 */

/** Reports this run has already spent from the IP's hourly quota. */
let filedInThisRun = 0

const PHOTO = {
  name: 'foto.jpg',
  mimeType: 'image/jpeg',
  buffer: photoWithGps(),
}

type Pin = 'tap-map' | 'gps'

/**
 * Offline the lazy map chunk may never have been fetched, so that path places the pin
 * with the device location (the page asks for it on its own when the step opens).
 */
async function fileReport(
  page: Page,
  kind: string,
  pin: Pin = 'tap-map',
): Promise<void> {
  await page.getByText(kind, { exact: true }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.locator('input[type=file]').last().setInputFiles(PHOTO)
  // The preview grows the page: tapping before it settles lands on a map that moved.
  await expect(page.getByText(/1 de 3 fotos/)).toBeVisible()
  // The pin is placed by tapping the map: the resident's GPS is not the only way.
  // The map mounts lazily and the first tap can land before its handler is attached, so
  // the tap is repeated until the pin shows (a second tap only moves the same pin).
  if (pin === 'tap-map') {
    await expect(async () => {
      await page
        .locator('.leaflet-container')
        .click({ position: { x: 200, y: 160 } })
      await expect(page.getByText(/lugar marcado/i)).toBeVisible({
        timeout: 1500,
      })
    }).toPass({ timeout: 15_000 })
  }
  await expect(page.getByText(/lugar marcado/i)).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByLabel('Enviar anônimo')).toBeChecked()
  await page.getByRole('button', { name: 'Enviar denúncia' }).click()
}

/** The report the panel holds for a protocol: what the public screens never show. */
async function managementReport(api: APIRequestContext, protocol: string) {
  const list = await api.get(
    `/management/reports?search=${encodeURIComponent(protocol)}`,
  )
  expect(list.ok()).toBe(true)
  const { data } = await list.json()
  expect(data).toHaveLength(1)

  const detail = await api.get(`/management/reports/${data[0].id}`)
  expect(detail.ok()).toBe(true)

  return await detail.json()
}

const MAP_LIST_TITLE = /^(Nenhuma ocorrência|1 ocorrência|\d+ ocorrências)$/

test.describe('resident', () => {
  test('picks the neighborhood and sees the next collection from the real schedule', async ({
    page,
    request,
  }) => {
    await page.goto('/')
    await waitForHydration(page)

    await page.getByText('Centro', { exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Próxima coleta no seu bairro' }),
    ).toBeVisible()

    // What the screen says must come from the API's schedule, not from the example data.
    const response = await request.get(
      `${API_URL}/storefront/neighborhoods?perPage=100`,
    )
    const { data: neighborhoods } = await response.json()
    const centro = neighborhoods.find(
      (item: { name: string }) => item.name === 'Centro',
    )
    const schedules = await request.get(
      `${API_URL}/storefront/schedules?perPage=100&neighborhoodId=${centro.id}`,
    )
    const { data: passes } = paginatedResponse(
      StorefrontScheduleShowResponse,
    ).parse(await schedules.json())
    expect(passes.length).toBeGreaterThan(0)

    const labels = {
      ORGANIC: 'Lixo orgânico',
      RECYCLABLE: 'Recicláveis',
      BULKY: 'Móveis e volumosos',
      DEBRIS: 'Entulho',
    } satisfies Record<WasteType, string>
    const shown = await page
      .locator('section[aria-labelledby=next-collection]')
      .innerText()
    expect(passes.some((pass) => shown.includes(labels[pass.wasteType]))).toBe(
      true,
    )
  })

  test('files an anonymous report with a real photo, follows it and the panel answers it', async ({
    page,
    context,
    browser,
    ownerApi,
    request,
    sessions,
  }) => {
    await page.goto('/denunciar')
    await waitForHydration(page)
    await fileReport(page, 'Queimada')

    const protocol = page.getByTestId('protocol')
    await expect(protocol).toHaveText(PROTOCOL_PATTERN)
    const code = (await protocol.innerText()).trim()
    filedInThisRun += 1

    // The panel's view of what was stored: anonymous, and a photo without camera data.
    const stored = await managementReport(ownerApi, code)
    expect(stored.contact).toBeNull()
    expect(stored.photos).toHaveLength(1)
    const photo = await ownerApi.get(stored.photos[0].url)
    expect(photo.ok()).toBe(true)
    expect(hasEmbeddedMetadata(await photo.body())).toBe(false)

    // Nothing is on the public map before somebody looked at it.
    const pins = async () => {
      const response = await request.get(`${API_URL}/storefront/reports/map`)

      return z.array(StorefrontReportMapResponse).parse(await response.json())
    }
    expect((await pins()).map((pin) => pin.id)).not.toContain(stored.id)
    await page.goto('/mapa')
    await waitForHydration(page)
    const before = await page
      .getByRole('heading', { name: MAP_LIST_TITLE })
      .innerText()

    // Follow it: received.
    await page.goto(`/acompanhar?protocol=${code}`)
    await expect(page.getByText('Recebida').first()).toBeVisible()

    // The panel, on a desktop screen.
    const panel = await browser.newContext({
      storageState: await sessions.owner(),
      viewport: { width: 1440, height: 900 },
      locale: 'pt-BR',
      baseURL: page.url().split('/acompanhar')[0],
    })
    const desk = await panel.newPage()
    await desk.goto('/gestao/reports')
    await waitForHydration(desk)
    await expect(
      desk.getByRole('table').getByRole('link', { name: code }),
    ).toBeVisible()
    await expect(
      desk.locator(`.leaflet-marker-icon[title*="${code}"]`),
    ).toBeVisible()

    await desk.getByRole('table').getByRole('link', { name: code }).click()
    await desk.getByRole('radio', { name: /Em análise/ }).check()
    await desk
      .getByLabel('Resposta para quem denunciou (opcional)')
      .fill('Equipe a caminho do local.')
    await desk.getByRole('button', { name: 'Salvar status' }).click()
    await expect(desk.getByText('Status atualizado')).toBeVisible()
    await panel.close()

    // The resident now sees the new step and the answer.
    await page.goto(`/acompanhar?protocol=${code}`)
    await expect(page.getByText('Em análise').first()).toBeVisible()
    await expect(page.getByText('Equipe a caminho do local.')).toBeVisible()

    // And only now the pin is public.
    expect((await pins()).map((pin) => pin.id)).toContain(stored.id)
    await page.goto('/mapa')
    await waitForHydration(page)
    await expect(
      page.getByRole('heading', { name: MAP_LIST_TITLE }),
    ).not.toHaveText(before)
    void context
  })

  test('the server strips camera data even when the browser sent it untouched', async ({
    playwright,
    ownerApi,
  }) => {
    const resident = await apiClient(playwright)
    const slot = await resident.post('/storefront/report-photos', {
      data: { mimetype: 'image/jpeg', size: PHOTO.buffer.length },
    })
    expect(slot.status()).toBe(201)
    const { id, uploadUrl } = await slot.json()

    const put = await playwright.request.newContext()
    const uploaded = await put.put(uploadUrl, {
      data: PHOTO.buffer,
      headers: { 'Content-Type': 'image/jpeg' },
    })
    expect(uploaded.ok()).toBe(true)
    expect(
      (
        await resident.post(`/storefront/report-photos/${id}/complete`)
      ).status(),
    ).toBe(204)

    const filed = await resident.post('/storefront/reports', {
      data: {
        kind: 'BURNING',
        latitude: -4.3836,
        longitude: -70.0311,
        photoIds: [id],
      },
    })
    expect(filed.status()).toBe(201)
    filedInThisRun += 1
    const { protocol } = await filed.json()

    const stored = await managementReport(ownerApi, protocol)
    const photo = await ownerApi.get(stored.photos[0].url)
    expect(hasEmbeddedMetadata(await photo.body())).toBe(false)
    await put.dispose()
    await resident.dispose()
  })

  test('saves the report on the device offline and sends it when the connection returns', async ({
    page,
    context,
    ownerApi,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: -4.3836, longitude: -70.0311 })
    await page.goto('/denunciar')
    await waitForHydration(page)
    await context.setOffline(true)

    await fileReport(page, 'Descarte irregular de lixo', 'gps')
    await expect(
      page.getByText(
        /salva no aparelho e será enviada quando voltar a conexão/i,
      ),
    ).toBeVisible()

    await context.setOffline(false)
    const toast = page.getByText(/Protocolo CUR-/)
    await expect(toast).toBeVisible()
    filedInThisRun += 1

    const code = /CUR-[A-Z0-9]{4}-[A-Z0-9]{4}/.exec(
      await toast.innerText(),
    )?.[0]
    expect(code).toBeDefined()
    const stored = await managementReport(ownerApi, code ?? '')
    expect(stored.contact).toBeNull()
    expect(stored.photos).toHaveLength(1)
  })

  test('says the protocol does not exist', async ({ page }) => {
    await page.goto('/acompanhar?protocol=CUR-0000-0000')

    await expect(
      page.getByRole('heading', { name: 'Protocolo não encontrado' }),
    ).toBeVisible()
  })

  test('an unknown address answers a real 404, in every language, with the app shell', async ({
    page,
  }) => {
    const cases = [
      { path: '/nao-existe', title: 'Página não encontrada' },
      { path: '/es/no-existe', title: 'Página no encontrada' },
      { path: '/en/does-not-exist', title: 'Page not found' },
    ]

    for (const { path, title } of cases) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /noindex/,
      )
    }
  })

  test('the eleventh report of the hour from the same IP is refused, in plain words', async ({
    page,
    playwright,
  }) => {
    // The limiter runs before the validator, so an empty body spends the quota the same
    // way a real report does, without needing a photo per attempt.
    const resident = await apiClient(playwright)
    const statuses: Array<number> = []

    for (let attempt = 1; attempt <= 11; attempt += 1) {
      const response = await resident.post('/storefront/reports', { data: {} })
      statuses.push(response.status())
    }
    await resident.dispose()
    const refusedAt = statuses.indexOf(429) + 1

    // With a clean bucket the refusal is the 11th overall; earlier ones already spent some.
    expect(refusedAt).toBeGreaterThan(0)
    expect(refusedAt + filedInThisRun).toBeLessThanOrEqual(11)

    // The browser shares the IP, so the screen meets the same wall.
    await page.goto('/denunciar')
    await waitForHydration(page)
    await fileReport(page, 'Queimada')
    await expect(
      page.getByText(/enviou muitas denúncias em pouco tempo/i),
    ).toBeVisible()
  })
})
