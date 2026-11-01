import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import { body, resetDatabase } from '#tests/http-fixtures'

test.group('storefront/notices > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('shows only the active notices, without a session', async ({ client, assert }) => {
    const active = await NoticeFactory.create()
    await NoticeFactory.apply('scheduled').create()
    await NoticeFactory.apply('expired').create()
    await NoticeFactory.apply('closed').create()

    const response = await client.get('/storefront/notices')

    response.assertStatus(200)
    assert.deepEqual(
      body(response).data.map((item: { id: string }) => item.id),
      [active.id],
    )
    assert.deepEqual(Object.keys(body(response).data[0]).sort(), [
      'body',
      'endsAt',
      'id',
      'startsAt',
      'title',
    ])
  })
})
