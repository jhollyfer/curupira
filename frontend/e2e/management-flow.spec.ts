import { waitForHydration } from './support/hydration'
import { ownerCredentials } from './support/credentials'
import { expect, test } from './support/test'

/**
 * SKELETON of the panel's critical flow: sign in, open an untreated report from the
 * overview shortcut, move its status forward with a response, and see the rule that it
 * cannot go back. Written against the example data (`VITE_DATA_SOURCE=mock`, the config's
 * default), where the sign-in accepts the example accounts; with `E2E_DATA_SOURCE=api`
 * the seeder's owner (`E2E_OWNER_*`) signs in instead. It has not been run in the build
 * session - run it with `pnpm test:e2e` before relying on it.
 */
test.describe('management panel', () => {
  test('signs in, handles an untreated report and cannot move it back', async ({
    page,
    expectAccessible,
  }) => {
    const { email, password } = ownerCredentials()

    await page.goto('/sign-in')
    await waitForHydration(page)
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // The overview: the shortcut to what nobody has looked at yet.
    await expect(
      page.getByRole('heading', { name: 'Visão geral', level: 1 }),
    ).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('link', { name: 'Tratar agora' }).click()

    // The list, already filtered to the received ones.
    await expect(
      page.getByRole('heading', { name: 'Ocorrências', level: 1 }),
    ).toBeVisible()
    await page
      .getByRole('table')
      .getByRole('link', { name: /^CUR-/ })
      .first()
      .click()

    // Detail: move it to "Em análise" with a response the resident will read.
    await page.getByRole('radio', { name: /Em análise/ }).check()
    await page
      .getByLabel('Resposta para quem denunciou (opcional)')
      .fill('Equipe a caminho.')
    await page.getByRole('button', { name: 'Salvar status' }).click()
    await expect(page.getByText('Status atualizado')).toBeVisible()

    // Forward only: the status it just left is disabled, and says why.
    await expect(page.getByRole('radio', { name: /Recebida/ })).toBeDisabled()
    await expect(
      page.getByText('Já passou por este status. O status só avança.').first(),
    ).toBeVisible()
  })

  test('an administrator reaches the schedule, grouped by neighborhood', async ({
    page,
  }) => {
    const { email, password } = ownerCredentials()

    await page.goto('/sign-in')
    await waitForHydration(page)
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('link', { name: 'Cronograma' }).click()

    await expect(
      page.getByRole('heading', { name: 'Cronograma da coleta', level: 1 }),
    ).toBeVisible()
    await page.getByLabel('Bairro').selectOption({ label: 'Centro' })
    await expect(page.getByRole('table')).toBeVisible()
  })
})
