import { test } from '@japa/runner'

import ManagementScheduleCreateUseCase from './create.use-case.ts'

import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'
import { leftOf } from '#tests/result-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const schedules = MemoryRepositories.schedules()
  const useCase = await makeWithMemory(ManagementScheduleCreateUseCase, [
    [CollectionScheduleRepository, schedules],
    [NeighborhoodRepository, neighborhoods],
  ])
  const neighborhoodId = await seedNeighborhood(neighborhoods, 'Centro')
  schedules.withNeighborhood(neighborhoodId, 'Centro')

  return { schedules, useCase, neighborhoodId }
}

const SLOT = { wasteType: 'ORGANIC', weekday: 'MONDAY', shift: 'MORNING' } as const

test.group('management/schedules > create (unit)', () => {
  test('registers the slot with the neighborhood name', async ({ assert }) => {
    const { useCase, neighborhoodId } = await setup()

    const result = await useCase.execute({ neighborhoodId, ...SLOT, note: 'Até as 9h' })

    assert.isTrue(result.isRight())
    assert.deepInclude(result.value, { neighborhoodName: 'Centro', note: 'Até as 9h', ...SLOT })
  })

  test('an unknown neighborhood is 422 NEIGHBORHOOD_NOT_FOUND pointing at the field', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      neighborhoodId: '00000000-0000-4000-8000-000000000000',
      ...SLOT,
    })

    assert.deepInclude(result.value, { status: 422, code: 'NEIGHBORHOOD_NOT_FOUND' })
    assert.property(leftOf(result).errors ?? {}, 'neighborhoodId')
  })

  test('the same neighborhood, type, weekday and shift is 409 SCHEDULE_ALREADY_EXISTS', async ({
    assert,
  }) => {
    const { useCase, neighborhoodId } = await setup()
    await useCase.execute({ neighborhoodId, ...SLOT })

    const result = await useCase.execute({ neighborhoodId, ...SLOT })

    assert.deepInclude(result.value, { status: 409, code: 'SCHEDULE_ALREADY_EXISTS' })
  })

  test('another shift of the same type and day is a different slot', async ({ assert }) => {
    const { useCase, neighborhoodId } = await setup()
    await useCase.execute({ neighborhoodId, ...SLOT })

    const result = await useCase.execute({ neighborhoodId, ...SLOT, shift: 'NIGHT' })

    assert.isTrue(result.isRight())
  })
})
