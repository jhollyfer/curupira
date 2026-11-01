import { test } from '@japa/runner'

import ManagementReportUpdateStatusUseCase from './update-status.use-case.ts'

import { ReportRepository } from '#repositories/report/report.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UnitOfWorkMemory } from '#repositories/unit-of-work/unit-of-work.memory'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedReport } from '#tests/domain-unit-fixtures'

const ACTOR = {
  id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  role: 'OPERATOR',
  avatarId: null,
} as const

async function setup() {
  const reports = MemoryRepositories.reports().withAuthor(ACTOR.id, 'Ana')
  const useCase = await makeWithMemory(ManagementReportUpdateStatusUseCase, [
    [ReportRepository, reports],
    [UnitOfWork, new UnitOfWorkMemory()],
  ])

  return { reports, useCase }
}

test.group('management/reports > update-status (unit)', () => {
  test('advances, records who did it and what they said', async ({ assert }) => {
    const { reports, useCase } = await setup()
    const { id } = (await seedReport(reports)).snapshot()

    const result = await useCase.execute({
      id,
      status: 'IN_REVIEW',
      message: 'Equipe a caminho',
      actor: ACTOR,
    })

    assert.isTrue(result.isRight())
    assert.equal((result.value as { events: unknown[] }).events.length, 2)
    assert.deepInclude((result.value as { events: object[] }).events.at(-1), {
      status: 'IN_REVIEW',
      message: 'Equipe a caminho',
      authorName: 'Ana',
    })
    assert.equal((await reports.findById(id))?.snapshot().status, 'IN_REVIEW')
  })

  test('going back is 422 REPORT_STATUS_REGRESSION and writes nothing', async ({ assert }) => {
    const { reports, useCase } = await setup()
    const { id } = (await seedReport(reports)).snapshot()
    await useCase.execute({ id, status: 'FORWARDED', actor: ACTOR })

    const result = await useCase.execute({ id, status: 'IN_REVIEW', actor: ACTOR })

    assert.deepInclude(result.value, { status: 422, code: 'REPORT_STATUS_REGRESSION' })
    assert.lengthOf((await reports.findById(id))?.snapshot().events ?? [], 2)
  })

  test('nonexistent is 404 REPORT_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      id: '00000000-0000-4000-8000-000000000000',
      status: 'IN_REVIEW',
      actor: ACTOR,
    })

    assert.deepInclude(result.value, { status: 404, code: 'REPORT_NOT_FOUND' })
  })
})
