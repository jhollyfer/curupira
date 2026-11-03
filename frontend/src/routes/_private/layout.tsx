import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { NotFoundPageServerError } from '#/components/common/not-found-page'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { Spinner } from '#/components/ui/spinner'
import { TABLET_BREAKPOINT, useIsBelow } from '#/hooks/use-mobile'
import { accountQueryOptions } from '#/integrations/tanstack-query/queries/account'
import { breadcrumbTitle, buildBreadcrumbs } from '#/lib/breadcrumbs'
import { m } from '#/paraglide/messages'

import { Header } from './-components/header'
import { PanelNotFound } from './-components/panel-not-found'
import { Sidebar } from './-components/sidebar'

/**
 * The panel gate (`/gestao`). It lives in the layout, and not on each screen, so a new
 * route inside `_private/` is born protected by being in the right place - the same
 * idea as the `middleware.auth()` applied to the group in `backend/start/routes.ts`.
 *
 * **No role check here, and it is a decision.** Whoever authorizes is the backend: the
 * routes only the administrator can open answer `403`. Repeating the matrix on the
 * client would give two places for it to go stale, and the client's protects nothing.
 *
 * It guards, puts the account in the route context (`useRouteContext().account`) and
 * draws the shell: sidebar, header with the trail, and the content area. Which *areas*
 * a role may open is each area's own `layout.tsx` (`requireCapability`), because the
 * administrator-only ones (schedules, neighborhoods, accounts) are a different group of
 * routes from the ones both roles share.
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
  // One title per screen without a `head()` in every route: the trail already knows
  // where one is, and a tab named "Painel" on all of them cannot be told apart.
  head: ({ matches }) => ({
    meta: [
      {
        title: [
          breadcrumbTitle(buildBreadcrumbs(matches)) || m.panel_title(),
          m.common_site_title(),
        ].join(' | '),
      },
      // Restricted area outside the index (`frontend.md` §9.7).
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  notFoundComponent: PanelNotFound,
  component: RouteComponent,
})

/** The target of the skip link, and the `id` of the `<main>` that `SidebarInset` renders. */
const MAIN_ID = 'conteudo'

function RouteComponent(): React.JSX.Element {
  // Below the tablet breakpoint the sidebar starts collapsed to its icons: the content
  // is the point of a 1024px screen, and the menu is one tap away.
  // `+ 1`: a 1024px tablet in landscape *is* the tablet, and `< 1024` would leave it out.
  const tablet = useIsBelow(TABLET_BREAKPOINT + 1)

  return (
    // `h-svh`, not `min-h-svh`: a height that grows limits no one, and the screens'
    // `PageShell` could never pin its footer. A fixed height gives the ceiling and what
    // scrolls becomes each screen's inner area.
    <SidebarProvider
      collapsed={tablet}
      className="panel-touch h-svh overflow-hidden"
    >
      {/* `sr-only` with `focus:not-sr-only`, not `display: none`: truly hidden it would
          not take focus and would stop existing for whoever it serves. */}
      <a href={'#'.concat(MAIN_ID)} className="skip-link">
        {m.common_skip_to_content()}
      </a>

      <Sidebar />

      {/* `min-w-0` is the horizontal pair of `min-h-0`: a flex item does not shrink below
          its content, and a wide table pushed the page past the screen, where the
          provider's `overflow-hidden` clipped it instead of letting it scroll. */}
      <SidebarInset id={MAIN_ID} tabIndex={-1} className="min-h-0 min-w-0">
        <Header />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto p-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-6">
          {/* A query error that escapes a screen lands here and not at the router
              boundary: the panel stays up, and "Tentar de novo" clears the error held in
              Query's cache before remounting - otherwise the boundary would keep showing
              the old one. */}
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <NotFoundPageServerError onRetry={resetErrorBoundary} />
                )}
              >
                <Outlet />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
