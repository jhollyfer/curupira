import { test } from '@japa/runner'

import ManagementScheduleDeleteUseCase from './delete.use-case.ts'

import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedSchedule } from '#tests/domain-unit-fixtures'

async function setup() {
  const schedules = MemoryRepositories.schedules()
  const useCase = await makeWithMemory(ManagementScheduleDeleteUseCase, [
    [CollectionScheduleRepository, schedules],
  ])

  return { schedules, useCase }
}

test.group('management/schedules > delete (unit)', () => {
  test('deletes the slot', async ({ assert }) => {
    const { schedules, useCase } = await setup()
    const id = await seedSchedule(schedules, 'n1')

    const result = await useCase.execute({ id })

    assert.isTrue(result.isRight())
    assert.isNull(await schedules.findById(id))
  })

  test('nonexistent is 404 SCHEDULE_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    assert.deepInclude(result.value, { status: 404, code: 'SCHEDULE_NOT_FOUND' })
  })
})
