import { test } from '@japa/runner'

import StorefrontSchedulePaginateUseCase from './paginate.use-case.ts'

import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedSchedule } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('storefront/schedules > paginate (unit)', () => {
  test('returns the whole week in week order (Sunday first), then by shift', async ({ assert }) => {
    const schedules = MemoryRepositories.schedules()
    const useCase = await makeWithMemory(StorefrontSchedulePaginateUseCase, [
      [CollectionScheduleRepository, schedules],
    ])
    await seedSchedule(schedules, 'n1', { weekday: 'FRIDAY', shift: 'MORNING' })
    await seedSchedule(schedules, 'n1', { weekday: 'MONDAY', shift: 'NIGHT' })
    await seedSchedule(schedules, 'n1', { weekday: 'MONDAY', shift: 'MORNING' })

    const result = await useCase.execute({})
    const { data } = rightOf(result)

    assert.deepEqual(
      data.map((item) => `${item.weekday}/${item.shift}`),
      ['MONDAY/MORNING', 'MONDAY/NIGHT', 'FRIDAY/MORNING'],
    )
  })

  test('cuts to one neighborhood and never carries the management fields', async ({ assert }) => {
    const schedules = MemoryRepositories.schedules()
    const useCase = await makeWithMemory(StorefrontSchedulePaginateUseCase, [
      [CollectionScheduleRepository, schedules],
    ])
    await seedSchedule(schedules, 'n1')
    await seedSchedule(schedules, 'n2')

    const result = await useCase.execute({ neighborhoodId: 'n2' })
    const { data } = rightOf(result)

    assert.lengthOf(data, 1)
    assert.notProperty(data[0], 'createdAt')
  })
})
