import type { AuthenticationSessionSignInPayload } from '@curupira/shared'
import { useMutation } from '@tanstack/react-query'

import type { MutationProps } from '#/hooks/tanstack-query/_mutation-props'

import type { HTTPError } from '../http'
import { send } from '../http'
import { mockSignIn, mockSignOut } from '../mock-session'
import { fromSource } from '../source'

/**
 * Signs in (`authentication/sign-in`, the shared `AuthenticationSessionSignIn*`
 * contract). Answers `204` and delivers the tokens in `Set-Cookie`, `httpOnly` -
 * there is nothing to store on screen, and whoever comes to know who is logged in is
 * `GET /account`.
 */
export function useAuthenticationSignInMutation(
  options?: MutationProps<void, AuthenticationSessionSignInPayload>,
) {
  // The generics stay explicit: they are what gives contextual typing to the
  // caller's callbacks.
  return useMutation<void, HTTPError, AuthenticationSessionSignInPayload>({
    ...options,
    mutationFn: function (payload) {
      return fromSource<void>({
        mock: () => mockSignIn(payload.email, payload.password),
        api: () =>
          send('/authentication/sign-in', {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
      })
    },
  })
}

/** Ends the session on the server, and not only on screen. */
export function useAuthenticationSignOutMutation(
  options?: MutationProps<void, void>,
) {
  return useMutation<void, HTTPError, void>({
    ...options,
    mutationFn: function () {
      return fromSource<void>({
        mock: mockSignOut,
        api: () => send('/authentication/sign-out', { method: 'POST' }),
      })
    },
  })
}
