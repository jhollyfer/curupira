import { PROTOCOL_PATTERN } from '@curupira/shared'

import { expect, test } from './support/test'
import { waitForHydration } from './support/hydration'

/**
 * SKELETON of the resident's critical flow: report in three steps, get the protocol,
 * follow it. Written against the example data (`VITE_DATA_SOURCE=mock`), so it runs
 * with no backend; it has not been run in the build session - run it with
 * `pnpm test:e2e` before relying on it.
 */
test.describe('report and follow', () => {
  test('sends a report and follows it by the protocol', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: -4.3836, longitude: -70.0311 })

    await page.goto('/denunciar')
    await waitForHydration(page)

    // Step 1: what was seen.
    await page.getByText('Queimada').click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 2: one photo (the picker takes a file; no camera in CI) and the GPS pin.
    await page.locator('input[type=file]').last().setInputFiles({
      name: 'foto.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'),
    })
    await expect(page.getByText(/lugar marcado/i)).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 3: anonymous is the default.
    await expect(page.getByLabel('Enviar anônimo')).toBeChecked()
    await page.getByRole('button', { name: 'Enviar denúncia' }).click()

    const protocol = page.getByTestId('protocol')
    await expect(protocol).toHaveText(PROTOCOL_PATTERN)

    // Follow it.
    await page.getByRole('link', { name: 'Acompanhar esta denúncia' }).click()
    await expect(page.getByRole('heading', { name: /CUR-/ })).toBeVisible()
    await expect(page.getByText('Recebida').first()).toBeVisible()
  })

  test('saves the report on the device when offline', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: -4.3836, longitude: -70.0311 })

    await page.goto('/denunciar')
    await waitForHydration(page)
    await context.setOffline(true)

    await page.getByText('Descarte irregular de lixo').click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.locator('input[type=file]').last().setInputFiles({
      name: 'foto.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
    })
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Enviar denúncia' }).click()

    await expect(
      page.getByText(/salva no aparelho e será enviada quando voltar a conexão/i),
    ).toBeVisible()

    // The connection returns: the queue leaves by itself and the protocol shows as a toast.
    await context.setOffline(false)
    await expect(page.getByText(/Protocolo CUR-/)).toBeVisible()
  })

  test('tracks an example protocol', async ({ page, expectAccessible }) => {
    await page.goto('/acompanhar?protocol=CUR-7K3M-9QX2')

    await expect(page.getByText('Resolvida').first()).toBeVisible()
    await expectAccessible(page)
  })

  test('says so when the protocol does not exist', async ({ page }) => {
    await page.goto('/acompanhar?protocol=CUR-0000-0000')

    await expect(
      page.getByRole('heading', { name: 'Protocolo não encontrado' }),
    ).toBeVisible()
  })
})
