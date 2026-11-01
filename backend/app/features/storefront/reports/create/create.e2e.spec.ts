import { test } from '@japa/runner'
import { PROTOCOL_PATTERN } from '@curupira/shared'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { body, invalidPayload, resetDatabase } from '#tests/http-fixtures'
import { uploadReportPhoto } from '#tests/report-photo-fixtures'
import { storageRow } from '#tests/storages-fixtures'
import { Stored } from '#tests/stored-fixtures'

const SPOT = { kind: 'BURNING', latitude: -4.3769, longitude: -70.0314 } as const

test.group('storefront/reports > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('files an anonymous report and answers only the protocol', async ({ client, assert }) => {
    const photoId = await uploadReportPhoto(client)

    const response = await client
      .post('/storefront/reports')
      .json({ ...SPOT, description: 'Fumaça no terreno.', photoIds: [photoId] })

    response.assertStatus(201)
    assert.deepEqual(Object.keys(body(response)), ['protocol'])
    assert.match(body(response).protocol, PROTOCOL_PATTERN)
    const report = await Stored.reportByProtocol(body(response).protocol)
    assert.deepInclude(report?.serialize(), { status: 'RECEIVED', anonymous: true })
    assert.isNull(report?.contact)
    const events = await Stored.eventsOfReport(report?.id ?? '')
    assert.deepEqual(
      events.map((event) => [event.status, event.authorId]),
      [['RECEIVED', null]],
    )
    assert.lengthOf(await Stored.photosOfReport(report?.id ?? ''), 1)
  })

  test('with a contact the report is not anonymous, and the contact is stored', async ({
    client,
    assert,
  }) => {
    const photoId = await uploadReportPhoto(client)

    const response = await client
      .post('/storefront/reports')
      .json({ ...SPOT, contact: '(97) 99999-0000', photoIds: [photoId] })

    response.assertStatus(201)
    const report = await Stored.reportByProtocol(body(response).protocol)
    assert.equal(report?.contact, '(97) 99999-0000')
    assert.isFalse(report?.anonymous)
  })

  test('resolves the neighborhood by the nearest center', async ({ client, assert }) => {
    const near = await NeighborhoodFactory.apply('centered').create()
    await NeighborhoodFactory.merge({ latitude: -4.5, longitude: -70.3 }).create()
    const photoId = await uploadReportPhoto(client)

    const response = await client.post('/storefront/reports').json({ ...SPOT, photoIds: [photoId] })

    const report = await Stored.reportByProtocol(body(response).protocol)
    assert.equal(report?.neighborhoodId, near.id)
  })

  test('a photo that is only PENDING cannot be attached: 422 on photoIds', async ({
    client,
    assert,
  }) => {
    const opened = await client
      .post('/storefront/report-photos')
      .json({ mimetype: 'image/jpeg', size: 1024 })

    const response = await client
      .post('/storefront/reports')
      .json({ ...SPOT, photoIds: [body(opened).id] })

    response.assertStatus(422)
    assert.equal(body(response).code, 'STORAGE_NOT_FOUND')
    assert.property(body(response).errors, 'photoIds')
    assert.lengthOf(await Stored.reports(), 0)
  })

  test('one photo serves one report: reusing it responds 422', async ({ client, assert }) => {
    const photoId = await uploadReportPhoto(client)
    await client.post('/storefront/reports').json({ ...SPOT, photoIds: [photoId] })

    const response = await client.post('/storefront/reports').json({ ...SPOT, photoIds: [photoId] })

    response.assertStatus(422)
    assert.equal(body(response).code, 'REPORT_PHOTO_TAKEN')
    assert.lengthOf(await Stored.reports(), 1)
  })

  test('requires 1 to 3 photos, a valid kind and coordinates in range', async ({
    client,
    assert,
  }) => {
    const none = await client.post('/storefront/reports').json({ ...SPOT, photoIds: [] })
    const bad = await client
      .post('/storefront/reports')
      .json(invalidPayload({ kind: 'PARTY', latitude: 200, longitude: 0, photoIds: ['x'] }))

    none.assertStatus(422)
    assert.property(body(none).errors, 'photoIds')
    bad.assertStatus(422)
    assert.property(body(bad).errors, 'kind')
    assert.property(body(bad).errors, 'latitude')
  })

  test('a library file cannot be attached to a report by its uuid', async ({ client, assert }) => {
    const library = await storageRow()

    const response = await client
      .post('/storefront/reports')
      .json({ ...SPOT, photoIds: [library.id] })

    response.assertStatus(422)
    assert.property(body(response).errors, 'photoIds')
  })

  test('the rate-limit table never holds the caller IP', async ({ client, assert }) => {
    await client.post('/storefront/reports').json({ ...SPOT, photoIds: [] })

    const keys = await Stored.rateLimitKeys()
    assert.isAbove(keys.length, 0)
    for (const key of keys) {
      assert.notMatch(key, /\d+\.\d+\.\d+\.\d+|::1|ip_/)
    }
  })

  test('throttles the filing per IP: the 11th within the hour is 429', async ({ client }) => {
    let last = 0
    for (let attempt = 0; attempt < 11; attempt++) {
      const response = await client.post('/storefront/reports').json({ ...SPOT, photoIds: [] })
      last = response.status()
    }

    // The first ten reach the validator (422); the eleventh never does.
    assertTooMany(last)
  })
})

function assertTooMany(status: number): void {
  if (status !== 429) throw new Error(`expected 429 after the ceiling, got ${status}`)
}
