import { test } from '@japa/runner'

import ManagementNeighborhoodCreateUseCase from './create.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodCreateUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > create (unit)', () => {
  test('registers with the slug from the name and no center', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ name: 'Porto Cajuí' })

    assert.isTrue(result.isRight())
    assert.deepInclude(result.value, {
      name: 'Porto Cajuí',
      slug: 'porto-cajui',
      latitude: null,
      longitude: null,
    })
  })

  test('keeps the center when both coordinates come', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ name: 'Centro', latitude: -4.37, longitude: -70.03 })

    assert.deepInclude(result.value, { latitude: -4.37, longitude: -70.03 })
  })

  test('one coordinate without the other is 422 NEIGHBORHOOD_CENTER_INCOMPLETE', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ name: 'Centro', latitude: -4.37 })

    assert.deepInclude(result.value, { status: 422, code: 'NEIGHBORHOOD_CENTER_INCOMPLETE' })
  })

  test('repeated name or slug is 409 NEIGHBORHOOD_ALREADY_EXISTS', async ({ assert }) => {
    const { useCase } = await setup()
    await useCase.execute({ name: 'Centro' })

    const result = await useCase.execute({ name: 'CENTRO' })

    assert.deepInclude(result.value, { status: 409, code: 'NEIGHBORHOOD_ALREADY_EXISTS' })
  })

  test('repository failure is 500 MANAGEMENT_NEIGHBORHOOD_CREATE_ERROR', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    neighborhoods.save = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({ name: 'Centro' })

    assert.deepInclude(result.value, { status: 500, code: 'MANAGEMENT_NEIGHBORHOOD_CREATE_ERROR' })
  })
})
