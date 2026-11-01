import { test } from '@japa/runner'

import ManagementNeighborhoodPaginateUseCase from './paginate.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodPaginateUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > paginate (unit)', () => {
  test('lists by name ascending, 20 per page by default', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    await seedNeighborhood(neighborhoods, 'Cohab')
    await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute({})

    assert.deepEqual(
      (result.value as { data: Array<{ name: string }> }).data.map((item) => item.name),
      ['Centro', 'Cohab'],
    )
    assert.equal((result.value as { meta: { perPage: number } }).meta.perPage, 20)
  })

  test('searches by name and reverses with direction', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    await seedNeighborhood(neighborhoods, 'Cohab')
    await seedNeighborhood(neighborhoods, 'Centro')
    await seedNeighborhood(neighborhoods, 'Colônia')

    const searched = await useCase.execute({ search: 'co' })
    const reversed = await useCase.execute({ direction: 'desc' })

    assert.equal((searched.value as { meta: { total: number } }).meta.total, 2)
    assert.equal((reversed.value as { data: Array<{ name: string }> }).data[0]?.name, 'Colônia')
  })
})
