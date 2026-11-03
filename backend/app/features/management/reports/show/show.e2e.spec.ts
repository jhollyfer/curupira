import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import { StorageFactory } from '#database/factories/storage.factory'
import {
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/reports > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('the operator sees the contact, the description, the timeline and signed photos', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.apply('identified').create()
    const photo = await StorageFactory.create()
    await Stored.attachPhoto(report.id, photo.id)

    const response = await client
      .get(`/management/reports/${report.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.equal(body(response).contact, report.contact)
    assert.equal(body(response).description, report.description)
    assert.equal(body(response).events[0].status, 'RECEIVED')
    assert.isNull(body(response).events[0].authorName)
    assert.equal(body(response).photos[0].id, photo.id)
    assert.include(body(response).photos[0].url, photo.path)
  })

  test('nonexistent responds 404 and no session responds 401', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)

    const missing = await client
      .get('/management/reports/00000000-0000-4000-8000-000000000000')
      .cookies(session)
    const anonymous = await client.get(
      '/management/reports/00000000-0000-4000-8000-000000000000',
    )

    missing.assertStatus(404)
    assert.equal(body(missing).code, 'REPORT_NOT_FOUND')
    anonymous.assertStatus(401)
  })
})
