import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import ManagementReportStatsUseCase from './stats.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('management/reports > stats (unit)', () => {
  test('an empty base has every key at zero and 30 days of series', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportStatsUseCase, [
      [ReportRepository, reports],
    ])

    const stats = rightOf(await useCase.execute())

    assert.equal(stats.total, 0)
    assert.deepEqual(stats.byKind, {
      BURNING: 0,
      DUMPING: 0,
      DEFORESTATION: 0,
      OTHER: 0,
    })
    assert.deepEqual(stats.byStatus, {
      RECEIVED: 0,
      IN_REVIEW: 0,
      FORWARDED: 0,
      RESOLVED: 0,
    })
    assert.lengthOf(stats.lastThirtyDays, 30)
    assert.isTrue(stats.lastThirtyDays.every((day) => day.total === 0))
  })

  test('counts by kind and status, and puts today report on the last day', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportStatsUseCase, [
      [ReportRepository, reports],
    ])
    await seedReport(reports, {
      protocol: 'CUR-2AAA-0001',
      kind: 'BURNING',
      now: new Date(),
    })
    await seedReport(reports, { protocol: 'CUR-2AAA-0002', now: new Date() })
    await seedReport(reports, {
      protocol: 'CUR-2AAA-0003',
      now: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    })

    const stats = rightOf(await useCase.execute())

    assert.equal(stats.total, 3)
    assert.equal(stats.byKind['BURNING'], 1)
    assert.equal(stats.byKind['DUMPING'], 2)
    assert.equal(stats.byStatus['RECEIVED'], 3)
    assert.equal(stats.lastThirtyDays.at(-1)?.total, 2)
    assert.equal(
      stats.lastThirtyDays.reduce((sum, day) => sum + day.total, 0),
      2,
    )
  })

  test('counts first answers within 7 days over the reports already due', async ({
    assert,
  }) => {
    const reports = MemoryRepositories.reports()
    const useCase = await makeWithMemory(ManagementReportStatsUseCase, [
      [ReportRepository, reports],
    ])
    const day = 24 * 60 * 60 * 1000
    const ago = (days: number) => new Date(Date.now() - days * day)
    const answer = async (
      protocol: string,
      created: number,
      answeredAfter: number | null,
    ) => {
      const report = await seedReport(reports, { protocol, now: ago(created) })
      if (answeredAfter === null) return
      report.advance(
        { eventId: randomUUID(), status: 'IN_REVIEW', authorId: randomUUID() },
        ago(created - answeredAfter),
      )
      await reports.save(report)
    }

    await answer('CUR-2AAA-0011', 10, 2) // in time
    await answer('CUR-2AAA-0012', 10, 9) // late
    await answer('CUR-2AAA-0013', 10, null) // overdue, never answered
    await answer('CUR-2AAA-0014', 2, null) // still inside its 7 days: not due
    await answer('CUR-2AAA-0015', 1, 0.5) // already answered in time
    await answer('CUR-2AAA-0016', 40, 1) // outside the 30-day window

    const stats = rightOf(await useCase.execute())

    assert.deepEqual(stats.responseWithinSevenDays, { answered: 2, due: 4 })
  })
})
