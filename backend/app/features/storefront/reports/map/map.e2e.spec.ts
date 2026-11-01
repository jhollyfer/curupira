import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import { body, resetDatabase } from '#tests/http-fixtures'

test.group('storefront/reports > map', (group) => {
  group.each.setup(() => resetDatabase())

  test('only reports already looked at, with no hour, no text and no contact', async ({
    client,
    assert,
  }) => {
    await ReportFactory.merge({ status: 'RECEIVED' }).create()
    const reviewed = await ReportFactory.apply('identified').merge({ status: 'IN_REVIEW' }).create()
    await ReportFactory.merge({ status: 'RESOLVED' }).create()

    const response = await client.get('/storefront/reports/map')

    response.assertStatus(200)
    assert.lengthOf(body(response), 2)
    for (const pin of response.body()) {
      assert.deepEqual(Object.keys(pin).sort(), [
        'day',
        'id',
        'kind',
        'latitude',
        'longitude',
        'status',
      ])
      assert.match(pin.day, /^\d{4}-\d{2}-\d{2}$/)
    }
    assert.notInclude(response.text(), reviewed.contact ?? 'no-contact')
    assert.notInclude(response.text(), reviewed.protocol)
  })
})
