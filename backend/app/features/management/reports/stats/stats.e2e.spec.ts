import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import { authenticateAsOperator, body, resetDatabase } from '#tests/http-fixtures'

test.group('management/reports > stats', (group) => {
  group.each.setup(() => resetDatabase())

  test('an empty base has every key at zero and 30 days of series', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)

    const response = await client.get('/management/reports/stats').cookies(session)

    response.assertStatus(200)
    assert.equal(body(response).total, 0)
    assert.deepEqual(body(response).byKind, { BURNING: 0, DUMPING: 0, DEFORESTATION: 0, OTHER: 0 })
    assert.lengthOf(body(response).lastThirtyDays, 30)
  })

  test('counts by kind and status, and today lands on the last day', async ({ client, assert }) => {
    const session = await authenticateAsOperator(client)
    await ReportFactory.merge({ kind: 'BURNING' }).create()
    await ReportFactory.merge({ kind: 'BURNING', status: 'RESOLVED' }).create()
    await ReportFactory.merge({ kind: 'OTHER' }).create()

    const response = await client.get('/management/reports/stats').cookies(session)

    assert.equal(body(response).total, 3)
    assert.equal(body(response).byKind.BURNING, 2)
    assert.equal(body(response).byStatus.RESOLVED, 1)
    assert.equal(body(response).lastThirtyDays.at(-1).total, 3)
  })
})
