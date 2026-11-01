import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import { body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('storefront/reports > show-by-protocol', (group) => {
  group.each.setup(() => resetDatabase())

  test('shows only the public fields and the timeline, without a session', async ({
    client,
    assert,
  }) => {
    const report = await ReportFactory.apply('identified').create()
    const stored = await Stored.reportOrFail(report.id)

    const response = await client.get(`/storefront/reports/${stored.protocol}`)

    response.assertStatus(200)
    assert.deepEqual(Object.keys(body(response)).sort(), [
      'createdAt',
      'events',
      'kind',
      'protocol',
      'status',
    ])
    assert.deepEqual(Object.keys(body(response).events[0]).sort(), ['at', 'message', 'status'])
    assert.notInclude(response.text(), stored.contact ?? 'no-contact')
    assert.notInclude(response.text(), stored.description ?? 'no-description')
    assert.notInclude(response.text(), String(stored.latitude))
  })

  test('forgives case, spaces and look-alike letters in the protocol', async ({ client }) => {
    const report = await ReportFactory.merge({ protocol: 'CUR-2ABC-3D0F' }).create()
    const stored = await Stored.reportOrFail(report.id)

    const sloppy = await client.get(`/storefront/reports/${encodeURIComponent('cur 2abc 3dOf')}`)

    sloppy.assertStatus(200)
    sloppy.assertBodyContains({ protocol: stored.protocol })
  })

  test('an unknown and a malformed protocol answer the same 404', async ({ client, assert }) => {
    const unknown = await client.get('/storefront/reports/CUR-ZZZZ-ZZZZ')
    const malformed = await client.get('/storefront/reports/banana')

    unknown.assertStatus(404)
    malformed.assertStatus(404)
    assert.deepEqual(body(malformed), body(unknown))
    assert.equal(body(unknown).code, 'REPORT_NOT_FOUND')
  })

  test('throttles the lookups per IP: past 30 in ten minutes it is 429', async ({ client }) => {
    let last = 0
    for (let attempt = 0; attempt < 31; attempt++) {
      const response = await client.get('/storefront/reports/CUR-ZZZZ-ZZZZ')
      last = response.status()
    }

    if (last !== 429) throw new Error(`expected 429 after the ceiling, got ${last}`)
  })
})
