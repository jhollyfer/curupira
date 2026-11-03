import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import { authenticateAsOperator, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/notices > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes the notice', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    const notice = await NoticeFactory.create()

    const response = await client
      .delete(`/management/notices/${notice.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.notice(notice.id))
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .delete('/management/notices/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
