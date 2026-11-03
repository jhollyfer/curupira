import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/users > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes another account for good', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.create()

    const response = await client
      .delete(`/management/users/${target.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.user(target.id))
  })

  test('the history the account wrote stays, with no author', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const target = await UserFactory.apply('administrator').create()
    const report = await ReportFactory.create()
    const update = await client
      .patch(`/management/reports/${report.id}/status`)
      .cookies(session)
      .json({ status: 'IN_REVIEW' })
    update.assertStatus(200)
    const events = await Stored.eventsOfReport(report.id)
    assert.isNotNull(events[1]?.authorId)

    const response = await client
      .delete(`/management/users/${target.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.lengthOf(await Stored.eventsOfReport(report.id), 2)
  })

  test('nonexistent responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .delete('/management/users/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response).code, 'USER_NOT_FOUND')
  })
})
