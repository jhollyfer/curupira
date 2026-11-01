import type { UserRole } from '@curupira/shared'

import { MOCK_ADMINISTRATOR_ID, MOCK_OPERATOR_ID } from './seed-users'

/**
 * The example session of the panel - **development only**. `/gestao` is guarded by a
 * real session, so in `VITE_DATA_SOURCE=mock` there has to be some way in; this is it: a
 * `curupira-mock-session` cookie holding the id of one of two example accounts.
 *
 * Every entry point checks `import.meta.env.DEV` first (`integrations/tanstack-query/
 * mock-session.ts`), and that constant is replaced at build time, so the production
 * bundle drops the accounts, the cookie name and the sign-in shortcut instead of
 * shipping a back door. A production build in `mock` mode simply has no session: the
 * guard redirects to sign-in and the form answers 401.
 */
export const MOCK_SESSION_COOKIE = 'curupira-mock-session'

export type MockAccount = Readonly<{
  id: string
  name: string
  email: string
  role: UserRole
}>

export const MOCK_ACCOUNTS: ReadonlyArray<MockAccount> = [
  {
    id: MOCK_ADMINISTRATOR_ID,
    name: 'Marcelo Tananta',
    email: 'marcelo.tananta@benjamin.am.gov.br',
    role: 'ADMINISTRATOR',
  },
  {
    id: MOCK_OPERATOR_ID,
    name: 'Rosângela Pinto',
    email: 'rosangela.pinto@benjamin.am.gov.br',
    role: 'OPERATOR',
  },
]

/** The password of both example accounts - typed on the sign-in form in mock mode. */
export const MOCK_PASSWORD = 'Exemplo@2026'

export function mockAccountById(
  id: string | undefined,
): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((account) => account.id === id)
}

export function mockAccountByEmail(email: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email.toLowerCase(),
  )
}

export function sessionIdFromCookie(
  cookie: string | undefined,
): string | undefined {
  for (const entry of cookie?.split(';') ?? []) {
    const separator = entry.indexOf('=')
    if (separator < 0) continue
    if (entry.slice(0, separator).trim() !== MOCK_SESSION_COOKIE) continue

    return entry.slice(separator + 1).trim()
  }

  return undefined
}
