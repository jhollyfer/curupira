import { test } from '@japa/runner'

import ManagementNoticeCreateUseCase from './create.use-case.ts'

import { NoticeRepository } from '#repositories/notice/notice.repository'
import { MemoryRepositories } from '#tests/memory-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { leftOf } from '#tests/result-unit-fixtures'

async function setup() {
  const notices = MemoryRepositories.notices()
  const useCase = await makeWithMemory(ManagementNoticeCreateUseCase, [[NoticeRepository, notices]])

  return { notices, useCase }
}

const BASE = { title: 'Coleta no feriado', body: 'Passa à tarde.' }

test.group('management/notices > create (unit)', () => {
  test('publishes an active notice with no end', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ ...BASE, startsAt: '2020-01-01T00:00:00-04:00' })

    assert.isTrue(result.isRight())
    assert.deepInclude(result.value, { title: BASE.title, status: 'ACTIVE', endsAt: null })
  })

  test('a start in the future is SCHEDULED', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ ...BASE, startsAt: '2999-01-01T00:00:00Z' })

    assert.deepInclude(result.value, { status: 'SCHEDULED' })
  })

  test('an end before the start is 422 NOTICE_INVALID_PERIOD pointing at endsAt', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      ...BASE,
      startsAt: '2030-01-02T00:00:00Z',
      endsAt: '2030-01-01T00:00:00Z',
    })

    assert.deepInclude(result.value, { status: 422, code: 'NOTICE_INVALID_PERIOD' })
    assert.property(leftOf(result).errors ?? {}, 'endsAt')
  })
})
