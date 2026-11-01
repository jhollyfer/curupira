import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'

import { ReportFactory } from '#database/factories/report.factory'
import { authenticateAsOperator, resetDatabase } from '#tests/http-fixtures'
import { jpegWithGps, uploadReportPhoto } from '#tests/report-photo-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('management/reports > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes the report, its timeline, and the photo row and binary', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const photoId = await uploadReportPhoto(client, await jpegWithGps())
    const created = await client
      .post('/storefront/reports')
      .json({ kind: 'DUMPING', latitude: -4.37, longitude: -70.03, photoIds: [photoId] })
    created.assertStatus(201)
    const report = await Stored.reportByProtocol(created.body().protocol)
    const photo = await Stored.storageOrFail(photoId)

    const response = await client.delete(`/management/reports/${report?.id}`).cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.report(report?.id ?? ''))
    assert.lengthOf(await Stored.eventsOfReport(report?.id ?? ''), 0)
    assert.isNull(await Stored.storage(photoId))
    assert.isFalse(await drive.use().exists(photo.path))
  })

  test('nonexistent responds 404', async ({ client }) => {
    const session = await authenticateAsOperator(client)
    const report = await ReportFactory.create()
    await client.delete(`/management/reports/${report.id}`).cookies(session)

    const again = await client.delete(`/management/reports/${report.id}`).cookies(session)

    again.assertStatus(404)
  })
})
