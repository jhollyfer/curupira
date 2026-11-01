import { test } from '@japa/runner'

import ManagementReportMapUseCase from './map.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('management/reports > map (unit)', () => {
  test('returns every pin matching the cuts, with no pagination', async ({ assert }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportMapUseCase, [[ReportRepository, reports]])
    await seedReport(reports, { protocol: 'CUR-2AAA-0001', kind: 'BURNING' })
    await seedReport(reports, { protocol: 'CUR-2AAA-0002' })

    const all = await useCase.execute({})
    const burning = await useCase.execute({ kind: 'BURNING' })

    assert.lengthOf(rightOf(all), 2)
    assert.lengthOf(rightOf(burning), 1)
    assert.deepInclude(rightOf(burning)[0], { protocol: 'CUR-2AAA-0001' })
  })

  test('keeps the exact coordinates: the crew needs the spot, unlike the public map', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportMapUseCase, [[ReportRepository, reports]])
    await seedReport(reports, { latitude: -4.376941, longitude: -70.031467 })

    const pins = rightOf(await useCase.execute({}))

    assert.equal(pins[0]?.latitude, -4.376941)
    assert.equal(pins[0]?.longitude, -70.031467)
  })
})
