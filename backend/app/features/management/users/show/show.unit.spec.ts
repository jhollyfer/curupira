import { test } from '@japa/runner'

import ManagementUserShowUseCase from './show.use-case.ts'

import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { identityDoubles, seedUser, USER_ID } from '#tests/identity-unit-fixtures'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(ManagementUserShowUseCase, [[UserRepository, doubles.users]])

  return { ...doubles, useCase }
}

test.group('management/users > show (unit)', () => {
  test('returns the account without the password', async ({ assert }) => {
    const { users, useCase } = await setup()
    await seedUser(users)

    const result = await useCase.execute({ id: USER_ID })

    assert.deepInclude(result.value, { id: USER_ID, email: 'ana@mail.com' })
    assert.notProperty(result.value, 'password')
  })

  test('nonexistent is 404 USER_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: USER_ID })

    assert.deepInclude(result.value, { status: 404, code: 'USER_NOT_FOUND' })
  })
})
