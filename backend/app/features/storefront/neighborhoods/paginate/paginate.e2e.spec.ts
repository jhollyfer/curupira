import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { body, resetDatabase } from '#tests/http-fixtures'

test.group('storefront/neighborhoods > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists every neighborhood by name without a session', async ({ client, assert }) => {
    await NeighborhoodFactory.merge([
      { name: 'Cohab', slug: 'cohab' },
      { name: 'Centro', slug: 'centro' },
    ]).createMany(2)

    const response = await client.get('/storefront/neighborhoods')

    response.assertStatus(200)
    assert.deepEqual(
      body(response).data.map((item: { name: string }) => item.name),
      ['Centro', 'Cohab'],
    )
    assert.deepEqual(Object.keys(body(response).data[0]).sort(), [
      'id',
      'latitude',
      'longitude',
      'name',
      'slug',
    ])
  })
})
