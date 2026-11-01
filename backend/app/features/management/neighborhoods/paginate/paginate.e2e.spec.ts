import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { authenticateAsAdministrator, body, resetDatabase } from '#tests/http-fixtures'

test.group('management/neighborhoods > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists by name with the pagination envelope', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    await NeighborhoodFactory.merge([
      { name: 'Cohab', slug: 'cohab' },
      { name: 'Centro', slug: 'centro' },
    ]).createMany(2)

    const response = await client.get('/management/neighborhoods').cookies(session)

    response.assertStatus(200)
    assert.deepEqual(
      body(response).data.map((item: { name: string }) => item.name),
      ['Centro', 'Cohab'],
    )
    assert.equal(body(response).meta.total, 2)
  })

  test('searches by name and rejects a sort column outside the list', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    await NeighborhoodFactory.merge([
      { name: 'Cohab', slug: 'cohab' },
      { name: 'Centro', slug: 'centro' },
    ]).createMany(2)

    const searched = await client.get('/management/neighborhoods?search=coh').cookies(session)
    const invalid = await client.get('/management/neighborhoods?sort=slug').cookies(session)

    assert.equal(body(searched).meta.total, 1)
    invalid.assertStatus(422)
  })
})
