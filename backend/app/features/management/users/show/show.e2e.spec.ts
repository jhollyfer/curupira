import { test } from '@japa/runner'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/users > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('returns the account without the password', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.create()

    const response = await client
      .get(`/management/users/${target.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.deepInclude(body(response), {
      id: target.id,
      email: target.email,
      role: 'OPERATOR',
    })
    assert.notProperty(body(response), 'password')
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/management/users/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
