import type { AccountProfileShowResponse } from '@curupira/shared'
import { createIsomorphicFn } from '@tanstack/react-start'

import { findUser } from '#/data/management/users'
import {
  MOCK_PASSWORD,
  MOCK_SESSION_COOKIE,
  mockAccountByEmail,
  mockAccountById,
  sessionIdFromCookie,
} from '#/data/management/session'
import { env } from '#/env'

import { HTTPError } from './http'
import * as server from './http.server'

/**
 * The example session, readable on both sides: the SSR `beforeLoad` of `/gestao` runs on
 * the server (`ssr: 'data-only'`), where the only thing that knows who is logged in is
 * the request's `Cookie` header - the same channel the real session uses.
 *
 * **Development only, by construction.** `enabled` folds `import.meta.env.DEV` (replaced
 * at build time) into every entry point, so a production bundle - even one built with
 * `VITE_DATA_SOURCE=mock`, which is the default - answers 401 to everything and the
 * accounts in `data/management/session.ts` are dropped as dead code. Without that, the
 * default data source would have shipped a login with a password written in the repo.
 */
const enabled = import.meta.env.DEV && env.VITE_DATA_SOURCE === 'mock'

const cookieHeader = createIsomorphicFn()
  .client((): string | undefined => document.cookie)
  .server((): string | undefined => server.inboundCookie())

function unauthenticated(): HTTPError {
  return new HTTPError({
    message: 'Sessão ausente ou expirada',
    status: 401,
    code: 'AUTHENTICATION_REQUIRED',
  })
}

export function mockProfile(): AccountProfileShowResponse {
  if (!enabled) throw unauthenticated()

  const account = mockAccountById(sessionIdFromCookie(cookieHeader()))
  if (!account) throw unauthenticated()

  return findUser(account.id)
}

export function mockSignIn(email: string, password: string): void {
  const account = mockAccountByEmail(email)

  if (!enabled || !account || password !== MOCK_PASSWORD) {
    throw new HTTPError({
      message: 'E-mail ou senha incorretos',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      errors: { root: 'E-mail ou senha incorretos' },
    })
  }

  document.cookie = `${MOCK_SESSION_COOKIE}=${account.id}; path=/; SameSite=Lax`
}

export function mockSignOut(): void {
  document.cookie = `${MOCK_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

/** Whether the sign-in screen may offer the example accounts. */
export const MOCK_LOGIN_AVAILABLE = enabled
