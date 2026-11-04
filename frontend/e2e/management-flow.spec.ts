import { ownerCredentials } from './support/credentials'
import { waitForHydration } from './support/hydration'
import { expect, test } from './support/test'

/**
 * The panel's flows, against the REAL API. The owner seed gives the ADMINISTRATOR; the
 * demonstration seed gives the OPERATOR (`operator@example.com`, `E2E_DEMO_PASSWORD`). Only the first test signs in through the screen:
 * the others reuse the API sessions, because five sign-ins a minute is all the limiter
 * gives one IP.
 */

/** `datetime-local` text, in Benjamin Constant time (UTC-4, no daylight saving). */
function townLocal(offsetHours: number): string {
  const instant = new Date(
    Date.now() + offsetHours * 60 * 60 * 1000 - 4 * 60 * 60 * 1000,
  )

  return instant.toISOString().slice(0, 16)
}

test.describe('sign-in', () => {
  test('refuses a wrong password and lets the owner in', async ({
    page,
    expectAccessible,
  }) => {
    const { email, password } = ownerCredentials()

    await page.goto('/sign-in')
    await waitForHydration(page)
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(`${password}x`)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page).toHaveURL(/sign-in/)

    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(
      page.getByRole('heading', { name: 'Visão geral', level: 1 }),
    ).toBeVisible()
    await expectAccessible(page)
  })
})

test.describe('administrator', () => {
  test.use({ role: 'owner' })

  test('handles an untreated report and cannot move it back', async ({
    page,
  }) => {
    await page.goto('/management')
    await page.getByRole('link', { name: 'Tratar agora' }).click()

    await expect(
      page.getByRole('heading', { name: 'Ocorrências', level: 1 }),
    ).toBeVisible()
    // A link in the table, or in a card on a phone.
    await page.getByRole('link', { name: /^CUR-/ }).first().click()

    await page.getByRole('radio', { name: /Em análise/ }).check()
    await page
      .getByLabel('Resposta para quem denunciou (opcional)')
      .fill('Equipe a caminho.')
    await page.getByRole('button', { name: 'Salvar status' }).click()
    await expect(page.getByText('Status atualizado')).toBeVisible()

    await expect(page.getByRole('radio', { name: /Recebida/ })).toBeDisabled()
    await expect(
      page.getByText('Já passou por este status. O status só avança.').first(),
    ).toBeVisible()
  })

  test('publishes a notice, sees it on the home and closes it', async ({
    page,
    browser,
  }) => {
    const title = `Aviso E2E ${Date.now()}`
    const scheduled = `Aviso agendado E2E ${Date.now()}`

    await page.goto('/management/notices/new')
    await waitForHydration(page)
    await page.getByLabel('Título').fill(title)
    await page
      .getByLabel('Texto do aviso')
      .fill('Mutirão de limpeza no sábado.')
    await page.getByLabel('Começa em').fill(townLocal(-1))
    await page.getByRole('button', { name: /Salvar|Criar/ }).click()
    await expect(page.getByText(`Aviso “${title}” salvo`)).toBeVisible()

    // A notice that starts in two days is saved but not public yet.
    await page.goto('/management/notices/new')
    await waitForHydration(page)
    await page.getByLabel('Título').fill(scheduled)
    await page.getByLabel('Texto do aviso').fill('Começa depois de amanhã.')
    await page.getByLabel('Começa em').fill(townLocal(48))
    await page.getByRole('button', { name: /Salvar|Criar/ }).click()
    await expect(page.getByText(`Aviso “${scheduled}” salvo`)).toBeVisible()

    const resident = await browser.newContext({
      baseURL: page.url().split('/management')[0],
      locale: 'pt-BR',
    })
    const home = await resident.newPage()
    await home.goto('/notices')
    await expect(home.getByText(title)).toBeVisible()
    await expect(home.getByText(scheduled)).toHaveCount(0)

    // Close it: it leaves the resident's page and stays in the panel list as closed.
    await page.goto('/management/notices')
    await expect(page.getByText(scheduled)).toBeVisible()
    // A table row, or a card on a phone.
    const row = page
      .getByRole('row')
      .or(page.getByRole('listitem'))
      .filter({ hasText: title })
    await row.getByRole('button').click()
    await page.getByRole('menuitem', { name: 'Encerrar' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Encerrar' })
      .click()
    await expect(page.getByText('Aviso encerrado')).toBeVisible()

    await home.goto('/notices')
    await expect(home.getByText(title)).toHaveCount(0)
    await resident.close()
  })

  test('registers a collection day and the resident sees it on the calendar', async ({
    page,
    browser,
    ownerApi,
  }) => {
    // A run that died half way leaves its debris entry behind, and the API (rightly) answers
    // 409 for the same type, day and shift: start from the seed.
    const neighborhoods = await ownerApi.get(
      '/management/neighborhoods?perPage=100',
    )
    const { data } = await neighborhoods.json()
    const umarizal = data.find(
      (item: { name: string }) => item.name === 'Umarizal',
    )
    const entries = await ownerApi.get(
      `/management/schedules?neighborhoodId=${umarizal.id}&perPage=100`,
    )
    const { data: schedules } = await entries.json()
    for (const entry of schedules.filter(
      (item: { wasteType: string }) => item.wasteType === 'DEBRIS',
    )) {
      await ownerApi.delete(`/management/schedules/${entry.id}`)
    }

    await page.goto('/management/schedules')
    await waitForHydration(page)
    await page.getByLabel('Bairro').selectOption({ label: 'Umarizal' })
    // The weekly table, or the list of days on a phone.
    await expect(
      page.getByRole('table').or(
        page.getByRole('list', {
          name: 'Coletas da semana: tipo de lixo nas linhas, dia da semana nas colunas',
        }),
      ),
    ).toBeVisible()

    // Debris is not in the seed: the first free slot of its row is ours.
    await page
      .getByRole('button', { name: /Adicionar coleta de Entulho/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Coleta salva')).toBeVisible()

    const resident = await browser.newContext({
      baseURL: page.url().split('/management')[0],
      locale: 'pt-BR',
    })
    const calendar = await resident.newPage()
    await calendar.goto('/')
    await waitForHydration(calendar)
    await calendar.getByText('Umarizal', { exact: true }).click()
    await expect(calendar.getByText('Entulho').first()).toBeVisible()
    await resident.close()

    // Leave the seed as found.
    await page.reload()
    await page.getByLabel('Bairro').selectOption({ label: 'Umarizal' })
    await page
      .getByRole('button', { name: /editar coleta de Entulho/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Excluir' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Excluir' })
      .click()
    await expect(page.getByText('Coleta excluída')).toBeVisible()
  })
})

test.describe('operator', () => {
  test.use({ role: 'operator' })

  test('reaches reports and notices but not schedules, neighborhoods or users', async ({
    page,
  }) => {
    await page.goto('/management/reports')
    await expect(
      page.getByRole('heading', { name: 'Ocorrências', level: 1 }),
    ).toBeVisible()
    await page.goto('/management/notices')
    await expect(
      page.getByRole('heading', { name: 'Avisos', level: 1 }),
    ).toBeVisible()

    for (const path of [
      '/management/schedules',
      '/management/neighborhoods',
      '/management/users',
    ]) {
      await page.goto(path)
      await expect(page).not.toHaveURL(new RegExp(`${path}$`))
    }
    await expect(page.getByRole('link', { name: 'Cronograma' })).toHaveCount(0)
  })
})
