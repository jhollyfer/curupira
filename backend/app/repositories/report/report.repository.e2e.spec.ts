import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'

import { ReportLucidRepository } from './report.lucid.repository.ts'
import { ReportMemoryRepository } from './report.memory.repository.ts'
import type { ReportRepository } from './report.repository.ts'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { StorageFactory } from '#database/factories/storage.factory'
import { UserFactory } from '#database/factories/user.factory'
import { Report } from '#domain/report/report.entity'
import { resetDatabase } from '#tests/http-fixtures'

type Built = {
  readonly repository: ReportRepository
  /** A file both implementations accept as a photo (a storage row, or just an id). */
  readonly photo: () => Promise<string>
  /** A neighborhood both implementations can join. */
  readonly neighborhood: (name: string) => Promise<string>
  /** An account that can sign a timeline event. */
  readonly author: (name: string) => Promise<string>
}

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<Built> => ({
    repository: await app.container.make(ReportLucidRepository),
    photo: async () => {
      const row = await StorageFactory.create()

      return row.id
    },
    neighborhood: async (name) => {
      const row = await NeighborhoodFactory.merge({ name }).create()

      return row.id
    },
    author: async (name) => {
      const row = await UserFactory.merge({ name }).create()

      return row.id
    },
  }),
  memory: async (): Promise<Built> => {
    const repository = new ReportMemoryRepository()

    return {
      repository,
      photo: async () => randomUUID(),
      neighborhood: async (name) => {
        const id = randomUUID()
        repository.withNeighborhood(id, name)

        return id
      },
      author: async (name) => {
        const id = randomUUID()
        repository.withAuthor(id, name)

        return id
      },
    }
  },
} satisfies Record<string, () => Promise<Built>>

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date()

function report(
  protocol: string,
  overrides: Partial<Parameters<typeof Report.receive>[0]> = {},
): Report {
  return Report.receive({
    id: randomUUID(),
    eventId: randomUUID(),
    protocol,
    kind: 'DUMPING',
    latitude: -4.3769,
    longitude: -70.0314,
    neighborhoodId: null,
    photoIds: [],
    now: NOW,
    ...overrides,
  })
}

