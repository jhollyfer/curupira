import { test } from '@japa/runner'

import ManagementUserCreateUseCase from './create.use-case.ts'

import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { identityDoubles, seedUser } from '#tests/identity-unit-fixtures'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(ManagementUserCreateUseCase, [
    [UserRepository, doubles.users],
  ])

  return { ...doubles, useCase }
}

const NEW = {
  name: 'Beto',
  email: 'beto@mail.com',
  password: 'Senha@123',
  role: 'OPERATOR',
} as const

test.group('management/users > create (unit)', () => {
  test('creates an active account, without the password in the response', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute(NEW)

    assert.isTrue(result.isRight())
    assert.deepInclude(result.value, {
      email: 'beto@mail.com',
      role: 'OPERATOR',
      status: 'ACTIVE',
    })
    assert.notProperty(result.value, 'password')
  })

  test('the e-mail of another account is 409 USER_ALREADY_EXISTS', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users, { email: 'beto@mail.com' })

    const result = await useCase.execute(NEW)

    assert.deepInclude(result.value, {
      status: 409,
      code: 'USER_ALREADY_EXISTS',
    })
  })

  test('repository failure is 500 MANAGEMENT_USER_CREATE_ERROR', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.existsByEmail = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute(NEW)

    assert.deepInclude(result.value, {
      status: 500,
      code: 'MANAGEMENT_USER_CREATE_ERROR',
    })
  })
})
