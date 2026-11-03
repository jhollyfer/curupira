import { test } from '@japa/runner'

import ManagementReportPaginateUseCase from './paginate.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('management/reports > paginate (unit)', () => {
  test('lists the most recent first and cuts by kind, status and date', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportPaginateUseCase, [
      [ReportRepository, reports],
    ])
    await seedReport(reports, {
      protocol: 'CUR-2AAA-0001',
      now: new Date('2026-10-01T12:00:00Z'),
    })
    await seedReport(reports, {
      protocol: 'CUR-2AAA-0002',
      kind: 'BURNING',
      now: new Date('2026-10-20T12:00:00Z'),
    })

    const protocols = async (
      payload: Parameters<typeof useCase.execute>[0],
    ) => {
      const result = await useCase.execute(payload)

      return rightOf(result).data.map((item) => item.protocol)
    }

    assert.deepEqual(await protocols({}), ['CUR-2AAA-0002', 'CUR-2AAA-0001'])
    assert.deepEqual(await protocols({ kind: 'BURNING' }), ['CUR-2AAA-0002'])
    assert.deepEqual(await protocols({ status: 'RESOLVED' }), [])
    assert.deepEqual(await protocols({ from: '2026-10-10T00:00:00Z' }), [
      'CUR-2AAA-0002',
    ])
    assert.deepEqual(await protocols({ search: '0001' }), ['CUR-2AAA-0001'])
  })

  test('the list items never carry the contact or the description', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportPaginateUseCase, [
      [ReportRepository, reports],
    ])
    await seedReport(reports, {
      contact: '(97) 99999-0000',
      description: 'texto',
    })

    const result = await useCase.execute({})
    const item = rightOf(result).data[0]

    assert.notProperty(item, 'contact')
    assert.notProperty(item, 'description')
  })
})
