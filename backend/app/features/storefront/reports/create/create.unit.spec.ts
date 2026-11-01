import { test } from '@japa/runner'
import { PROTOCOL_PATTERN } from '@curupira/shared'

import StorefrontReportCreateUseCase from './create.use-case.ts'

import { REPORT_PHOTO_KEY_PREFIX } from '#core/report-photo-key'
import { Storage } from '#domain/storage/storage.entity'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { ReportRepository } from '#repositories/report/report.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UnitOfWorkMemory } from '#repositories/unit-of-work/unit-of-work.memory'
import { ProtocolContract } from '#services/protocol/protocol.contract'
import { ProtocolFake } from '#services/protocol/protocol.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedNeighborhood, seedReport } from '#tests/domain-unit-fixtures'
import { leftOf } from '#tests/result-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

const PHOTO = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'
const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const BASE = {
  kind: 'BURNING',
  latitude: -4.3769,
  longitude: -70.0314,
  photoIds: [PHOTO],
} satisfies {
  kind: 'BURNING'
  latitude: number
  longitude: number
  photoIds: string[]
}

const LIBRARY_FILE = '5b1d3a9e-7c2f-4e8a-8d6b-1f0e2c3a4b5d'

async function uploadedPhoto(storages: ReturnType<typeof MemoryRepositories.storages>) {
  const storage = Storage.open({
    id: PHOTO,
    key: `${REPORT_PHOTO_KEY_PREFIX}foto.jpg`,
    originalName: 'report-photo.jpg',
    mimetype: 'image/jpeg',
    size: 8,
    uploadId: null,
    partSize: 8,
    now: new Date(),
  })
  storage.complete({ contentLength: 8, head: JPEG_HEAD }, new Date())
  await storages.save(storage)
}

async function setup(protocols = new ProtocolFake()) {
  const reports = MemoryRepositories.reports()
  const neighborhoods = MemoryRepositories.neighborhoods()
  const storages = MemoryRepositories.storages()
  await uploadedPhoto(storages)
  const useCase = await makeWithMemory(StorefrontReportCreateUseCase, [
    [ReportRepository, reports],
    [NeighborhoodRepository, neighborhoods],
    [StorageRepository, storages],
    [ProtocolContract, protocols],
    [UnitOfWork, new UnitOfWorkMemory()],
  ])

  return { reports, neighborhoods, storages, useCase }
}

test.group('storefront/reports > create (unit)', () => {
  test('answers only the protocol, and stores a RECEIVED anonymous report', async ({ assert }) => {
    const { reports, useCase } = await setup()

    const result = await useCase.execute(BASE)

    assert.isTrue(result.isRight())
    assert.deepEqual(Object.keys(result.value), ['protocol'])
    const { protocol } = rightOf(result)
    assert.match(protocol, PROTOCOL_PATTERN)
    const stored = await reports.showByProtocol(protocol)
    assert.deepInclude(stored, { status: 'RECEIVED', kind: 'BURNING' })
    assert.lengthOf(stored?.events ?? [], 1)
  })

  test('without a contact the report is anonymous and keeps no contact', async ({ assert }) => {
    const { reports, useCase } = await setup()

    await useCase.execute(BASE)

    const [pin] = await reports.pins({})
    const detail = await reports.detail(pin?.id ?? '')
    const stored = await reports.findById(pin?.id ?? '')
    assert.isNull(detail?.contact)
    assert.isTrue(stored?.snapshot().anonymous)
  })

  test('with a contact the report is not anonymous, and the contact is stored for the panel only', async ({
    assert,
  }) => {
    const { reports, useCase } = await setup()

    const result = await useCase.execute({ ...BASE, contact: '(97) 99999-0000' })

    const [pin] = await reports.pins({})
    const detail = await reports.detail(pin?.id ?? '')
    const stored = await reports.findById(pin?.id ?? '')
    assert.equal(detail?.contact, '(97) 99999-0000')
    assert.isFalse(stored?.snapshot().anonymous)
    assert.notInclude(JSON.stringify(result.value), '99999')
  })

  test('matches the nearest neighborhood that has a center', async ({ assert }) => {
    const { reports, neighborhoods, useCase } = await setup()
    const centro = await seedNeighborhood(neighborhoods, 'Centro', {
      latitude: -4.3769,
      longitude: -70.0314,
    })
    await seedNeighborhood(neighborhoods, 'Longe', { latitude: -4.5, longitude: -70.2 })

    await useCase.execute(BASE)

    const [pin] = await reports.pins({})
    assert.equal(pin?.neighborhoodId, centro)
  })

  test('with no center near enough the report is filed under no neighborhood', async ({
    assert,
  }) => {
    const { reports, useCase } = await setup()

    await useCase.execute({ ...BASE, latitude: -3.1, longitude: -60 })

    const [pin] = await reports.pins({})
    assert.isNull(pin?.neighborhoodId)
  })

  test('a photo that does not exist or is not confirmed is 422 STORAGE_NOT_FOUND on photoIds', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      ...BASE,
      photoIds: ['00000000-0000-4000-8000-000000000000'],
    })

    assert.deepInclude(result.value, { status: 422, code: 'STORAGE_NOT_FOUND' })
    assert.property(leftOf(result).errors ?? {}, 'photoIds')
  })

  test('a file of the management library cannot be attached to a report', async ({ assert }) => {
    const { storages, useCase } = await setup()
    const library = Storage.open({
      id: LIBRARY_FILE,
      key: 'galeria.jpg',
      originalName: 'galeria.jpg',
      mimetype: 'image/jpeg',
      size: 8,
      uploadId: null,
      partSize: 8,
      now: new Date(),
    })
    library.complete({ contentLength: 8, head: JPEG_HEAD }, new Date())
    await storages.save(library)

    const result = await useCase.execute({ ...BASE, photoIds: [LIBRARY_FILE] })

    assert.deepInclude(result.value, { status: 422, code: 'STORAGE_NOT_FOUND' })
  })

  test('a photo already used by another report is 422 REPORT_PHOTO_TAKEN', async ({ assert }) => {
    const { reports, useCase } = await setup()
    await seedReport(reports, { photoIds: [PHOTO] })

    const result = await useCase.execute(BASE)

    assert.deepInclude(result.value, { status: 422, code: 'REPORT_PHOTO_TAKEN' })
  })

  test('a protocol collision draws again and succeeds', async ({ assert }) => {
    const { reports, useCase } = await setup(new ProtocolFake('2ABC3DEF', '2ABC3DEF', '4GHJ5KMN'))
    await seedReport(reports, { protocol: 'CUR-2ABC-3DEF' })

    const result = await useCase.execute({ ...BASE, photoIds: [PHOTO] })

    assert.deepEqual(result.value, { protocol: 'CUR-4GHJ-5KMN' })
  })

  test('collisions without end give up with 409 REPORT_PROTOCOL_TAKEN', async ({ assert }) => {
    const queue = Array.from({ length: 10 }, () => '2ABC3DEF')
    const { reports, useCase } = await setup(new ProtocolFake(...queue))
    await seedReport(reports, { protocol: 'CUR-2ABC-3DEF' })

    const result = await useCase.execute(BASE)

    assert.deepInclude(result.value, { status: 409, code: 'REPORT_PROTOCOL_TAKEN' })
  })
})
