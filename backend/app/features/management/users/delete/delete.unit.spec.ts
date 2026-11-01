import { test } from '@japa/runner'

import ManagementUserDeleteUseCase from './delete.use-case.ts'

import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { identityDoubles, seedUser, USER_ID } from '#tests/identity-unit-fixtures'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(ManagementUserDeleteUseCase, [
    [UserRepository, doubles.users],
  ])

  return { ...doubles, useCase }
}

test.group('management/users > delete (unit)', () => {
  test('deletes the account for good', async ({ assert }) => {
    const { users, useCase } = await setup()
    await seedUser(users)

    const result = await useCase.execute({ id: USER_ID })

    assert.isTrue(result.isRight())
    assert.isNull(await users.findById(USER_ID))
  })

  test('nonexistent is 404 USER_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: USER_ID })

    assert.deepInclude(result.value, { status: 404, code: 'USER_NOT_FOUND' })
  })
})
