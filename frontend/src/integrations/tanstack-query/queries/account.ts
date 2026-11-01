import { AccountProfileShowResponse } from '@curupira/shared'
import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '#/hooks/tanstack-query/_query-keys'

import { request } from '../http'
import { mockProfile } from '../mock-session'
import { fromSource } from '../source'

/**
 * The session. There is no store, context or auth hook in this repository on
 * purpose: who is logged in is server data, and server data lives in the
 * TanStack Query cache.
 *
 * `queryOptions` and not a loose object so that the layout's `beforeLoad` and any
 * `useQuery` of the panel literally use the same key - that is what makes the
 * second one reuse the cache the first one filled, instead of repeating the request.
 */
export const accountQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.account.profile.all,
    // The `signal` comes from the library itself and is forwarded to `fetch`: without it,
    // a query that unmounts before resolving cancels nothing.
    queryFn: ({ signal }) =>
      fromSource<AccountProfileShowResponse>({
        mock: mockProfile,
        api: () => request('/account', AccountProfileShowResponse, { signal }),
      }),
    // The 401 was already handled inside `request`, which tried to renew the session and
    // could not. Repeating the call does not change the answer, it only delays the
    // redirect to the sign-in.
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
