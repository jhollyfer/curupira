import { test } from '@japa/runner'
import { ACTIVE_STATUS, USER_ROLE } from '@curupira/shared'

import { UserFactory } from '#database/factories/user.factory'
import {
  ADMINISTRATOR,
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { findUserByEmail, userExists } from '#tests/users-fixtures'

/**
 * The self-lockout guard. Every path that would remove from the panel whoever is
 * administering answers `403`, and none of them gets to write - it is what
 * always keeps one administrator alive without having to count administrators.
 */
test.group('management > users > the administrator does not lock themselves out', (group) => {
  group.each.setup(() => resetDatabase())

  test('deleting their own account answers 403 and does not write', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const eu = await findUserByEmail(ADMINISTRATOR.email)

    const response = await client.delete(`/management/users/${eu.id}`).cookies(session)

    response.assertStatus(403)
    assert.equal(body(response).code, 'SELF_DELETE_FORBIDDEN')
    assert.isTrue(await userExists(eu.id))
  })

  test('demoting their own role answers 403 and does not write', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const eu = await findUserByEmail(ADMINISTRATOR.email)

    const response = await client
      .put(`/management/users/${eu.id}`)
      .cookies(session)
      .json({ role: USER_ROLE.OPERATOR })

    response.assertStatus(403)
    assert.equal(body(response).code, 'SELF_ACCESS_FORBIDDEN')

    await eu.refresh()
    assert.equal(eu.role, USER_ROLE.ADMINISTRATOR)
  })

  test('deactivating their own account answers 403 and does not write', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const eu = await findUserByEmail(ADMINISTRATOR.email)

    const response = await client
      .put(`/management/users/${eu.id}`)
      .cookies(session)
      .json({ status: ACTIVE_STATUS.INACTIVE })

    response.assertStatus(403)
    assert.equal(body(response).code, 'SELF_ACCESS_FORBIDDEN')

    await eu.refresh()
    assert.equal(eu.status, ACTIVE_STATUS.ACTIVE)
  })

  test('the guard is only about role and status: their own name stays editable', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const eu = await findUserByEmail(ADMINISTRATOR.email)

    const response = await client
      .put(`/management/users/${eu.id}`)
      .cookies(session)
      .json({ name: 'Editado' })

    response.assertStatus(200)
    assert.equal(body(response).name, 'Editado')
  })

  test('the guard is about who asks, not about the role: another administrator is deletable', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const other = await UserFactory.merge({ role: USER_ROLE.ADMINISTRATOR }).create()

    const response = await client.delete(`/management/users/${other.id}`).cookies(session)

    response.assertStatus(204)
  })
})
