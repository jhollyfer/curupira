import { test } from '@japa/runner'
import { AuthorizationResponse } from '@adonisjs/bouncer'
import { USER_ROLE, type Actor, type UserRole } from '@curupira/shared'

import StoragePolicy from './storage.policy.ts'

import { USER_ID } from '#tests/identity-unit-fixtures'
import { FILE_ID, uploadedFile } from '#tests/storages-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'

function actorOf(role: UserRole, avatarId: string | null = null): Actor {
  return { id: USER_ID, role, avatarId }
}

function denied(response: unknown): {
  status: number | undefined
  code: string | undefined
} {
  if (!(response instanceof AuthorizationResponse))
    return { status: undefined, code: undefined }

  return { status: response.status, code: response.translation?.identifier }
}

const NOT_FOUND = { status: 404, code: 'STORAGE_NOT_FOUND' }

test.group('policies > storage (unit)', () => {
  for (const role of [USER_ROLE.ADMINISTRATOR, USER_ROLE.OPERATOR]) {
    test(`${role}: downloads any file, the panel roles operate the report photos`, async ({
      assert,
    }) => {
      const policy = await makeWithMemory(StoragePolicy, [])

      assert.isTrue(policy.download(actorOf(role), uploadedFile()))
    })
  }

  for (const role of Object.values(USER_ROLE)) {
    test(`${role}: nonexistent file answers 404`, async ({ assert }) => {
      const policy = await makeWithMemory(StoragePolicy, [])

      assert.deepEqual(
        denied(policy.download(actorOf(role, FILE_ID), null)),
        NOT_FOUND,
      )
    })
  }
})
