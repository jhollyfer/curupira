import { test } from '@japa/runner'

import { ReportFactory } from '#database/factories/report.factory'
import {
  authenticateAsOperator,
  body,
  invalidPayload,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/reports > update-status', (group) => {
  group.each.setup(() => resetDatabase())

  test('moves forward, writes the event with the author and the resident reads it', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.create()

    const response = await client
      .patch(`/management/reports/${report.id}/status`)
      .cookies(session)
      .json({ status: 'IN_REVIEW', message: 'Equipe a caminho.' })

    response.assertStatus(200)
    assert.equal(body(response).status, 'IN_REVIEW')
    assert.equal(body(response).events.at(-1).message, 'Equipe a caminho.')
    assert.isString(body(response).events.at(-1).authorName)
    const events = await Stored.eventsOfReport(report.id)
    assert.lengthOf(events, 2)
    assert.isNotNull(events[1]?.authorId)
    const publicView = await client.get(
      `/storefront/reports/${report.protocol}`,
    )
    assert.equal(body(publicView).status, 'IN_REVIEW')
    assert.equal(body(publicView).events.at(-1).message, 'Equipe a caminho.')
    assert.notProperty(body(publicView).events.at(-1), 'authorName')
  })

  test('going back or repeating the status responds 422 and writes nothing', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.merge({ status: 'FORWARDED' }).create()

    const back = await client
      .patch(`/management/reports/${report.id}/status`)
      .cookies(session)
      .json({ status: 'IN_REVIEW' })
    const same = await client
      .patch(`/management/reports/${report.id}/status`)
      .cookies(session)
      .json({ status: 'FORWARDED' })

    back.assertStatus(422)
    assert.equal(body(back).code, 'REPORT_STATUS_REGRESSION')
    assert.property(body(back).errors, 'status')
    same.assertStatus(422)
    assert.lengthOf(await Stored.eventsOfReport(report.id), 1)
  })

  test('an unknown status or a too long message responds 422', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.create()

    const response = await client
      .patch(`/management/reports/${report.id}/status`)
      .cookies(session)
      .json(invalidPayload({ status: 'DONE', message: 'x'.repeat(501) }))

    response.assertStatus(422)
    assert.property(body(response).errors, 'status')
    assert.property(body(response).errors, 'message')
  })

  test('nonexistent responds 404 and no session responds 401', async ({
    client,
  }) => {
    const session = await authenticateAsOperator(client)

    const missing = await client
      .patch('/management/reports/00000000-0000-4000-8000-000000000000/status')
      .cookies(session)
      .json({ status: 'IN_REVIEW' })
    const anonymous = await client
      .patch('/management/reports/00000000-0000-4000-8000-000000000000/status')
      .json({ status: 'IN_REVIEW' })

    missing.assertStatus(404)
    anonymous.assertStatus(401)
  })
})
