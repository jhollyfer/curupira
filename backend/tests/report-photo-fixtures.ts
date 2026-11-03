import type { ApiClient } from '@japa/api-client'
import sharp from 'sharp'

import { body } from '#tests/http-fixtures'

/** A small JPEG that carries a GPS position and a camera make in its EXIF. */
export async function jpegWithGps(): Promise<Uint8Array> {
  const image = sharp({
    create: {
      width: 32,
      height: 32,
      channels: 3,
      background: { r: 10, g: 120, b: 60 },
    },
  }).withExif({
    IFD0: { Make: 'Acme Phone' },
    IFD3: {
      GPSLatitudeRef: 'S',
      GPSLatitude: '4/1 22/1 36/1',
      GPSLongitude: '70/1 1/1 53/1',
    },
  })

  return new Uint8Array(await image.jpeg().toBuffer())
}

/** The first step of the public flow: opens the upload and returns the id and the signed `PUT`. */
export async function openReportPhoto(client: ApiClient, size: number) {
  const response = await client
    .post('/storefront/report-photos')
    .json({ mimetype: 'image/jpeg', size })

  response.assertStatus(201)

  return {
    id: String(body(response).id),
    uploadUrl: String(body(response).uploadUrl),
  }
}

/** The whole public flow, from zero to a confirmed (sanitized) photo. Returns its id. */
export async function uploadReportPhoto(
  client: ApiClient,
  bytes?: Uint8Array,
): Promise<string> {
  const content = bytes ?? (await jpegWithGps())
  const opened = await openReportPhoto(client, content.byteLength)

  const put = await fetch(opened.uploadUrl, {
    method: 'PUT',
    body: content,
    headers: { 'Content-Type': 'image/jpeg' },
  })
  if (!put.ok) throw new Error(`PUT respondeu ${put.status}`)

  const completed = await client.post(
    `/storefront/report-photos/${opened.id}/complete`,
  )
  completed.assertStatus(204)

  return opened.id
}
