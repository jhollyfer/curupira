/**
 * The panel's e2e accounts. They are the seeder's (`backend/database/seeders/user.seed.ts`):
 * the owner is the ADMINISTRATOR created from `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD`, and
 * the password has no default in the backend, so none here either - a spec that needs a
 * session fails with a clear message instead of trying a guessable credential.
 *
 * Against the example data (`VITE_DATA_SOURCE=mock`, development only) the panel offers
 * its own example accounts (`data/management/session.ts`); those are used when no
 * `E2E_OWNER_*` is set.
 */
export type Credentials = Readonly<{ email: string; password: string }>

const MOCK_PASSWORD = 'Exemplo@2026'

export function ownerCredentials(): Credentials {
  return {
    email: process.env.E2E_OWNER_EMAIL ?? 'marcelo.tananta@exemplo.invalid',
    password: process.env.E2E_OWNER_PASSWORD ?? MOCK_PASSWORD,
  }
}

/** The OPERATOR. Optional: the specs that need it skip when it is not set. */
export function operatorCredentials(): Credentials | undefined {
  const email = process.env.E2E_OPERATOR_EMAIL
  const password = process.env.E2E_OPERATOR_PASSWORD
  if (!email || !password) return undefined

  return { email, password }
}
