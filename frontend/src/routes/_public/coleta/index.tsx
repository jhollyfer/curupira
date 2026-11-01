import { createFileRoute } from '@tanstack/react-router'

import { storefrontNeighborhoodsQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { townNowIso } from '#/lib/i18n'
import { pageHead } from '#/lib/page-head'
import { validateScheduleSearch } from '#/lib/search'
import { m } from '#/paraglide/messages'

/**
 * The schedule: the month calendar of the resident's neighborhood. The shown month is
 * in the URL (`?month=2026-12`), so a link to "December" opens December and the back
 * button walks the months.
 */
export const Route = createFileRoute('/_public/coleta/')({
  validateSearch: validateScheduleSearch,
  loader: async ({ context }) => {
    await context.queryClient.query(storefrontNeighborhoodsQueryOptions())

    return { now: townNowIso() }
  },
  head: () =>
    pageHead({
      title: m.schedule_title(),
      description: m.schedule_description(),
      pathname: '/coleta',
    }),
})
