import { test } from '@japa/runner'

import ManagementNoticePaginateUseCase from './paginate.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNotice } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('management/notices > paginate (unit)', () => {
  test('cuts by the derived status', async ({ assert }) => {
    const notices = MemoryRepositories.notices()
    const useCase = await makeWithMemory(ManagementNoticePaginateUseCase, [
      [NoticeRepository, notices],
    ])
    const long = 365 * 24 * 60 * 60 * 1000
    await seedNotice(notices, { title: 'Ativo', startsAt: new Date(Date.now() - long) })
    await seedNotice(notices, { title: 'Futuro', startsAt: new Date(Date.now() + long) })
    await seedNotice(notices, {
      title: 'Passado',
      startsAt: new Date(Date.now() - 2 * long),
      endsAt: new Date(Date.now() - long),
    })

    const titles = async (status?: 'ACTIVE' | 'SCHEDULED' | 'CLOSED') => {
      const result = await useCase.execute({ status })

      return rightOf(result).data.map((item) => item.title)
    }

    assert.deepEqual(await titles('ACTIVE'), ['Ativo'])
    assert.deepEqual(await titles('SCHEDULED'), ['Futuro'])
    assert.deepEqual(await titles('CLOSED'), ['Passado'])
    assert.lengthOf(await titles(), 3)
  })
})
