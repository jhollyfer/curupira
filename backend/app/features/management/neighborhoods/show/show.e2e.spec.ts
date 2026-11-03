import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/neighborhoods > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('returns the neighborhood', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.apply('centered').create()

    const response = await client
      .get(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.deepInclude(body(response), {
      id: neighborhood.id,
      name: neighborhood.name,
    })
    assert.isNumber(body(response).latitude)
  })

  test('nonexistent responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/management/neighborhoods/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response).code, 'NEIGHBORHOOD_NOT_FOUND')
  })
})
