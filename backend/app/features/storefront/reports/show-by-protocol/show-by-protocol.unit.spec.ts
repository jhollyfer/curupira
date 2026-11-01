import { test } from '@japa/runner'

import StorefrontReportShowByProtocolUseCase from './show-by-protocol.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const reports = MemoryRepositories.reports()
  const useCase = await makeWithMemory(StorefrontReportShowByProtocolUseCase, [
    [ReportRepository, reports],
  ])

  return { reports, useCase }
}

test.group('storefront/reports > show-by-protocol (unit)', () => {
  test('returns only protocol, kind, status, date and the timeline', async ({ assert }) => {
    const { reports, useCase } = await setup()
    await seedReport(reports, {
      contact: '(97) 99999-0000',
      description: 'texto privado',
      photoIds: ['p1'],
      neighborhoodId: 'n1',
    })

    const result = await useCase.execute({ protocol: 'CUR-2ABC-3DEF' })

    assert.deepEqual(Object.keys(result.value).sort(), [
      'createdAt',
      'events',
      'kind',
      'protocol',
      'status',
    ])
    assert.deepEqual(Object.keys(rightOf(result).events[0] ?? {}).sort(), [
      'at',
      'message',
      'status',
    ])
    assert.notInclude(JSON.stringify(result.value), '99999')
    assert.notInclude(JSON.stringify(result.value), 'privado')
  })

  test('an unknown protocol and a malformed one answer the same 404', async ({ assert }) => {
    const { useCase } = await setup()

    const unknown = await useCase.execute({ protocol: 'CUR-ZZZZ-ZZZZ' })
    const malformed = await useCase.execute({ protocol: 'banana' })

    assert.deepInclude(unknown.value, { status: 404, code: 'REPORT_NOT_FOUND' })
    assert.deepEqual(malformed.value, unknown.value)
  })
})
