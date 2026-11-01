import { test } from '@japa/runner'

import StorefrontReportPhotoCompleteUseCase from './complete.use-case.ts'

import { REPORT_PHOTO_KEY_PREFIX } from '#core/report-photo-key'
import { Storage } from '#domain/storage/storage.entity'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'
import { PhotoSanitizerFake } from '#services/photo-sanitizer/photo-sanitizer.fake'
import { StorageContract } from '#services/storage/storage.contract'
import { StorageFake } from '#services/storage/storage.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'

const KEY = `${REPORT_PHOTO_KEY_PREFIX}foto.jpg`
const ID = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'
const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const ORIGINAL = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])

function pending(mimetype = 'image/jpeg', size = ORIGINAL.length, key = KEY): Storage {
  return Storage.open({
    id: ID,
    key,
    originalName: 'report-photo.jpg',
    mimetype,
    size,
    uploadId: null,
    partSize: size,
    now: new Date('2026-10-29T12:00:00Z'),
  })
}

async function setup(storage: Storage = pending()) {
  const storages = MemoryRepositories.storages()
  await storages.save(storage)
  const bucket = new StorageFake()
    .put(KEY, { contentLength: ORIGINAL.length }, JPEG_HEAD)
    .putBody(KEY, ORIGINAL)
  const sanitizer = new PhotoSanitizerFake()
  const useCase = await makeWithMemory(StorefrontReportPhotoCompleteUseCase, [
    [StorageRepository, storages],
    [StorageContract, bucket],
    [PhotoSanitizerContract, sanitizer],
  ])

  return { storages, bucket, sanitizer, useCase }
}

test.group('storefront/report-photos > complete (unit)', () => {
  test('replaces the object with the sanitized bytes BEFORE marking it UPLOADED', async ({
    assert,
  }) => {
    const { storages, bucket, sanitizer, useCase } = await setup()

    const result = await useCase.execute({ id: ID })

    assert.isTrue(result.isRight())
    assert.deepEqual(sanitizer.received[0]?.bytes, ORIGINAL)
    assert.deepEqual(
      bucket.overwritten.get(KEY),
      new Uint8Array([...PhotoSanitizerFake.MARKER, ...ORIGINAL]),
    )
    const stored = await storages.findById(ID)
    assert.equal(stored?.snapshot().status, 'UPLOADED')
  })

  test('a photo that fails the sanitizer is discarded, never attachable, and is 422', async ({
    assert,
  }) => {
    const { storages, bucket, sanitizer, useCase } = await setup()
    sanitizer.refuse()

    const result = await useCase.execute({ id: ID })

    assert.deepInclude(result.value, { status: 422, code: 'REPORT_PHOTO_INVALID' })
    assert.deepEqual(bucket.discarded, [KEY])
    assert.isNull(await storages.findById(ID))
    assert.isFalse(await storages.areAttachable([ID]))
  })

  test('a size different from the declared one is 422 STORAGE_SIZE_MISMATCH and discarded', async ({
    assert,
  }) => {
    const { storages, bucket, useCase } = await setup(pending('image/jpeg', 999))

    const result = await useCase.execute({ id: ID })

    assert.deepInclude(result.value, { status: 422, code: 'STORAGE_SIZE_MISMATCH' })
    assert.deepEqual(bucket.discarded, [KEY])
    assert.isNull(await storages.findById(ID))
  })

  test('content that is not the declared image is 422 STORAGE_CONTENT_MISMATCH', async ({
    assert,
  }) => {
    const storages = MemoryRepositories.storages()
    await storages.save(pending())
    const bucket = new StorageFake().put(
      KEY,
      { contentLength: ORIGINAL.length },
      new Uint8Array(12),
    )
    const useCase = await makeWithMemory(StorefrontReportPhotoCompleteUseCase, [
      [StorageRepository, storages],
      [StorageContract, bucket],
      [PhotoSanitizerContract, new PhotoSanitizerFake()],
    ])

    const result = await useCase.execute({ id: ID })

    assert.deepInclude(result.value, { status: 422, code: 'STORAGE_CONTENT_MISMATCH' })
  })

  test('an already confirmed file is left exactly as it is (idempotent, no re-encoding)', async ({
    assert,
  }) => {
    const done = pending()
    done.complete({ contentLength: ORIGINAL.length, head: JPEG_HEAD }, new Date())
    const { bucket, sanitizer, useCase } = await setup(done)

    const result = await useCase.execute({ id: ID })

    assert.isTrue(result.isRight())
    assert.lengthOf(sanitizer.received, 0)
    assert.equal(bucket.overwritten.size, 0)
  })

  test('a pending file that is not a report photo type answers 404 and is not touched', async ({
    assert,
  }) => {
    const { storages, sanitizer, useCase } = await setup(pending('application/pdf'))

    const result = await useCase.execute({ id: ID })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_PHOTO_NOT_FOUND' })
    assert.lengthOf(sanitizer.received, 0)
    assert.isNotNull(await storages.findById(ID))
  })

  test('a file of the management library is 404 and is neither re-encoded nor confirmed', async ({
    assert,
  }) => {
    // Same uuid trick as before the marker: a library file whose uuid leaked must not be
    // overwritten, nor confirmed, by an anonymous caller.
    const library = pending('image/jpeg', ORIGINAL.length, 'galeria.jpg')
    const { storages, bucket, sanitizer, useCase } = await setup(library)

    const result = await useCase.execute({ id: ID })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_PHOTO_NOT_FOUND' })
    assert.lengthOf(sanitizer.received, 0)
    assert.equal(bucket.overwritten.size, 0)
    assert.equal((await storages.findById(ID))?.snapshot().status, 'PENDING')
  })

  test('an unknown id is 404 REPORT_PHOTO_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_PHOTO_NOT_FOUND' })
  })
})
