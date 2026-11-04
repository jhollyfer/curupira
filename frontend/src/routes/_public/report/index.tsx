import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/**
 * The report: three steps (what, evidence, send). Nothing to load - the form works with
 * no connection, and the report is anonymous, so there is no account to read either.
 */
export const Route = createFileRoute('/_public/report/')({
  head: () =>
    pageHead({
      title: m.report_title(),
      description: m.report_description(),
      pathname: '/report',
    }),
})
