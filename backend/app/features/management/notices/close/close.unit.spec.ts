import { test } from '@japa/runner'

import ManagementNoticeCloseUseCase from './close.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { seedNotice } from '#tests/domain-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

async function setup() {
  const notices = MemoryRepositories.notices()
  const useCase = await makeWithMemory(ManagementNoticeCloseUseCase, [
    [NoticeRepository, notices],
  ])

  return { notices, useCase }
}

test.group('management/notices > close (unit)', () => {
  test('closes the notice: status CLOSED with the closing instant, and it leaves the home', async ({
    assert,
  }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices, {
      startsAt: new Date('2020-01-01T00:00:00Z'),
    })
    assert.lengthOf(await notices.listActive(new Date()), 1)

    const result = await useCase.execute({ id })

    assert.deepInclude(result.value, { status: 'CLOSED' })
    assert.isString(rightOf(result).closedAt)
    assert.lengthOf(await notices.listActive(new Date()), 0)
  })

  test('closing twice is 409 NOTICE_ALREADY_CLOSED', async ({ assert }) => {
    const { notices, useCase } = await setup()
    const id = await seedNotice(notices)
    await useCase.execute({ id })

    const result = await useCase.execute({ id })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'NOTICE_ALREADY_CLOSED',
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
