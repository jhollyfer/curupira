import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { ReportFactory } from '#database/factories/report.factory'
import { authenticateAsAdministrator, body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/neighborhoods > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes a neighborhood with no slots', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()

    const response = await client
      .delete(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.neighborhood(neighborhood.id))
  })

  test('refuses with 409 the neighborhood that still has collection slots', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({ neighborhoodId: neighborhood.id }).create()

    const response = await client
      .delete(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)

    response.assertStatus(409)
    assert.equal(body(response).code, 'NEIGHBORHOOD_IN_USE')
    assert.isNotNull(await Stored.neighborhood(neighborhood.id))
  })

  test('the reports filed under it stay, with no neighborhood', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    const report = await ReportFactory.merge({ neighborhoodId: neighborhood.id }).create()

    const response = await client
      .delete(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull((await Stored.reportOrFail(report.id)).neighborhoodId)
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .delete('/management/neighborhoods/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
