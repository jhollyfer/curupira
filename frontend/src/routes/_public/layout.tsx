import { createFileRoute, Outlet } from '@tanstack/react-router'
import type * as React from 'react'

import { m } from '#/paraglide/messages'

import { ConnectionStatus } from './-components/connection-status'
import { Footer } from './-components/footer'
import { Header } from './-components/header'
import { ReportQueueSync } from './-components/report-queue-sync'

/** The target of the skip link, and the `id` of the `<main>`. */
const MAIN_ID = 'conteudo'

/**
 * The shell of every public screen: header, connection strip, content and footer.
 *
 * **No `beforeLoad`, and it is a decision.** The resident never signs in: the public app
 * is anonymous by design, and a guard here would turn the audience into a redirect.
 * The panel's guard is in `_private/layout.tsx`, the exact opposite.
 *
 * Pathless group: `_public` does not enter the address. `/schedule` is `/schedule`.
 */
export const Route = createFileRoute('/_public')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return (
    <div className="flex min-h-svh flex-col">
      {/* The page's first tab stop, invisible until it receives focus: the header and
          the five destinations repeat on every page, and a keyboard user would cross
          them each time. */}
      <a href={'#'.concat(MAIN_ID)} className="skip-link">
        {m.common_skip_to_content()}
      </a>

      <Header />
      <ConnectionStatus />

      {/* `tabIndex={-1}` lets the jump target receive focus: without it the browser
          scrolls here and leaves focus on the link, and the next tab goes back to
          the top. */}
      <main id={MAIN_ID} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <Footer />
      <ReportQueueSync />
    </div>
  )
}
