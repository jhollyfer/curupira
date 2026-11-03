import { test } from '@japa/runner'

import ManagementNeighborhoodDeleteUseCase from './delete.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodDeleteUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > delete (unit)', () => {
  test('deletes the neighborhood', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods)

    const result = await useCase.execute({ id })

    assert.isTrue(result.isRight())
    assert.isNull(await neighborhoods.findById(id))
  })

  test('one with collection slots is 409 NEIGHBORHOOD_IN_USE and stays', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods)
    neighborhoods.markWithSchedules(id)

    const result = await useCase.execute({ id })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'NEIGHBORHOOD_IN_USE',
    })
    assert.isNotNull(await neighborhoods.findById(id))
  })

  test('nonexistent is 404 NEIGHBORHOOD_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      id: '00000000-0000-4000-8000-000000000000',
    })

    assert.deepInclude(result.value, {
      status: 404,
      code: 'NEIGHBORHOOD_NOT_FOUND',
    })
  })
})
