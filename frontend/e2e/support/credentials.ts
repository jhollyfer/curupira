import { randomBytes } from 'node:crypto'

import { requiredEnv } from './env'

/**
 * The panel's e2e accounts. The owner is the seeder's (`backend/database/seeders/user.seed.ts`):
 * the ADMINISTRATOR created from `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD`, and it is the only
 * account the environment carries (`E2E_OWNER_*`). The password has no default in the backend,
 * so none here either: a spec that needs a session stops and says which key is missing.
 */
export type Credentials = Readonly<{ email: string; password: string }>

export function ownerCredentials(): Credentials {
  return {
    email: requiredEnv('E2E_OWNER_EMAIL'),
    password: requiredEnv('E2E_OWNER_PASSWORD'),
  }
}

/**
 * The OPERATOR, born from the owner at the start of each run (`test.ts`). Not an environment
 * key: the catalog has only the owner's, and a fresh e-mail and password per run mean no
 * fixed credential in the workflow and no collision with an account from an earlier run.
 * The password fits the house rule (8 to 32, lower, upper, digit and symbol).
 */
export function generatedOperatorCredentials(): Credentials {
  const id = randomBytes(6).toString('hex')

  return { email: `operador.${id}@mail.com`, password: `Op-${id}-Zz9!` }
}
