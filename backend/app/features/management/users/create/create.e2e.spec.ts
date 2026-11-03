import { test } from '@japa/runner'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const NEW = {
  name: 'Beto Operador',
  email: 'beto@mail.com',
  password: 'Senha1234!',
  passwordConfirmation: 'Senha1234!',
  role: 'OPERATOR',
}

test.group('management/users > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('creates the account, active, and the new user can sign in', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/users')
      .cookies(session)
      .json(NEW)

    response.assertStatus(201)
    assert.deepInclude(body(response), {
      email: NEW.email,
      role: 'OPERATOR',
      status: 'ACTIVE',
    })
    assert.notProperty(body(response), 'password')
    const stored = await Stored.userByEmailOrFail(NEW.email)
    assert.notEqual(stored.password, NEW.password)
    const signIn = await client
      .post('/authentication/sign-in')
      .json({ email: NEW.email, password: NEW.password })
    signIn.assertStatus(204)
  })

  test('the e-mail of another account responds 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const existing = await UserFactory.create()

    const response = await client
      .post('/management/users')
      .cookies(session)
      .json({ ...NEW, email: existing.email })

    response.assertStatus(409)
    assert.equal(body(response).code, 'USER_ALREADY_EXISTS')
  })

  test('a weak password, a mismatched confirmation or a missing role respond 422', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/users')
      .cookies(session)
      .json({
        name: 'X',
        email: 'x@mail.com',
        password: 'fraca',
        passwordConfirmation: 'outra',
      })

    response.assertStatus(422)
    assert.property(body(response).errors, 'password')
    assert.property(body(response).errors, 'role')
  })
})
