import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'

import { NoticeLucidRepository } from './notice.lucid.repository.ts'
import { NoticeMemoryRepository } from './notice.memory.repository.ts'
import type { NoticeRepository } from './notice.repository.ts'

import { Notice } from '#domain/notice/notice.entity'
import { resetDatabase } from '#tests/http-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<NoticeRepository> =>
    app.container.make(NoticeLucidRepository),
  memory: async (): Promise<NoticeRepository> => new NoticeMemoryRepository(),
} satisfies Record<string, () => Promise<NoticeRepository>>

const NOW = new Date('2026-10-29T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const at = (days: number) => new Date(NOW.getTime() + days * DAY)
const IDS = [
  '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a91',
  '5c7a3d2f-4a3b-4d9f-8b2c-1a7e3f8d9b02',
  '6d8b4e3a-5b4c-4eaa-9c3d-2b8f4a9eac13',
  '7e9c5f4b-6c5d-4fbb-8d4e-3c9a5bafbd24',
] as const

function notice(
  id: string,
  title: string,
  startsAt: Date,
  endsAt: Date | null = null,
): Notice {
  const created = Notice.create({
    id,
    title,
    body: 'Texto',
    startsAt,
    endsAt,
    now: NOW,
  })
  if (created.isLeft()) throw new Error('invalid arrangement')

  return created.value
}

for (const [name, build] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`NoticeRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same notice', async ({ assert }) => {
      const repository = await build()
      const entity = notice(IDS[0], 'Aviso', at(-1), at(3))

      await repository.save(entity)
      const found = await repository.findById(IDS[0])

      assert.deepEqual(found?.snapshot(), entity.snapshot())
      assert.isNull(await repository.findById(IDS[1]))
    })

    test('saving again stores the closing', async ({ assert }) => {
      const repository = await build()
      const entity = notice(IDS[0], 'Aviso', at(-1))
      await repository.save(entity)

      entity.close(NOW)
      await repository.save(entity)

      const found = await repository.findById(IDS[0])
      assert.deepEqual(found?.snapshot().closedAt, NOW)
    })

    test('paginate cuts by the derived status at the given instant', async ({
      assert,
    }) => {
      const repository = await build()
      await repository.save(notice(IDS[0], 'Ativo', at(-1)))
      await repository.save(notice(IDS[1], 'Futuro', at(2)))
      await repository.save(notice(IDS[2], 'Vencido', at(-5), at(-1)))
      const closed = notice(IDS[3], 'Fechado', at(-1))
      closed.close(NOW)
      await repository.save(closed)
      const base = {
        page: 1,
        perPage: 10,
        now: NOW,
        sort: 'title',
        direction: 'asc',
      } as const
      const titles = async (status?: 'ACTIVE' | 'SCHEDULED' | 'CLOSED') => {
        const page = await repository.paginate({ ...base, status })

        return page.data.map((item) => item.title)
      }

      assert.deepEqual(await titles('ACTIVE'), ['Ativo'])
      assert.deepEqual(await titles('SCHEDULED'), ['Futuro'])
      assert.deepEqual(await titles('CLOSED'), ['Fechado', 'Vencido'])
      assert.lengthOf(await titles(), 4)
    })

    test('paginate searches by title and the response carries the derived status', async ({
      assert,
    }) => {
      const repository = await build()
      await repository.save(notice(IDS[0], 'Coleta no feriado', at(-1)))
      await repository.save(notice(IDS[1], 'Mutirão', at(-1)))
      const base = {
        page: 1,
        perPage: 10,
        now: NOW,
        sort: 'title',
        direction: 'asc',
      } as const

      const page = await repository.paginate({ ...base, search: 'feriado' })

      assert.deepEqual(
        page.data.map((item) => [item.title, item.status]),
        [['Coleta no feriado', 'ACTIVE']],
      )
    })

    test('listActive is only the active ones, the most recent start first', async ({
      assert,
    }) => {
      const repository = await build()
      await repository.save(notice(IDS[0], 'Antigo', at(-3)))
      await repository.save(notice(IDS[1], 'Recente', at(-1)))
      await repository.save(notice(IDS[2], 'Futuro', at(2)))

      const active = await repository.listActive(NOW)

      assert.deepEqual(
        active.map((item) => item.title),
        ['Recente', 'Antigo'],
      )
    })

    test('delete removes it', async ({ assert }) => {
      const repository = await build()
      const entity = notice(IDS[0], 'Aviso', at(-1))
      await repository.save(entity)

      await repository.delete(entity)

      assert.isNull(await repository.findById(IDS[0]))
    })
  })
}
