import { test } from '@japa/runner'
import sharp from 'sharp'
import drive from '@adonisjs/drive/services/main'

import { body, resetDatabase } from '#tests/http-fixtures'
import {
  jpegWithGps,
  openReportPhoto,
  uploadReportPhoto,
} from '#tests/report-photo-fixtures'
import { storageRow } from '#tests/storages-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('storefront/report-photos > complete', (group) => {
  group.each.setup(() => resetDatabase())

  test('strips the EXIF/GPS from the stored object and confirms the photo', async ({
    client,
    assert,
  }) => {
    const original = await jpegWithGps()
    const before = await sharp(original).metadata()
    assert.isDefined(before.exif, 'arrangement: the sent photo carries EXIF')

    const id = await uploadReportPhoto(client, original)

    const stored = await Stored.storageOrFail(id)
    assert.equal(stored.status, 'UPLOADED')
    const object = await drive.use().getBytes(stored.path)
    const after = await sharp(object).metadata()
    assert.isUndefined(after.exif)
    assert.notInclude(Buffer.from(object).toString('latin1'), 'Acme Phone')
    assert.equal(after.format, 'jpeg')
  })

  test('confirming twice is safe and does not touch the object again', async ({
    client,
    assert,
  }) => {
    const id = await uploadReportPhoto(client)
    const stored = await Stored.storageOrFail(id)
    const first = await drive.use().getBytes(stored.path)

    const again = await client.post(`/storefront/report-photos/${id}/complete`)

    again.assertStatus(204)
    assert.deepEqual(await drive.use().getBytes(stored.path), first)
  })

  test('bytes that only start like a JPEG are refused with 422 and the file is discarded', async ({
    client,
    assert,
  }) => {
    const liar = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0xe0,
      ...new Array<number>(60).fill(7),
    ])
    const opened = await openReportPhoto(client, liar.byteLength)
    await fetch(opened.uploadUrl, {
      method: 'PUT',
      body: liar,
      headers: { 'Content-Type': 'image/jpeg' },
    })

    const response = await client.post(
      `/storefront/report-photos/${opened.id}/complete`,
    )

    response.assertStatus(422)
    assert.equal(body(response).code, 'REPORT_PHOTO_INVALID')
    assert.isNull(await Stored.storage(opened.id))
  })

  test('a PNG sent as image/jpeg is refused by the signature check', async ({
    client,
    assert,
  }) => {
    const png = new Uint8Array(
      await sharp({
        create: { width: 8, height: 8, channels: 3, background: '#fff' },
      })
        .png()
        .toBuffer(),
    )
    const opened = await openReportPhoto(client, png.byteLength)
    await fetch(opened.uploadUrl, {
      method: 'PUT',
      body: png,
      headers: { 'Content-Type': 'image/jpeg' },
    })

    const response = await client.post(
      `/storefront/report-photos/${opened.id}/complete`,
    )

    response.assertStatus(422)
    assert.equal(body(response).code, 'STORAGE_CONTENT_MISMATCH')
  })

  test('a library file is 404: an anonymous caller cannot re-encode it by knowing its uuid', async ({
    client,
    assert,
  }) => {
    const library = await storageRow({
      status: 'PENDING',
      mimetype: 'image/jpeg',
    })

    const response = await client.post(
      `/storefront/report-photos/${library.id}/complete`,
    )

    response.assertStatus(404)
    const kept = await Stored.storageOrFail(library.id)
    assert.equal(kept.status, 'PENDING')
  })

  test('an unknown id and a malformed id are refused', async ({
    client,
    assert,
  }) => {
    const unknown = await client
      .post(
        '/storefront/report-photos/00000000-0000-4000-8000-000000000000/complete',
      )
      .json({})
    const malformed = await client.post(
      '/storefront/report-photos/xyz/complete',
    )

    unknown.assertStatus(404)
    assert.equal(body(unknown).code, 'REPORT_PHOTO_NOT_FOUND')
    malformed.assertStatus(422)
  })
})
