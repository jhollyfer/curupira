import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import {
  ReportMap,
  ReportMapSelectablePins,
} from '#/components/common/report-map'
import { managementReportsMapQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { reportsFilterOf } from '#/lib/management-search'
import { m } from '#/paraglide/messages'

const route = getRouteApi('/_private/management/reports/')

/**
 * The map of the same cut as the table: `reportsFilterOf` is the one function that picks
 * the filter out of the URL, so a pin can never exist for a report the table filtered
 * out (or the reverse). A click goes to the report's detail.
 */
export function ReportsMap({
  className,
}: Readonly<{ className?: string }>): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useQuery(
    managementReportsMapQueryOptions(reportsFilterOf(search)),
  )
  const reports = data ?? []

  return (
    <ReportMap label={m.panel_reports_map_label()} className={className}>
      <React.Suspense fallback={null}>
        <ReportMapSelectablePins
          reports={reports.map((report) => ({
            ...report,
            title: report.protocol,
          }))}
          onSelect={(id) =>
            void navigate({ to: '/management/reports/$id', params: { id } })
          }
        />
      </React.Suspense>
    </ReportMap>
  )
}
