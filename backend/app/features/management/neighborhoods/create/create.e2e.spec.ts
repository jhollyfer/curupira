import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import {
  authenticateAsAdministrator,
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const payload = { name: 'Porto Cajuí', latitude: -4.37, longitude: -70.04 }

test.group('management/neighborhoods > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('creates the neighborhood with the slug taken from the name', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/neighborhoods')
      .cookies(session)
      .json(payload)

    response.assertStatus(201)
    assert.equal(body(response).slug, 'porto-cajui')
    assert.equal(body(response).latitude, -4.37)
    assert.isNotNull(await Stored.neighborhood(body(response).id))
  })

  test('repeated name responds 409 pointing at the field', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const existing = await NeighborhoodFactory.create()

    const response = await client
      .post('/management/neighborhoods')
      .cookies(session)
      .json({ name: existing.name })

    response.assertStatus(409)
    assert.equal(body(response).code, 'NEIGHBORHOOD_ALREADY_EXISTS')
    assert.property(body(response).errors, 'name')
  })

  test('half a center responds 422', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/neighborhoods')
      .cookies(session)
      .json({ name: 'Bairro', latitude: -4.37 })

    response.assertStatus(422)
    assert.equal(body(response).code, 'NEIGHBORHOOD_CENTER_INCOMPLETE')
    assert.isNull(await Stored.neighborhoodByName('Bairro'))
  })

  test('a coordinate out of range or an empty name responds 422', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/neighborhoods')
      .cookies(session)
      .json({ name: '', latitude: 91, longitude: 0 })

    response.assertStatus(422)
    assert.property(body(response).errors, 'name')
    assert.property(body(response).errors, 'latitude')
  })

  test('without a session responds 401 and the operator responds 403', async ({
    client,
    assert,
  }) => {
    const anonymous = await client
      .post('/management/neighborhoods')
      .json(payload)
    const operator = await authenticateAsOperator(client)
    const forbidden = await client
      .post('/management/neighborhoods')
      .cookies(operator)
      .json(payload)

    anonymous.assertStatus(401)
    forbidden.assertStatus(403)
    assert.equal(body(forbidden).code, 'ACCESS_DENIED')
  })
})
