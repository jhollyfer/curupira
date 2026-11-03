import { test } from '@japa/runner'

import ManagementUserUpdateUseCase from './update.use-case.ts'

import { SessionRepository } from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import {
  identityDoubles,
  OTHER_ID,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(ManagementUserUpdateUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
    [UnitOfWork, doubles.unitOfWork],
  ])

  return { ...doubles, useCase }
}

test.group('management/users > update (unit)', () => {
  test('changes the name and does not drop the sessions', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    const result = await useCase.execute({ id: USER_ID, name: 'Ana Maria' })

    assert.deepInclude(result.value, { name: 'Ana Maria' })
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('changing the role or deactivating drops the target sessions', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    await useCase.execute({ id: USER_ID, role: 'ADMINISTRATOR' })
    await useCase.execute({ id: USER_ID, status: 'INACTIVE' })

    assert.deepEqual(sessions.revokedAll, [USER_ID, USER_ID])
  })

  test('the e-mail of another account is 409 USER_ALREADY_EXISTS and writes nothing', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users)
    await seedUser(users, { id: OTHER_ID, email: 'bia@mail.com' })

    const result = await useCase.execute({ id: USER_ID, email: 'bia@mail.com' })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'USER_ALREADY_EXISTS',
    })
    const stored = await users.findById(USER_ID)
    assert.equal(stored?.snapshot().email, 'ana@mail.com')
  })

  test('nonexistent is 404 USER_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: USER_ID })

    assert.deepInclude(result.value, { status: 404, code: 'USER_NOT_FOUND' })
  })
})
