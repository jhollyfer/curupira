import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import {
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/notices > close', (group) => {
  group.each.setup(() => resetDatabase())

  test('closes the notice and it leaves the public list', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const notice = await NoticeFactory.create()
    const before = await client.get('/storefront/notices')
    assert.equal(body(before).data.length, 1)

    const response = await client
      .patch(`/management/notices/${notice.id}/close`)
      .cookies(session)

    response.assertStatus(200)
    assert.equal(body(response).status, 'CLOSED')
    const stored = await Stored.noticeOrFail(notice.id)
    assert.isNotNull(stored.closedAt)
    const after = await client.get('/storefront/notices')
    assert.deepEqual(body(after).data, [])
  })

  test('closing twice responds 409', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    const notice = await NoticeFactory.apply('closed').create()

    const response = await client
      .patch(`/management/notices/${notice.id}/close`)
      .cookies(session)

    response.assertStatus(409)
    assert.equal(body(response).code, 'NOTICE_ALREADY_CLOSED')
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .patch('/management/notices/00000000-0000-4000-8000-000000000000/close')
      .cookies(session)

    response.assertStatus(404)
  })
})
