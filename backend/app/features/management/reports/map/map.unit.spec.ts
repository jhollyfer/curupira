import { test } from '@japa/runner'

import ManagementReportMapUseCase from './map.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'

test.group('management/reports > map (unit)', () => {
  test('returns every pin matching the cuts, with no pagination', async ({ assert }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportMapUseCase, [[ReportRepository, reports]])
    await seedReport(reports, { protocol: 'CUR-2AAA-0001', kind: 'BURNING' })
    await seedReport(reports, { protocol: 'CUR-2AAA-0002' })

    const all = await useCase.execute({})
    const burning = await useCase.execute({ kind: 'BURNING' })

    assert.lengthOf(all.value as unknown[], 2)
    assert.lengthOf(burning.value as unknown[], 1)
    assert.deepInclude((burning.value as object[])[0], { protocol: 'CUR-2AAA-0001' })
  })
})
