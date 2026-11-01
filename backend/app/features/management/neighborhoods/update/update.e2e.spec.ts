import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { authenticateAsAdministrator, body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/neighborhoods > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('renames and re-derives the slug', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()

    const response = await client
      .put(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)
      .json({ name: 'São Francisco' })

    response.assertStatus(200)
    assert.equal(body(response).slug, 'sao-francisco')
    assert.equal((await Stored.neighborhoodOrFail(neighborhood.id)).name, 'São Francisco')
  })

  test('null on both coordinates erases the center', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.apply('centered').create()

    const response = await client
      .put(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)
      .json({ latitude: null, longitude: null })

    response.assertStatus(200)
    assert.isNull(body(response).latitude)
    assert.isNull((await Stored.neighborhoodOrFail(neighborhood.id)).longitude)
  })

  test('the name of another neighborhood responds 409', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const other = await NeighborhoodFactory.create()
    const neighborhood = await NeighborhoodFactory.create()

    const response = await client
      .put(`/management/neighborhoods/${neighborhood.id}`)
      .cookies(session)
      .json({ name: other.name })

    response.assertStatus(409)
    assert.equal(body(response).code, 'NEIGHBORHOOD_ALREADY_EXISTS')
  })

  test('nonexistent responds 404 and a malformed id responds 422', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const missing = await client
      .put('/management/neighborhoods/00000000-0000-4000-8000-000000000000')
      .cookies(session)
      .json({ name: 'X' })
    const malformed = await client
      .put('/management/neighborhoods/xyz')
      .cookies(session)
      .json({ name: 'X' })

    missing.assertStatus(404)
    assert.equal(body(missing).code, 'NEIGHBORHOOD_NOT_FOUND')
    malformed.assertStatus(422)
  })
})
