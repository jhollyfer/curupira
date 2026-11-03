import { test } from '@japa/runner'

import ManagementNoticeUpdateUseCase from './update.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNotice } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const notices = MemoryRepositories.notices()
  const useCase = await makeWithMemory(ManagementNoticeUpdateUseCase, [
    [NoticeRepository, notices],
  ])

  return { notices, useCase }
}

test.group('management/notices > update (unit)', () => {
  test('changes the title and leaves the rest alone', async ({ assert }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices)

    const result = await useCase.execute({ id, title: 'Novo título' })

    assert.deepInclude(result.value, {
      title: 'Novo título',
      body: 'Passa à tarde.',
    })
  })

  test('sets and then removes the end date', async ({ assert }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices)

    const set = await useCase.execute({ id, endsAt: '2999-01-01T00:00:00Z' })
    const removed = await useCase.execute({ id, endsAt: null })

    assert.equal(rightOf(set).endsAt, '2999-01-01T00:00:00.000Z')
    assert.isNull(rightOf(removed).endsAt)
  })

  test('an end before the existing start is 422 NOTICE_INVALID_PERIOD', async ({
    assert,
  }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices)

    const result = await useCase.execute({ id, endsAt: '2000-01-01T00:00:00Z' })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'NOTICE_INVALID_PERIOD',
    })
  })

  test('nonexistent is 404 NOTICE_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      id: '00000000-0000-4000-8000-000000000000',
    })

    assert.deepInclude(result.value, { status: 404, code: 'NOTICE_NOT_FOUND' })
  })
})
