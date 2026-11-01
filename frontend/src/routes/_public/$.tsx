import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/common/not-found-page'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * The public address that does not exist.
 *
 * The `defaultNotFoundComponent` in `router.tsx` draws the same screen, outside any
 * shell: an address that matches no route never reaches `_public`. This catch-all
 * brings the screen inside the shell (header, bottom bar, footer) so whoever mistyped
 * has a way out other than the back button.
 *
 * **No `.lazy` file, and it is a decision**: the screen is already in the bundle -
 * splitting six lines into a second request costs more than it saves.
 *
 * `noindex` because the address does not exist.
 */
export const Route = createFileRoute('/_public/$')({
  head: ({ match }) =>
    pageHead({
      title: m.common_not_found_title(),
      pathname: match.pathname,
      noindex: true,
    }),
  component: () => <NotFoundPage className="min-h-stage-sm" />,
})
