import { test } from '@japa/runner'

import StorefrontReportMapUseCase from './map.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('storefront/reports > map (unit)', () => {
  test('only looked-at reports show, as kind, status, coordinates and the day', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(StorefrontReportMapUseCase, [[ReportRepository, reports]])
    await seedReport(reports, { protocol: 'CUR-2AAA-0001' })
    const reviewed = await seedReport(reports, {
      protocol: 'CUR-2AAA-0002',
      contact: '(97) 99999-0000',
      description: 'texto privado',
      now: new Date('2026-10-29T23:30:00-04:00'),
    })
    reviewed.advance({ eventId: 'e2', status: 'IN_REVIEW', authorId: 'u1' }, new Date())
    await reports.save(reviewed)

    const result = await useCase.execute()
    const pins = rightOf(result)

    assert.lengthOf(pins, 1)
    assert.deepEqual(Object.keys(pins[0] ?? {}).sort(), [
      'day',
      'id',
      'kind',
      'latitude',
      'longitude',
      'status',
    ])
    assert.equal(pins[0]?.day, '2026-10-29')
  })

  test('the coordinates leave rounded to 3 decimals (about 110 m)', async ({ assert }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(StorefrontReportMapUseCase, [[ReportRepository, reports]])
    const report = await seedReport(reports, { latitude: -4.376941, longitude: -70.031467 })
    report.advance({ eventId: 'e2', status: 'IN_REVIEW', authorId: 'u1' }, new Date())
    await reports.save(report)

    const pins = rightOf(await useCase.execute())

    assert.equal(pins[0]?.latitude, -4.377)
    assert.equal(pins[0]?.longitude, -70.031)
  })
})
