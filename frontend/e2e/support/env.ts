/**
 * The E2E environment (`backend.md` §6.2, "E2E"). No default on purpose: a missing key stops
 * the run and says which one, instead of falling back to an address or an account the
 * developer did not choose (a guessable credential, or a dev server on the wrong port).
 */
export function requiredEnv(name: string): string {
  const value = process.env[name]

  if (value === undefined || value === '') {
    throw new Error(
      `${name} is required for the E2E run (see frontend/.env.e2e.example)`,
    )
  }

  return value
}

/** The origin of the web app under test (`E2E_BASE_URL`). */
export function baseUrl(): string {
  return requiredEnv('E2E_BASE_URL')
}

/** The root of the API the fixtures talk to (`E2E_API_URL`). */
export function apiUrl(): string {
  return requiredEnv('E2E_API_URL')
}
