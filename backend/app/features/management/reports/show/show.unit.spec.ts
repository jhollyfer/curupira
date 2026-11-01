import { test } from '@japa/runner'

import ManagementReportShowUseCase from './show.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const reports = MemoryRepositories.reports()
  const useCase = await makeWithMemory(ManagementReportShowUseCase, [[ReportRepository, reports]])

  return { reports, useCase }
}

test.group('management/reports > show (unit)', () => {
  test('returns the contact, the description and the photos with a signed url', async ({
    assert,
  }) => {
    const { reports, useCase } = await setup()
    const seeded = await seedReport(reports, {
      contact: '(97) 99999-0000',
      description: 'Entulho na calçada',
      photoIds: ['p1'],
    })
    const { id } = seeded.snapshot()

    const result = await useCase.execute({ id })

    assert.deepInclude(result.value, {
      contact: '(97) 99999-0000',
      description: 'Entulho na calçada',
    })
    const { photos } = rightOf(result)
    assert.equal(photos[0]?.id, 'p1')
    assert.include(photos[0]?.url ?? '', '?signed')
  })

  test('nonexistent is 404 REPORT_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_NOT_FOUND' })
  })
})
