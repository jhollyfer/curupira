import { test } from '@japa/runner'

import { NoticeFactory } from '#database/factories/notice.factory'
import {
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/notices > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('cuts by the derived status', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    await NoticeFactory.create()
    await NoticeFactory.apply('scheduled').create()
    await NoticeFactory.apply('expired').create()
    await NoticeFactory.apply('closed').create()

    const total = async (status: string) => {
      const response = await client
        .get(`/management/notices?status=${status}`)
        .cookies(session)
      response.assertStatus(200)

      return body(response).meta.total
    }

    assert.equal(await total('ACTIVE'), 1)
    assert.equal(await total('SCHEDULED'), 1)
    assert.equal(await total('CLOSED'), 2)
  })

  test('an unknown status responds 422', async ({ client }) => {
    const session = await authenticateAsOperator(client)

    const response = await client
      .get('/management/notices?status=HIDDEN')
      .cookies(session)

    response.assertStatus(422)
  })
})
