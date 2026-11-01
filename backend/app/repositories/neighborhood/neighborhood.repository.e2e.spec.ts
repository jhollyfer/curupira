import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'

import { NeighborhoodLucidRepository } from './neighborhood.lucid.repository.ts'
import { NeighborhoodMemoryRepository } from './neighborhood.memory.repository.ts'
import type { NeighborhoodRepository } from './neighborhood.repository.ts'

import { Neighborhood } from '#domain/neighborhood/neighborhood.entity'
import { resetDatabase } from '#tests/http-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<NeighborhoodRepository> =>
    app.container.make(NeighborhoodLucidRepository),
  memory: async (): Promise<NeighborhoodRepository> => new NeighborhoodMemoryRepository(),
} satisfies Record<string, () => Promise<NeighborhoodRepository>>

const NOW = new Date('2026-10-29T12:00:00.000Z')
const CENTRO = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a91'
const COHAB = '5c7a3d2f-4a3b-4d9f-8b2c-1a7e3f8d9b02'
const LONGE = '6d8b4e3a-5b4c-4eaa-9c3d-2b8f4a9eac13'

function make(
  id: string,
  name: string,
  center?: { latitude: number; longitude: number },
): Neighborhood {
  const created = Neighborhood.create({ id, name, ...center, now: NOW })
  if (created.isLeft()) throw new Error('invalid arrangement')

  return created.value
}

for (const [name, build] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`NeighborhoodRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same neighborhood', async ({ assert }) => {
      const repository = await build()
      const centro = make(CENTRO, 'Centro', { latitude: -4.3769, longitude: -70.0314 })

      await repository.save(centro)
      const found = await repository.findById(CENTRO)

      assert.deepEqual(found?.snapshot(), centro.snapshot())
      assert.isNull(await repository.findById(COHAB))
    })

    test('a name or slug of another neighborhood returns NEIGHBORHOOD_ALREADY_EXISTS', async ({
      assert,
    }) => {
      const repository = await build()
      await repository.save(make(CENTRO, 'Centro'))

      const sameName = await repository.save(make(COHAB, 'Centro'))
      const sameSlug = await repository.save(make(LONGE, 'CENTRO'))

      assert.deepEqual(sameName.value, { code: 'NEIGHBORHOOD_ALREADY_EXISTS' })
      assert.deepEqual(sameSlug.value, { code: 'NEIGHBORHOOD_ALREADY_EXISTS' })
    })

    test('existsByNameOrSlug ignores the neighborhood itself', async ({ assert }) => {
      const repository = await build()
      await repository.save(make(CENTRO, 'Centro'))

      assert.isTrue(await repository.existsByNameOrSlug('Centro', 'centro'))
      assert.isFalse(await repository.existsByNameOrSlug('Centro', 'centro', CENTRO))
      assert.isFalse(await repository.existsByNameOrSlug('Outro', 'outro'))
    })

    test('nearestTo picks the closest center and ignores those without one', async ({ assert }) => {
      const repository = await build()
      await repository.save(make(CENTRO, 'Centro', { latitude: -4.3769, longitude: -70.0314 }))
      await repository.save(make(COHAB, 'Cohab', { latitude: -4.3841, longitude: -70.0268 }))
      await repository.save(make(LONGE, 'Sem centro'))

      assert.equal(await repository.nearestTo({ latitude: -4.3835, longitude: -70.0272 }), COHAB)
      assert.equal(await repository.nearestTo({ latitude: -4.3771, longitude: -70.0312 }), CENTRO)
      assert.isNull(await repository.nearestTo({ latitude: -3.1, longitude: -60 }))
    })

    test('paginate searches by name and sorts; listAll is by name', async ({ assert }) => {
      const repository = await build()
      await repository.save(make(COHAB, 'Cohab'))
      await repository.save(make(CENTRO, 'Centro'))
      await repository.save(make(LONGE, 'Livramento'))
      const base = { page: 1, perPage: 10, sort: 'name', direction: 'asc' } as const

      const searched = await repository.paginate({ ...base, search: 'co' })
      const reversed = await repository.paginate({ ...base, direction: 'desc' })
      const all = await repository.listAll()

      assert.deepEqual(
        searched.data.map((item) => item.name),
        ['Cohab'],
      )
      assert.equal(reversed.data[0]?.name, 'Livramento')
      assert.deepEqual(
        all.map((item) => item.name),
        ['Centro', 'Cohab', 'Livramento'],
      )
    })

    test('delete removes it', async ({ assert }) => {
      const repository = await build()
      const centro = make(CENTRO, 'Centro')
      await repository.save(centro)

      await repository.delete(centro)

      assert.isNull(await repository.findById(CENTRO))
    })
  })
}
