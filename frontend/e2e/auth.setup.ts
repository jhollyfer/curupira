import { USER_ROLE } from '@curupira/shared'
import { expect, test as setup } from '@playwright/test'
import { existsSync } from 'node:fs'

import { apiClient } from './support/api'
import { AUTH_FILES } from './support/auth-files'
import { demoCredentials, ownerCredentials } from './support/credentials'

/**
 * The `setup` project (_doc-lib/playwright.md#docs/test-projects): signs in once per run,
 * through the API, and writes each role's session to `e2e/.auth/`. Every viewport project
 * depends on it, so the sign-in limiter (five attempts a minute per IP) is spent twice per
 * run, not once per spec or per worker.
 */
setup('signs the administrator in', async ({ playwright }) => {
  const client = await apiClient(playwright, ownerCredentials())
  await client.storageState({ path: AUTH_FILES.owner })
  await client.dispose()
  expect(existsSync(AUTH_FILES.owner)).toBe(true)
})

setup('signs the operator in', async ({ playwright }) => {
  const client = await apiClient(
    playwright,
    demoCredentials(USER_ROLE.OPERATOR),
  )
  await client.storageState({ path: AUTH_FILES.operator })
  await client.dispose()
  expect(existsSync(AUTH_FILES.operator)).toBe(true)
})
