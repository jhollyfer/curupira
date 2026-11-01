import { test } from '@japa/runner'

import ManagementSchedulePaginateUseCase from './paginate.use-case.ts'

import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedSchedule } from '#tests/domain-unit-fixtures'

test.group('management/schedules > paginate (unit)', () => {
  test('lists the slots and cuts by neighborhood', async ({ assert }) => {
    const schedules = MemoryRepositories.schedules()
    const useCase = await makeWithMemory(ManagementSchedulePaginateUseCase, [
      [CollectionScheduleRepository, schedules],
    ])
    await seedSchedule(schedules, 'n1')
    await seedSchedule(schedules, 'n1', { weekday: 'FRIDAY' })
    await seedSchedule(schedules, 'n2')

    const all = await useCase.execute({})
    const one = await useCase.execute({ neighborhoodId: 'n2' })

    assert.equal((all.value as { meta: { total: number } }).meta.total, 3)
    assert.equal((one.value as { meta: { total: number } }).meta.total, 1)
  })
})
