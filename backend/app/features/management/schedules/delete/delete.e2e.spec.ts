import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import {
  authenticateAsAdministrator,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/schedules > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes the slot', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    const slot = await CollectionScheduleFactory.merge({
      neighborhoodId: neighborhood.id,
    }).create()

    const response = await client
      .delete(`/management/schedules/${slot.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.schedule(slot.id))
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .delete('/management/schedules/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
