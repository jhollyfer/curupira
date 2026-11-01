import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { authenticateAsAdministrator, body, resetDatabase } from '#tests/http-fixtures'

test.group('management/schedules > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists the slots with the neighborhood name and cuts by neighborhood', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const first = await NeighborhoodFactory.create()
    const second = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({ neighborhoodId: first.id }).create()
    await CollectionScheduleFactory.merge({ neighborhoodId: second.id }).create()
    await CollectionScheduleFactory.merge({ neighborhoodId: second.id, weekday: 'FRIDAY' }).create()

    const all = await client.get('/management/schedules').cookies(session)
    const one = await client
      .get(`/management/schedules?neighborhoodId=${second.id}`)
      .cookies(session)

    all.assertStatus(200)
    assert.equal(body(all).meta.total, 3)
    assert.equal(body(all).data[0].neighborhoodName, first.name)
    assert.equal(body(one).meta.total, 2)
  })
})
