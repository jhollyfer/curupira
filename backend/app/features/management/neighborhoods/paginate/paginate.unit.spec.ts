import { test } from '@japa/runner'

import ManagementNeighborhoodPaginateUseCase from './paginate.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const neighborhoods = MemoryRepositories.neighborhoods()
  const useCase = await makeWithMemory(ManagementNeighborhoodPaginateUseCase, [
    [NeighborhoodRepository, neighborhoods],
  ])

  return { neighborhoods, useCase }
}

test.group('management/neighborhoods > paginate (unit)', () => {
  test('lists by name ascending, 20 per page by default', async ({
    assert,
  }) => {
    const { neighborhoods, useCase } = await setup()
    await seedNeighborhood(neighborhoods, 'Cohab')
    await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute({})

    assert.deepEqual(
      rightOf(result).data.map((item) => item.name),
      ['Centro', 'Cohab'],
    )
    assert.equal(rightOf(result).meta.perPage, 20)
  })

  test('searches by name and reverses with direction', async ({ assert }) => {
    const { neighborhoods, useCase } = await setup()
    await seedNeighborhood(neighborhoods, 'Cohab')
    await seedNeighborhood(neighborhoods, 'Centro')
    await seedNeighborhood(neighborhoods, 'Colônia')

    const searched = await useCase.execute({ search: 'co' })
    const reversed = await useCase.execute({ direction: 'desc' })

    assert.equal(rightOf(searched).meta.total, 2)
    assert.equal(rightOf(reversed).data[0]?.name, 'Colônia')
  })
})
