import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type * as React from 'react'

import { Spinner } from '#/components/ui/spinner'
import { accountQueryOptions } from '#/integrations/tanstack-query/queries/account'
import { m } from '#/paraglide/messages'

/**
 * The panel gate (`/gestao`). It lives in the layout, and not on each screen, so a new
 * route inside `_private/` is born protected by being in the right place - the same
 * idea as the `middleware.auth()` applied to the group in `backend/start/routes.ts`.
 *
 * **No role check here, and it is a decision.** Whoever authorizes is the backend: the
 * routes only the administrator can open answer `403`. Repeating the matrix on the
 * client would give two places for it to go stale, and the client's protects nothing.
 *
 * This is the SKELETON the panel team builds on: it guards, puts the account in the
 * route context (`useRouteContext().account`) and renders the `Outlet`. The panel shell
 * (sidebar, header, breadcrumbs) is the panel's to add here.
 */
export const Route = createFileRoute('/_private')({
  // The panel has nothing to index, and the server's HTML does not know the screen
  // width. Data on the server, screen on the client.
  ssr: 'data-only',
  // Without server HTML, this is what shows until the JS mounts the panel - instead of
  // a blank page.
  pendingComponent: () => (
    <div className="flex h-svh items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  ),
  beforeLoad: async ({ context, location }) => {
    try {
      // `query()` with `staleTime: 'static'` (the former `ensureQueryData`): returns the
      // data and propagates the error. Swallowing the error would make the guard never
      // reject.
      const account = await context.queryClient.query({
        ...accountQueryOptions(),
        staleTime: 'static',
      })

      // Back into the route context: every descendant screen reads the user through
      // `useRouteContext()`, with no new query.
      return { account }
    } catch {
      // Any failure here is the absence of a usable session: `request` already tried
      // to renew with the refresh token before letting the error bubble up.
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
  },
  head: () => ({
    meta: [
      { title: `${m.panel_title()} | ${m.common_site_title()}` },
      // Restricted area outside the index (`frontend.md` §9.7).
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Outlet />
}
