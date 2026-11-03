import { test } from '@japa/runner'

import ManagementNeighborhoodUpdateUseCase from './update.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodUpdateUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > update (unit)', () => {
  test('renames and re-derives the slug', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute({ id, name: 'Centro Velho' })

    assert.deepInclude(result.value, {
      name: 'Centro Velho',
      slug: 'centro-velho',
    })
  })

  test('a missing field leaves alone and null on both coordinates erases the center', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods, 'Centro', {
      latitude: -4.3,
      longitude: -70,
    })

    const kept = await useCase.execute({ id, name: 'Centro' })
    const erased = await useCase.execute({
      id,
      latitude: null,
      longitude: null,
    })

    assert.deepInclude(kept.value, { latitude: -4.3, longitude: -70 })
    assert.deepInclude(erased.value, { latitude: null, longitude: null })
  })

  test('erasing only one coordinate is 422 NEIGHBORHOOD_CENTER_INCOMPLETE', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    const id = await seedNeighborhood(neighborhoods, 'Centro', {
      latitude: -4.3,
      longitude: -70,
    })

    const result = await useCase.execute({ id, latitude: null })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'NEIGHBORHOOD_CENTER_INCOMPLETE',
    })
  })

  test('the name of another neighborhood is 409 NEIGHBORHOOD_ALREADY_EXISTS', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    await seedNeighborhood(neighborhoods, 'Cohab')
    const id = await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute({ id, name: 'Cohab' })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'NEIGHBORHOOD_ALREADY_EXISTS',
    })
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
