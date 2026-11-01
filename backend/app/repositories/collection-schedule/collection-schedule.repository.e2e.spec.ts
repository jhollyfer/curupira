import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'

import { CollectionScheduleLucidRepository } from './collection-schedule.lucid.repository.ts'
import { CollectionScheduleMemoryRepository } from './collection-schedule.memory.repository.ts'
import type { CollectionScheduleRepository } from './collection-schedule.repository.ts'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { CollectionSchedule } from '#domain/collection-schedule/collection-schedule.entity'
import { resetDatabase } from '#tests/http-fixtures'

type Built = {
  readonly repository: CollectionScheduleRepository
  /** Arranges a neighborhood both implementations can join (a row, or the memory name). */
  readonly neighborhood: (name: string) => Promise<string>
}

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<Built> => ({
    repository: await app.container.make(CollectionScheduleLucidRepository),
    neighborhood: async (name) => {
      const row = await NeighborhoodFactory.merge({ name }).create()

      return row.id
    },
  }),
  memory: async (): Promise<Built> => {
    const repository = new CollectionScheduleMemoryRepository()
    let sequence = 0

    return {
      repository,
      neighborhood: async (name) => {
        sequence += 1
        const id = `00000000-0000-4000-8000-00000000000${sequence}`
        repository.withNeighborhood(id, name)

        return id
      },
    }
  },
} satisfies Record<string, () => Promise<Built>>

const NOW = new Date('2026-10-29T12:00:00.000Z')
const ONE = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a91'
const TWO = '5c7a3d2f-4a3b-4d9f-8b2c-1a7e3f8d9b02'
const THREE = '6d8b4e3a-5b4c-4eaa-9c3d-2b8f4a9eac13'

function slot(
  id: string,
  neighborhoodId: string,
  overrides: Partial<Parameters<typeof CollectionSchedule.create>[0]> = {},
): CollectionSchedule {
  return CollectionSchedule.create({
    id,
    neighborhoodId,
    wasteType: 'ORGANIC',
    weekday: 'MONDAY',
    shift: 'MORNING',
    now: NOW,
    ...overrides,
  })
}

for (const [name, build] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`CollectionScheduleRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same slot', async ({ assert }) => {
      const { repository, neighborhood } = await build()
      const entity = slot(ONE, await neighborhood('Centro'), { note: 'Até as 9h' })

      await repository.save(entity)
      const found = await repository.findById(ONE)

      assert.deepEqual(found?.snapshot(), entity.snapshot())
      assert.isNull(await repository.findById(TWO))
    })

    test('the same neighborhood, type, weekday and shift returns SCHEDULE_ALREADY_EXISTS', async ({
      assert,
    }) => {
      const { repository, neighborhood } = await build()
      const centro = await neighborhood('Centro')
      await repository.save(slot(ONE, centro))

      const repeated = await repository.save(slot(TWO, centro))
      const otherShift = await repository.save(slot(THREE, centro, { shift: 'NIGHT' }))

      assert.deepEqual(repeated.value, { code: 'SCHEDULE_ALREADY_EXISTS' })
      assert.isTrue(otherShift.isRight())
    })

    test('existsSlot ignores the slot itself', async ({ assert }) => {
      const { repository, neighborhood } = await build()
      const centro = await neighborhood('Centro')
      await repository.save(slot(ONE, centro))
      const same = {
        neighborhoodId: centro,
        wasteType: 'ORGANIC',
        weekday: 'MONDAY',
        shift: 'MORNING',
      } as const

      assert.isTrue(await repository.existsSlot(same))
      assert.isFalse(await repository.existsSlot(same, ONE))
      assert.isFalse(await repository.existsSlot({ ...same, weekday: 'TUESDAY' }))
    })

    test('detail and paginate carry the neighborhood name and cut by neighborhood', async ({
      assert,
    }) => {
      const { repository, neighborhood } = await build()
      const centro = await neighborhood('Centro')
      const cohab = await neighborhood('Cohab')
      await repository.save(slot(ONE, centro))
      await repository.save(slot(TWO, cohab))

      const detail = await repository.detail(ONE)
      const page = await repository.paginate({ page: 1, perPage: 10, neighborhoodId: cohab })

      assert.equal(detail?.neighborhoodName, 'Centro')
      assert.deepEqual(
        page.data.map((item) => item.neighborhoodName),
        ['Cohab'],
      )
      assert.isNull(await repository.detail(THREE))
    })

    test('listWeek is in week order, Sunday first, then by shift, and cuts by neighborhood', async ({
      assert,
    }) => {
      const { repository, neighborhood } = await build()
      const centro = await neighborhood('Centro')
      const cohab = await neighborhood('Cohab')
      await repository.save(slot(ONE, centro, { weekday: 'FRIDAY' }))
      await repository.save(slot(TWO, centro, { weekday: 'MONDAY', shift: 'NIGHT' }))
      await repository.save(slot(THREE, centro, { weekday: 'MONDAY', shift: 'MORNING' }))
      await repository.save(slot('7e9c5f4b-6c5d-4fbb-8d4e-3c9a5bafbd24', cohab))

      const week = await repository.listWeek(centro)

      assert.deepEqual(
        week.map((item) => `${item.weekday}/${item.shift}`),
        ['MONDAY/MORNING', 'MONDAY/NIGHT', 'FRIDAY/MORNING'],
      )
      assert.lengthOf(await repository.listWeek(), 4)
    })

    test('delete removes it', async ({ assert }) => {
      const { repository, neighborhood } = await build()
      const entity = slot(ONE, await neighborhood('Centro'))
      await repository.save(entity)

      await repository.delete(entity)

      assert.isNull(await repository.findById(ONE))
    })
  })
}
