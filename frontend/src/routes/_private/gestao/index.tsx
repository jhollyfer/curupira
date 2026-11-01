import { createFileRoute } from '@tanstack/react-router'

import { managementReportStatsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { townNow } from '#/lib/i18n'

/**
 * The overview: the numbers by kind and status, the last thirty days and the shortcut to
 * what is still untreated. Open to both roles, so there is no area `layout.tsx` here.
 *
 * `today` comes from the loader as text, and not from `townNow()` in the render: the
 * chart's window is anchored on it, and two clocks (server and browser) a second apart
 * across midnight would draw two different charts and fail hydration.
 */
export const Route = createFileRoute('/_private/gestao/')({
  loader: async ({ context }) => {
    await context.queryClient.query(managementReportStatsQueryOptions())

    return { today: townNow().toFormat('yyyy-LL-dd') }
  },
})
