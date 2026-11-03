import { test } from '@japa/runner'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/users > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists with the envelope, cuts by role and status, never shows the password', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    await UserFactory.createMany(2)
    await UserFactory.apply('inactive').create()

    const all = await client.get('/management/users').cookies(session)
    const operators = await client
      .get('/management/users?role=OPERATOR')
      .cookies(session)
    const inactive = await client
      .get('/management/users?status=INACTIVE')
      .cookies(session)

    all.assertStatus(200)
    assert.equal(body(all).meta.total, 4)
    assert.equal(body(operators).meta.total, 3)
    assert.equal(body(inactive).meta.total, 1)
    assert.notInclude(all.text(), 'password')
  })

  test('an unknown role responds 422', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/management/users?role=KING')
      .cookies(session)

    response.assertStatus(422)
  })
})
