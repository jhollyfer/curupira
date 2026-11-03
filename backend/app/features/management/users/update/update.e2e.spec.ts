import { test } from '@japa/runner'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticate,
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { FACTORY_PASSWORD } from '#database/factories/user.factory'
import { Stored } from '#tests/stored-fixtures'

test.group('management/users > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('changes the role and the target session stops working', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.create()
    const targetSession = await authenticate(
      client,
      target.email,
      FACTORY_PASSWORD,
    )

    const response = await client
      .put(`/management/users/${target.id}`)
      .cookies(session)
      .json({ role: 'ADMINISTRATOR' })

    response.assertStatus(200)
    assert.equal(body(response).role, 'ADMINISTRATOR')
    const stored = await Stored.userOrFail(target.id)
    assert.equal(stored.role, 'ADMINISTRATOR')
    const stale = await client.get('/account').cookies(targetSession)
    stale.assertStatus(401)
  })

  test('deactivating blocks the next sign-in', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.create()

    const response = await client
      .put(`/management/users/${target.id}`)
      .cookies(session)
      .json({ status: 'INACTIVE' })

    response.assertStatus(200)
    const signIn = await client
      .post('/authentication/sign-in')
      .json({ email: target.email, password: FACTORY_PASSWORD })
    signIn.assertStatus(401)
    const stored = await Stored.userOrFail(target.id)
    assert.equal(stored.status, 'INACTIVE')
  })

  test('an e-mail already taken responds 409', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const other = await UserFactory.create()
    const target = await UserFactory.create()

    const response = await client
      .put(`/management/users/${target.id}`)
      .cookies(session)
      .json({ email: other.email })

    response.assertStatus(409)
    assert.equal(body(response).code, 'USER_ALREADY_EXISTS')
  })

  test('an explicit null on a field responds 422, not a silent no-op', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.create()

    const response = await client
      .put(`/management/users/${target.id}`)
      .cookies(session)
      .json({ name: null })

    response.assertStatus(422)
    assert.property(body(response).errors, 'name')
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .put('/management/users/00000000-0000-4000-8000-000000000000')
      .cookies(session)
      .json({ name: 'X' })

    response.assertStatus(404)
  })
})
