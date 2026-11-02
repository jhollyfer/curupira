import type { USER_ROLE, UserRole } from '@curupira/shared'

import { requiredEnv } from './env'

/**
 * The panel's e2e accounts. The owner is the seeder's (`backend/database/seeders/user.seed.ts`):
 * the ADMINISTRATOR created from `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD`, carried by
 * `E2E_OWNER_*`. The other roles are the demonstration seeder's
 * (`backend/database/seeders/demo.seed.ts`): one account per role, `<role>@example.com`,
 * all with the backend's `SEED_DEMO_PASSWORD`, which is `E2E_DEMO_PASSWORD` here. Neither
 * password has a default in the backend, so none here either: a spec that needs a session
 * stops and says which key is missing.
 */
export type Credentials = Readonly<{ email: string; password: string }>

export function ownerCredentials(): Credentials {
  return {
    email: requiredEnv('E2E_OWNER_EMAIL'),
    password: requiredEnv('E2E_OWNER_PASSWORD'),
  }
}

/**
 * A role other than the owner, from the demonstration seeder: the e-mail is the seeder's
 * own rule (`<role>@example.com`, lower case), the password is `E2E_DEMO_PASSWORD`.
 */
export function demoCredentials(
  role: Exclude<UserRole, typeof USER_ROLE.ADMINISTRATOR>,
): Credentials {
  return {
    email: `${role.toLowerCase()}@example.com`,
    password: requiredEnv('E2E_DEMO_PASSWORD'),
  }
}