for (const [name, build] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`ReportRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same report, with its timeline and photos', async ({
      assert,
    }) => {
      const { repository, photo } = await build()
      const entity = report('CUR-2ABC-3DEF', {
        contact: '(97) 99999-0000',
        photoIds: [await photo()],
      })

      await repository.save(entity)
      const found = await repository.findById(entity.id)

      assert.deepEqual(
        found?.snapshot().events.map((event) => event.status),
        ['RECEIVED'],
      )
      assert.deepEqual(found?.snapshot().photoIds, entity.snapshot().photoIds)
      assert.deepInclude(found?.snapshot(), {
        protocol: 'CUR-2ABC-3DEF',
        contact: '(97) 99999-0000',
        anonymous: false,
      })
      assert.isNull(await repository.findById(randomUUID()))
    })

    test('saving after advance appends one event and never rewrites the history', async ({
      assert,
    }) => {
      const { repository, author } = await build()
      const entity = report('CUR-2ABC-3DEF')
      await repository.save(entity)
      const authorId = await author('Ana')

      entity.advance(
        {
          eventId: randomUUID(),
          status: 'IN_REVIEW',
          message: 'Olhando',
          authorId,
        },
        NOW,
      )
      await repository.save(entity)
      await repository.save(entity)

      const found = await repository.findById(entity.id)
      assert.deepEqual(
        found?.snapshot().events.map((event) => event.status),
        ['RECEIVED', 'IN_REVIEW'],
      )
      assert.equal(found?.snapshot().status, 'IN_REVIEW')
      const detail = await repository.detail(entity.id)
      assert.equal(detail?.events.at(-1)?.authorName, 'Ana')
      assert.isNull(detail?.events[0]?.authorName)
    })

    test('a protocol of another report returns REPORT_PROTOCOL_TAKEN', async ({
      assert,
    }) => {
      const { repository } = await build()
      await repository.save(report('CUR-2ABC-3DEF'))

      const saved = await repository.save(report('CUR-2ABC-3DEF'))

      assert.deepEqual(saved.value, { code: 'REPORT_PROTOCOL_TAKEN' })
    })

    test('a photo already attached to another report returns REPORT_PHOTO_TAKEN', async ({
      assert,
    }) => {
      const { repository, photo } = await build()
      const shared = await photo()
      await repository.save(report('CUR-2AAA-0001', { photoIds: [shared] }))

      const saved = await repository.save(
        report('CUR-2AAA-0002', { photoIds: [shared] }),
      )

      assert.deepEqual(saved.value, { code: 'REPORT_PHOTO_TAKEN' })
      assert.isTrue(await repository.anyPhotoTaken([shared]))
      assert.isFalse(await repository.anyPhotoTaken([randomUUID()]))
    })

    test('detail brings the contact, the description and the neighborhood name', async ({
      assert,
    }) => {
      const { repository, neighborhood } = await build()
      const centro = await neighborhood('Centro')
      const entity = report('CUR-2ABC-3DEF', {
        neighborhoodId: centro,
        contact: '(97) 99999-0000',
        description: 'Entulho',
      })
      await repository.save(entity)

      const detail = await repository.detail(entity.id)

      assert.deepInclude(detail, {
        contact: '(97) 99999-0000',
        description: 'Entulho',
        neighborhoodName: 'Centro',
      })
      assert.isNull(await repository.detail(randomUUID()))
    })

    test('paginate cuts, searches and orders; the items carry no contact', async ({
      assert,
    }) => {
      const { repository } = await build()
      await repository.save(
        report('CUR-2AAA-0001', {
          kind: 'BURNING',
          contact: '(97) 1',
          now: new Date(NOW.getTime() - 2 * DAY),
        }),
      )
      await repository.save(
        report('CUR-2AAA-0002', { description: 'lixo na rua' }),
      )
      const base = {
        page: 1,
        perPage: 10,
        sort: 'createdAt',
        direction: 'desc',
      } as const

      const all = await repository.paginate(base)
      const burning = await repository.paginate({ ...base, kind: 'BURNING' })
      const recent = await repository.paginate({
        ...base,
        from: new Date(NOW.getTime() - DAY),
      })
      const searched = await repository.paginate({ ...base, search: 'lixo' })

      assert.deepEqual(
        all.data.map((item) => item.protocol),
        ['CUR-2AAA-0002', 'CUR-2AAA-0001'],
      )
      assert.deepEqual(
        burning.data.map((item) => item.protocol),
        ['CUR-2AAA-0001'],
      )
      assert.deepEqual(
        recent.data.map((item) => item.protocol),
        ['CUR-2AAA-0002'],
      )
      assert.deepEqual(
        searched.data.map((item) => item.protocol),
        ['CUR-2AAA-0002'],
      )
      assert.notProperty(all.data[0], 'contact')
    })

    test('pins return every match with no page', async ({ assert }) => {
      const { repository } = await build()
      for (let index = 0; index < 25; index++)
        await repository.save(
          report(`CUR-2AAA-${String(index).padStart(4, '0')}`),
        )

      const pins = await repository.pins({})

      assert.lengthOf(pins, 25)
    })

    test('statistics counts by kind, status and local day', async ({
      assert,
    }) => {
      const { repository, author } = await build()
      await repository.save(report('CUR-2AAA-0001', { kind: 'BURNING' }))
      const resolved = report('CUR-2AAA-0002')
      resolved.advance(
        {
          eventId: randomUUID(),
          status: 'RESOLVED',
          authorId: await author('Ana'),
        },
        NOW,
      )
      await repository.save(resolved)
      await repository.save(
        report('CUR-2AAA-0003', { now: new Date(NOW.getTime() - 60 * DAY) }),
      )

      const stats = await repository.statistics(
        new Date(NOW.getTime() - 30 * DAY),
      )

      const total = (
        rows: ReadonlyArray<{ key: string; total: number }>,
        key: string,
      ) => rows.find((row) => row.key === key)?.total
      assert.equal(total(stats.byKind, 'BURNING'), 1)
      assert.equal(total(stats.byKind, 'DUMPING'), 2)
      assert.equal(total(stats.byStatus, 'RESOLVED'), 1)
      assert.equal(
        stats.byDay.reduce((sum, row) => sum + row.total, 0),
        2,
      )
    })

    test('showByProtocol is the public shape only, with the timeline', async ({
      assert,
    }) => {
      const { repository, author, photo } = await build()
      const entity = report('CUR-2ABC-3DEF', {
        contact: '(97) 99999-0000',
        description: 'texto privado',
        photoIds: [await photo()],
      })
      entity.advance(
        {
          eventId: randomUUID(),
          status: 'IN_REVIEW',
          message: 'Olhando',
          authorId: await author('Ana'),
        },
        NOW,
      )
      await repository.save(entity)

      const shown = await repository.showByProtocol('CUR-2ABC-3DEF')

      assert.deepEqual(Object.keys(shown ?? {}).sort(), [
        'createdAt',
        'events',
        'kind',
        'protocol',
        'status',
      ])
      assert.deepEqual(Object.keys(shown?.events[1] ?? {}).sort(), [
        'at',
        'message',
        'status',
      ])
      assert.notInclude(JSON.stringify(shown), 'Ana')
      assert.isNull(await repository.showByProtocol('CUR-ZZZZ-ZZZZ'))
    })

    test('publicMap has only the public statuses, the day without the hour, no private field', async ({
      assert,
    }) => {
      const { repository, author } = await build()
      await repository.save(report('CUR-2AAA-0001'))
      const reviewed = report('CUR-2AAA-0002', {
        contact: '(97) 99999-0000',
        description: 'privado',
      })
      reviewed.advance(
        {
          eventId: randomUUID(),
          status: 'IN_REVIEW',
          authorId: await author('Ana'),
        },
        NOW,
      )
      await repository.save(reviewed)

      const pins = await repository.publicMap(10)

      assert.lengthOf(pins, 1)
      assert.deepEqual(Object.keys(pins[0] ?? {}).sort(), [
        'day',
        'id',
        'kind',
        'latitude',
        'longitude',
        'status',
      ])
      assert.match(pins[0]?.day ?? '', /^\d{4}-\d{2}-\d{2}$/)
    })

    test('publicMap keeps only the newest pins up to the limit', async ({
      assert,
    }) => {
      const { repository, author } = await build()
      const reviewer = await author('Ana')
      for (const [index, suffix] of ['0001', '0002', '0003'].entries()) {
        const entity = report(`CUR-2AAA-${suffix}`)
        entity.advance(
          { eventId: randomUUID(), status: 'IN_REVIEW', authorId: reviewer },
          new Date(NOW.getTime() + index * 1000),
        )
        await repository.save(entity)
      }

      const pins = await repository.publicMap(2)

      assert.lengthOf(pins, 2)
    })

    test('delete removes the report and its photo links', async ({
      assert,
    }) => {
      const { repository, photo } = await build()
      const entity = report('CUR-2ABC-3DEF', { photoIds: [await photo()] })
      await repository.save(entity)

      await repository.delete(entity)

      assert.isNull(await repository.findById(entity.id))
      assert.deepEqual(await repository.photoStorageIds(entity.id), [])
    })
  })
}
