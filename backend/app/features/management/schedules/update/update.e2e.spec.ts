import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/schedules > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('changes the weekday and keeps the rest', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    const slot = await CollectionScheduleFactory.merge({
      neighborhoodId: neighborhood.id,
    }).create()

    const response = await client
      .put(`/management/schedules/${slot.id}`)
      .cookies(session)
      .json({ weekday: 'SATURDAY' })

    response.assertStatus(200)
    assert.deepInclude(body(response), {
      weekday: 'SATURDAY',
      wasteType: 'ORGANIC',
    })
    const stored = await Stored.schedule(slot.id)
    assert.equal(stored?.weekday, 'SATURDAY')
  })

  test('moving onto an existing slot responds 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({
      neighborhoodId: neighborhood.id,
      weekday: 'FRIDAY',
    }).create()
    const slot = await CollectionScheduleFactory.merge({
      neighborhoodId: neighborhood.id,
    }).create()

    const response = await client
      .put(`/management/schedules/${slot.id}`)
      .cookies(session)
      .json({ weekday: 'FRIDAY' })

    response.assertStatus(409)
    assert.equal(body(response).code, 'SCHEDULE_ALREADY_EXISTS')
  })

  test('nonexistent responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .put('/management/schedules/00000000-0000-4000-8000-000000000000')
      .cookies(session)
      .json({ weekday: 'FRIDAY' })

    response.assertStatus(404)
    assert.equal(body(response).code, 'SCHEDULE_NOT_FOUND')
  })
})
