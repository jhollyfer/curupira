import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import { authenticateAsOperator, body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/notices > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('changes the title and keeps the rest', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    const notice = await NoticeFactory.create()

    const response = await client
      .put(`/management/notices/${notice.id}`)
      .cookies(session)
      .json({ title: 'Outro título' })

    response.assertStatus(200)
    assert.equal(body(response).title, 'Outro título')
    assert.equal((await Stored.noticeOrFail(notice.id)).body, notice.body)
  })

  test('an end before the existing start responds 422', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    const notice = await NoticeFactory.create()

    const response = await client
      .put(`/management/notices/${notice.id}`)
      .cookies(session)
      .json({ endsAt: '2000-01-01T00:00:00Z' })

    response.assertStatus(422)
    assert.equal(body(response).code, 'NOTICE_INVALID_PERIOD')
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .put('/management/notices/00000000-0000-4000-8000-000000000000')
      .cookies(session)
      .json({ title: 'X' })

    response.assertStatus(404)
  })
})
