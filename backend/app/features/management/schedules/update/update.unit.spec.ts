import { test } from '@japa/runner'

import ManagementScheduleUpdateUseCase from './update.use-case.ts'

import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood, seedSchedule } from '#tests/domain-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const schedules = MemoryRepositories.schedules()
  const useCase = await makeWithMemory(ManagementScheduleUpdateUseCase, [
    [CollectionScheduleRepository, schedules],
    [NeighborhoodRepository, neighborhoods],
  ])
  const neighborhoodId = await seedNeighborhood(neighborhoods, 'Centro')

  return { neighborhoods, schedules, useCase, neighborhoodId }
}

test.group('management/schedules > update (unit)', () => {
  test('changes the weekday and leaves the rest alone', async ({ assert }) => {
    const { schedules, useCase, neighborhoodId } = await setup()
    const id = await seedSchedule(schedules, neighborhoodId)

    const result = await useCase.execute({ id, weekday: 'FRIDAY' })

    assert.deepInclude(result.value, { weekday: 'FRIDAY', wasteType: 'ORGANIC', shift: 'MORNING' })
  })

  test('null on the note erases it', async ({ assert }) => {
    const { schedules, useCase, neighborhoodId } = await setup()
    const id = await seedSchedule(schedules, neighborhoodId, { note: 'Antiga' })

    const result = await useCase.execute({ id, note: null })

    assert.isNull((result.value as { note: string | null }).note)
  })

  test('moving onto a slot that exists is 409 SCHEDULE_ALREADY_EXISTS', async ({ assert }) => {
    const { schedules, useCase, neighborhoodId } = await setup()
    await seedSchedule(schedules, neighborhoodId, { weekday: 'FRIDAY' })
    const id = await seedSchedule(schedules, neighborhoodId, { weekday: 'MONDAY' })

    const result = await useCase.execute({ id, weekday: 'FRIDAY' })

    assert.deepInclude(result.value, { status: 409, code: 'SCHEDULE_ALREADY_EXISTS' })
  })

  test('an unknown neighborhood is 422 and a nonexistent slot is 404', async ({ assert }) => {
    const { schedules, useCase, neighborhoodId } = await setup()
    const id = await seedSchedule(schedules, neighborhoodId)

    const unknown = await useCase.execute({
      id,
      neighborhoodId: '00000000-0000-4000-8000-000000000000',
    })
    const missing = await useCase.execute({ id: '00000000-0000-4000-8000-000000000000' })

    assert.deepInclude(unknown.value, { status: 422, code: 'NEIGHBORHOOD_NOT_FOUND' })
    assert.deepInclude(missing.value, { status: 404, code: 'SCHEDULE_NOT_FOUND' })
  })
})
