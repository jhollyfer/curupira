import { test } from '@japa/runner'

import ManagementNoticeDeleteUseCase from './delete.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNotice } from '#tests/domain-unit-fixtures'

async function setup() {
  const notices = MemoryRepositories.notices()
  const useCase = await makeWithMemory(ManagementNoticeDeleteUseCase, [
    [NoticeRepository, notices],
  ])

  return { notices, useCase }
}

test.group('management/notices > delete (unit)', () => {
  test('deletes the notice', async ({ assert }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices)

    const result = await useCase.execute({ id })

    assert.isTrue(result.isRight())
    assert.isNull(await notices.findById(id))
  })

  test('nonexistent is 404 NOTICE_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      id: '00000000-0000-4000-8000-000000000000',
    })

    assert.deepInclude(result.value, { status: 404, code: 'NOTICE_NOT_FOUND' })
  })
})
