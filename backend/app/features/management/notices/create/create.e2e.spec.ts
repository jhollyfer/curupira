import { test } from '@japa/runner'

import {
  authenticateAsOperator,
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const BASE = { title: 'Mutirão de limpeza', body: 'Sábado, às 7h.' }

test.group('management/notices > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('the operator publishes an active notice', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .post('/management/notices')
      .cookies(session)
      .json({ ...BASE, startsAt: '2020-01-01T08:00:00-04:00' })

    response.assertStatus(201)
    assert.deepInclude(body(response), { title: BASE.title, status: 'ACTIVE', endsAt: null })
    assert.isNotNull(await Stored.notice(body(response).id))
  })

  test('a future start is SCHEDULED', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/notices')
      .cookies(session)
      .json({ ...BASE, startsAt: '2999-01-01T08:00:00Z' })

    response.assertStatus(201)
    assert.equal(body(response).status, 'SCHEDULED')
  })

  test('an end before the start responds 422 pointing at endsAt', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .post('/management/notices')
      .cookies(session)
      .json({ ...BASE, startsAt: '2030-01-02T08:00:00Z', endsAt: '2030-01-01T08:00:00Z' })

    response.assertStatus(422)
    assert.equal(body(response).code, 'NOTICE_INVALID_PERIOD')
    assert.property(body(response).errors, 'endsAt')
  })

  test('a date that is not ISO 8601 with offset responds 422', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .post('/management/notices')
      .cookies(session)
      .json({ ...BASE, startsAt: '03/11/2026 14:30' })

    response.assertStatus(422)
    assert.property(body(response).errors, 'startsAt')
  })

  test('without a session responds 401', async ({ client }) => {
    const response = await client.post('/management/notices').json({})

    response.assertStatus(401)
  })
})
