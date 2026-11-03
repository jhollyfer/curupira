import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import {
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/reports > map', (group) => {
  group.each.setup(() => resetDatabase())

  test('returns every pin, in any status, filterable, with the protocol', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    await ReportFactory.merge({ kind: 'BURNING', status: 'RECEIVED' }).create()
    await ReportFactory.merge({ kind: 'DUMPING', status: 'RESOLVED' }).create()

    const all = await client.get('/management/reports/map').cookies(session)
    const burning = await client
      .get('/management/reports/map?kind=BURNING')
      .cookies(session)

    all.assertStatus(200)
    assert.lengthOf(body(all), 2)
    assert.lengthOf(body(burning), 1)
    assert.isString(body(burning)[0].protocol)
  })

  test('the pins carry no contact and no description', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.apply('identified').create()

    const response = await client
      .get('/management/reports/map')
      .cookies(session)

    assert.notInclude(response.text(), report.contact ?? 'no-contact')
    assert.notInclude(response.text(), report.description ?? 'no-description')
  })
})
