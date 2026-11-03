import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import {
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/notices > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('returns the notice with the status derived now', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const scheduled = await NoticeFactory.apply('scheduled').create()
    const expired = await NoticeFactory.apply('expired').create()

    const first = await client
      .get(`/management/notices/${scheduled.id}`)
      .cookies(session)
    const second = await client
      .get(`/management/notices/${expired.id}`)
      .cookies(session)

    assert.equal(body(first).status, 'SCHEDULED')
    assert.equal(body(second).status, 'CLOSED')
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .get('/management/notices/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
  })
})
