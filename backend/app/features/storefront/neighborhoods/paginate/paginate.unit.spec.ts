import { test } from '@japa/runner'

import StorefrontNeighborhoodPaginateUseCase from './paginate.use-case.ts'

import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedNeighborhood } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('storefront/neighborhoods > paginate (unit)', () => {
  test('returns every neighborhood by name in a single page', async ({ assert }) => {
    const neighborhoods = MemoryRepositories.neighborhoods()
    const useCase = await makeWithMemory(StorefrontNeighborhoodPaginateUseCase, [
      [NeighborhoodRepository, neighborhoods],
    ])
    await seedNeighborhood(neighborhoods, 'Cohab')
    await seedNeighborhood(neighborhoods, 'Centro')

    const result = await useCase.execute()
    const page = rightOf(result)

    assert.deepEqual(
      page.data.map((item) => item.name),
      ['Centro', 'Cohab'],
    )
    assert.equal(page.meta.lastPage, 1)
  })

  test('an empty city is an empty single page, not a division by zero', async ({ assert }) => {
    const useCase = await makeWithMemory(StorefrontNeighborhoodPaginateUseCase, [
      [NeighborhoodRepository, MemoryRepositories.neighborhoods()],
    ])

    const result = await useCase.execute()

    assert.deepEqual(rightOf(result).data, [])
  })
})
