import { test } from '@japa/runner'
import { USER_ROLE } from '@curupira/shared'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

/**
 * The whole role matrix, one cell per case.
 *
 * It lives apart from the resource specs because the rule it asserts is **not**
 * any resource's: it is the design of `start/routes.ts`, and it breaks when someone
 * moves a route between groups.
 *
 * The distinction it protects above all is `401` versus `403`: without a session the
 * requester's role is unknown, and answering "you cannot" instead of
 * "I don't know who you are" would tell someone who has not even signed in that the resource exists.
 */

/** One read route of each resource the operator reaches. */
const OPERATOR_AREA = ['reports', 'reports/stats', 'reports/map', 'notices']

/** One read route of each resource only the administrator reaches. */
const ADMINISTRATOR_AREA = ['schedules', 'neighborhoods', 'users']

const NEW_USER = {
  name: 'Pessoa da gestão',
  email: 'gestao@mail.com',
  password: 'Demo1234!',
  passwordConfirmation: 'Demo1234!',
  role: USER_ROLE.OPERATOR,
}

test.group('roles > without a session', (group) => {
  group.each.setup(() => resetDatabase())

  test('the account answers 401, and not 403', async ({ client }) => {
    const response = await client.get('/account')

    response.assertStatus(401)
  })

  for (const resource of [...OPERATOR_AREA, ...ADMINISTRATOR_AREA]) {
    test(`/management/${resource} answers 401, and not 403`, async ({ client }) => {
      const response = await client.get(`/management/${resource}`)

      response.assertStatus(401)
    })
  }

  test('the site answers without a session', async ({ client }) => {
    for (const path of ['neighborhoods', 'schedules', 'notices', 'reports/map']) {
      const response = await client.get(`/storefront/${path}`)

      response.assertStatus(200)
    }
  })
})

test.group('roles > the operator works reports and notices only', (group) => {
  group.each.setup(() => resetDatabase())

  for (const resource of OPERATOR_AREA) {
    test(`/management/${resource} answers 200 to the operator`, async ({ client }) => {
      const session = await authenticateAsOperator(client)

      const response = await client.get(`/management/${resource}`).cookies(session)

      response.assertStatus(200)
    })
  }

  for (const resource of ADMINISTRATOR_AREA) {
    test(`/management/${resource} answers 403 to the operator`, async ({ client, assert }) => {
      const session = await authenticateAsOperator(client)

      const response = await client.get(`/management/${resource}`).cookies(session)

      response.assertStatus(403)
      assert.equal(body(response).code, 'ACCESS_DENIED')
    })
  }

  test('nor does it create an account', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client.post('/management/users').cookies(session).json(NEW_USER)

    response.assertStatus(403)
  })
})

test.group('roles > the administrator passes everywhere', (group) => {
  group.each.setup(() => resetDatabase())

  for (const resource of [...OPERATOR_AREA, ...ADMINISTRATOR_AREA]) {
    test(`/management/${resource} answers 200 to the administrator`, async ({ client }) => {
      const session = await authenticateAsAdministrator(client)

      const response = await client.get(`/management/${resource}`).cookies(session)

      response.assertStatus(200)
    })
  }

  test('the administrator goes through users from start to end', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const created = await client.post('/management/users').cookies(session).json(NEW_USER)
    created.assertStatus(201)

    const deleted = await client.delete(`/management/users/${body(created).id}`).cookies(session)
    deleted.assertStatus(204)
  })

  test('and deletes another administrator, who is not their own account', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)
    const other = await UserFactory.apply('administrator').create()

    const response = await client.delete(`/management/users/${other.id}`).cookies(session)

    response.assertStatus(204)
  })
})
