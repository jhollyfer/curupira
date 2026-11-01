import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { authenticateAsAdministrator, body, resetDatabase } from '#tests/http-fixtures'

test.group('management/schedules > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('returns the slot with the neighborhood name', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    const slot = await CollectionScheduleFactory.merge({ neighborhoodId: neighborhood.id }).create()

    const response = await client.get(`/management/schedules/${slot.id}`).cookies(session)

    response.assertStatus(200)
    assert.deepInclude(body(response), { id: slot.id, neighborhoodName: neighborhood.name })
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/management/schedules/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
