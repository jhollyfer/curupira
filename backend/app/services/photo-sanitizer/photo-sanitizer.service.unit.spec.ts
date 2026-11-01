import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import sharp from 'sharp'

import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'

/**
 * The real library on purpose: a double would prove only that the use case calls the
 * contract, and the whole point of this service is that the EXIF/GPS is gone from the bytes.
 * `sharp` is imported here (a spec, not production code) to build and inspect the images.
 */
async function sanitizer(): Promise<PhotoSanitizerContract> {
  return app.container.make(PhotoSanitizerContract)
}

/** A 32x32 image carrying a GPS position and a camera make in its EXIF. */
async function photoWithGps(format: 'jpeg' | 'png' | 'webp'): Promise<Uint8Array> {
  const base = sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 10, g: 120, b: 60 } },
  }).withExif({
    IFD0: { Make: 'Acme Phone' },
    IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '4/1 22/1 36/1', GPSLongitude: '70/1 1/1 53/1' },
  })

  return new Uint8Array(await base.toFormat(format).toBuffer())
}

test.group('services > photo sanitizer (unit)', () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    test(`${format}: the position and the device leave the file, the picture stays`, async ({
      assert,
    }) => {
      const service = await sanitizer()
      const original = await photoWithGps(format)
      const before = await sharp(original).metadata()
      assert.isDefined(before.exif, 'arrangement: EXIF must exist')

      const clean = await service.strip(`image/${format}`, original)

      assert.isNotNull(clean)
      const metadata = await sharp(clean ?? new Uint8Array()).metadata()
      assert.isUndefined(metadata.exif)
      assert.equal(metadata.format, format)
      assert.equal(metadata.width, 32)
      assert.notInclude(Buffer.from(clean ?? new Uint8Array()).toString('latin1'), 'Acme Phone')
    })
  }

  test('a 48 MP phone photo (8000x6000) still passes', async ({ assert }) => {
    const service = await sanitizer()
    const flat = sharp({
      create: { width: 8000, height: 6000, channels: 3, background: { r: 10, g: 120, b: 60 } },
    })
    const original = new Uint8Array(await flat.jpeg({ quality: 40 }).toBuffer())

    const clean = await service.strip('image/jpeg', original)

    assert.isNotNull(clean)
  }).timeout(20_000)

  test('a canvas above 50 MP is refused with null (decompression bomb)', async ({ assert }) => {
    const service = await sanitizer()
    const flat = sharp({
      create: { width: 9000, height: 6000, channels: 3, background: { r: 10, g: 120, b: 60 } },
    })
    const original = new Uint8Array(await flat.jpeg({ quality: 40 }).toBuffer())

    assert.isNull(await service.strip('image/jpeg', original))
  }).timeout(20_000)

  test('several photos at once all come out clean (the gate queues, it does not drop)', async ({
    assert,
  }) => {
    const service = await sanitizer()
    const original = await photoWithGps('jpeg')

    const results = await Promise.all(
      Array.from({ length: 6 }, () => service.strip('image/jpeg', original)),
    )

    assert.isTrue(results.every((clean) => clean !== null))
  })

  test('bytes that only start like an image are refused with null', async ({ assert }) => {
    const service = await sanitizer()
    const liar = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8])

    assert.isNull(await service.strip('image/jpeg', liar))
  })

  test('a type without an encoder is refused with null', async ({ assert }) => {
    const service = await sanitizer()

    assert.isNull(await service.strip('image/gif', await photoWithGps('png')))
  })
})
