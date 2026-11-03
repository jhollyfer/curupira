import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { body, resetDatabase } from '#tests/http-fixtures'

test.group('storefront/schedules > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('the whole week of a neighborhood in week order, without a session', async ({
    client,
    assert,
  }) => {
    const mine = await NeighborhoodFactory.create()
    const other = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({
      neighborhoodId: mine.id,
      weekday: 'FRIDAY',
    }).create()
    await CollectionScheduleFactory.merge({
      neighborhoodId: mine.id,
      weekday: 'MONDAY',
    }).create()
    await CollectionScheduleFactory.merge({ neighborhoodId: other.id }).create()

    const response = await client.get(
      `/storefront/schedules?neighborhoodId=${mine.id}`,
    )

    response.assertStatus(200)
    assert.deepEqual(
      body(response).data.map((item: { weekday: string }) => item.weekday),
      ['MONDAY', 'FRIDAY'],
    )
    assert.notProperty(body(response).data[0], 'createdAt')
  })

  test('with no filter returns every neighborhood, and a malformed id is 422', async ({
    client,
    assert,
  }) => {
    const mine = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({ neighborhoodId: mine.id }).create()

    const all = await client.get('/storefront/schedules')
    const malformed = await client.get(
      '/storefront/schedules?neighborhoodId=xyz',
    )

    assert.equal(body(all).meta.total, 1)
    malformed.assertStatus(422)
  })
})
