import { test } from '@japa/runner'

import ManagementReportDeleteUseCase from './delete.use-case.ts'

import { Storage } from '#domain/storage/storage.entity'
import { ReportRepository } from '#repositories/report/report.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { StorageContract } from '#services/storage/storage.contract'
import { StorageFake } from '#services/storage/storage.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'

const PHOTO = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'

async function setup() {
  const reports = MemoryRepositories.reports()
  const storages = MemoryRepositories.storages()
  const bucket = new StorageFake()
  const useCase = await makeWithMemory(ManagementReportDeleteUseCase, [
    [ReportRepository, reports],
    [StorageRepository, storages],
    [StorageContract, bucket],
  ])

  return { reports, storages, bucket, useCase }
}

test.group('management/reports > delete (unit)', () => {
  test('deletes the report and then the photo, binary and row', async ({ assert }) => {
    const { reports, storages, bucket, useCase } = await setup()
    await storages.save(
      Storage.open({
        id: PHOTO,
        key: 'foto.jpg',
        originalName: 'foto.jpg',
        mimetype: 'image/jpeg',
        size: 10,
        uploadId: null,
        partSize: 10,
        now: new Date(),
      }),
    )
    const { id } = (await seedReport(reports, { photoIds: [PHOTO] })).snapshot()

    const result = await useCase.execute({ id })

    assert.isTrue(result.isRight())
    assert.isNull(await reports.findById(id))
    assert.isNull(await storages.findById(PHOTO))
    assert.deepEqual(bucket.discarded, ['foto.jpg'])
  })

  test('nonexistent is 404 REPORT_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_NOT_FOUND' })
  })
})
