import { test } from '@japa/runner'

import StorefrontNoticePaginateUseCase from './paginate.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { seedNotice } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

const YEAR = 365 * 24 * 60 * 60 * 1000

test.group('storefront/notices > paginate (unit)', () => {
  test('shows only the active notices, never scheduled, ended or closed ones', async ({
    assert,
  }) => {
    const notices = MemoryRepositories.notices()
    const useCase = await makeWithMemory(StorefrontNoticePaginateUseCase, [
      [NoticeRepository, notices],
    ])
    await seedNotice(notices, { title: 'Ativo', startsAt: new Date(Date.now() - YEAR) })
    await seedNotice(notices, { title: 'Futuro', startsAt: new Date(Date.now() + YEAR) })
    await seedNotice(notices, {
      title: 'Passado',
      startsAt: new Date(Date.now() - 2 * YEAR),
      endsAt: new Date(Date.now() - YEAR),
    })

    const result = await useCase.execute()

    assert.deepEqual(
      rightOf(result).data.map((item) => item.title),
      ['Ativo'],
    )
  })
})
