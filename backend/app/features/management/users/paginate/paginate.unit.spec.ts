import { test } from '@japa/runner'

import ManagementUserPaginateUseCase from './paginate.use-case.ts'

import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { identityDoubles, OTHER_ID, seedUser } from '#tests/identity-unit-fixtures'
import { rightOf } from '#tests/result-unit-fixtures'

test.group('management/users > paginate (unit)', () => {
  test('lists by name and cuts by role, status and search', async ({ assert }) => {
    const doubles = identityDoubles()
    const useCase = await makeWithMemory(ManagementUserPaginateUseCase, [
      [UserRepository, doubles.users],
    ])
    await seedUser(doubles.users, { name: 'Ana' })
    await seedUser(doubles.users, {
      id: OTHER_ID,
      name: 'Bia',
      email: 'bia@mail.com',
      role: 'ADMINISTRATOR',
      inactive: true,
    })

    const names = async (payload: Parameters<typeof useCase.execute>[0]) => {
      const result = await useCase.execute(payload)

      return rightOf(result).data.map((item) => item.name)
    }

    assert.deepEqual(await names({}), ['Ana', 'Bia'])
    assert.deepEqual(await names({ role: 'ADMINISTRATOR' }), ['Bia'])
    assert.deepEqual(await names({ status: 'ACTIVE' }), ['Ana'])
    assert.deepEqual(await names({ search: 'bia@' }), ['Bia'])
  })
})
