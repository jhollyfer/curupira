import { test } from '@japa/runner'

import StorefrontReportPhotoCreateUseCase from './create.use-case.ts'

import { MultipartContract } from '#services/multipart/multipart.contract'
import { MultipartFake } from '#services/multipart/multipart.fake'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { StorageContract } from '#services/storage/storage.contract'
import { StorageFake } from '#services/storage/storage.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const storages = MemoryRepositories.storages()
  const multipart = new MultipartFake()
  const useCase = await makeWithMemory(StorefrontReportPhotoCreateUseCase, [
    [StorageContract, new StorageFake()],
    [MultipartContract, multipart],
    [StorageRepository, storages],
  ])

  return { storages, multipart, useCase }
}

test.group('storefront/report-photos > create (unit)', () => {
  test('opens a PENDING single-part upload and returns the signed PUT', async ({ assert }) => {
    const { storages, useCase } = await setup()

    const result = await useCase.execute({ mimetype: 'image/jpeg', size: 2048 })

    assert.isTrue(result.isRight())
    const { id, uploadUrl } = rightOf(result)
    assert.isString(uploadUrl)
    const stored = await storages.findById(id)
    assert.deepInclude(stored?.snapshot(), {
      mimetype: 'image/jpeg',
      size: 2048,
      status: 'PENDING',
      uploadId: null,
    })
  })

  test('the object lives under the report-photo prefix, which marks where it came from', async ({
    assert,
  }) => {
    const { storages, useCase } = await setup()

    const { id } = rightOf(await useCase.execute({ mimetype: 'image/png', size: 10 }))

    const stored = await storages.findById(id)
    assert.isTrue(stored?.isReportPhoto())
  })

  test('the signed PUT is valid for 3 minutes only', async ({ assert }) => {
    const { multipart, useCase } = await setup()

    await useCase.execute({ mimetype: 'image/jpeg', size: 2048 })

    assert.deepEqual(multipart.singleExpiries, [180])
  })

  test('the stored label is generated, never a sender-chosen name', async ({ assert }) => {
    const { storages, useCase } = await setup()

    const result = await useCase.execute({ mimetype: 'image/png', size: 10 })
    const { id } = rightOf(result)

    const stored = await storages.findById(id)
    assert.equal(stored?.snapshot().originalName, 'report-photo.png')
  })

  test('storage failure is 500 STOREFRONT_REPORT_PHOTO_CREATE_ERROR', async ({ assert }) => {
    const { storages, useCase } = await setup()
    storages.save = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({ mimetype: 'image/webp', size: 10 })

    assert.deepInclude(result.value, { status: 500, code: 'STOREFRONT_REPORT_PHOTO_CREATE_ERROR' })
  })
})
