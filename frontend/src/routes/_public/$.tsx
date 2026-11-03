import { createFileRoute, notFound } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/common/not-found-page'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * The public address that does not exist.
 *
 * An address that matches no route never reaches `_public`, and the router's
 * `defaultNotFoundComponent` draws the screen outside any shell. This catch-all matches
 * every address, so the 404 comes out inside the shell (header, bottom bar, footer) and
 * whoever mistyped has a way out other than the back button. The screen is the
 * `notFoundComponent` of `_public/layout.tsx`.
 *
 * **It throws `notFound()`, and it is a decision.** A catch-all that only rendered the
 * screen matched the route and answered `200`: a soft 404 that search engines index. A
 * `notFound()` in `loader` makes the server answer the real `404`
 * (_doc-lib/tanstack-router.md#guide/not-found-errors,
 * https://tanstack.com/router/latest/docs/guide/not-found-errors).
 *
 * **No `.lazy` file**: the screen is already in the bundle.
 */
export const Route = createFileRoute('/_public/$')({
  loader: () => {
    throw notFound()
  },
  head: ({ match }) =>
    pageHead({
      title: m.common_not_found_title(),
      pathname: match.pathname,
      noindex: true,
    }),
  notFoundComponent: () => <NotFoundPage className="min-h-stage-sm" />,
})
