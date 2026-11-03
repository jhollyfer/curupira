import { test } from '@japa/runner'

import ManagementNeighborhoodShowUseCase from './show.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodShowUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > show (unit)', () => {
  test('returns the neighborhood', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute({ id })

    assert.deepInclude(result.value, { id, name: 'Centro', slug: 'centro' })
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

  test('repository failure is 500 MANAGEMENT_NEIGHBORHOOD_SHOW_ERROR', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    neighborhoods.findById = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({
      id: '00000000-0000-4000-8000-000000000000',
    })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'MANAGEMENT_NEIGHBORHOOD_SHOW_ERROR',
    })
  })
})
