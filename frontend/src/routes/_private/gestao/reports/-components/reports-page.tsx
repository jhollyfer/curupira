import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from '#/components/common/empty-state'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  PageShellHeader,
} from '#/components/common/page-shell'
import {
  Table,
  TableContent,
  TableGrid,
  TablePagination,
  useTable,
} from '#/components/common/table'
import { Skeleton } from '#/components/ui/skeleton'
import { managementReportsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { hasReportsFilter } from '#/lib/management-search'
import { m } from '#/paraglide/messages'

import { reportColumns } from './columns'
import { ReportsFilters } from './filters'
import { ReportsMap } from './reports-map'

const route = getRouteApi('/_private/gestao/reports/')

export function ReportsPage(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const query = useQuery(managementReportsQueryOptions(search))
  const rows = query.data?.data ?? []

  const table = useTable({
    rows,
    columns: reportColumns(),
    getRowId: (row) => row.id,
  })

  let emptyReason: 'empty' | 'filtered' = 'empty'
  if (hasReportsFilter(search) || search.search) emptyReason = 'filtered'

  return (
    <Table
      to="/gestao/reports"
      search={search}
      isPlaceholderData={query.isPlaceholderData}
      isError={query.isError}
      onRetry={() => void query.refetch()}
    >
      <PageShellHeader>
        <PageHeader>
          <PageHeaderTitle>{m.panel_reports_title()}</PageHeaderTitle>
          <PageHeaderDescription>
            {m.panel_reports_description()}
          </PageHeaderDescription>
        </PageHeader>
      </PageShellHeader>

      <ReportsFilters />

      {/* Map beside the table from 1280px; stacked below, where each needs the width.
          The grid is the scroll container when stacked, because the table's own area
          cannot be bounded by a map above it. */}
      <div className="grid min-h-0 flex-1 gap-4 max-xl:grid-rows-[18rem_minmax(26rem,auto)] max-xl:overflow-auto xl:grid-cols-[minmax(16rem,2fr)_minmax(0,3fr)]">
        <ReportsMap className="h-72 rounded-md border shadow-none xl:h-full" />

        <div className="flex min-h-0 flex-col gap-3">
          <TableContent>
            {query.isPending && (
              <Skeleton
                role="status"
                aria-label={m.common_loading()}
                className="h-64 w-full"
              />
            )}
            <TableGrid
              table={table}
              caption={m.panel_reports_title()}
              onRowClick={(row) =>
                void navigate({
                  to: '/gestao/reports/$id',
                  params: { id: row.id },
                })
              }
            />
            {query.isSuccess && rows.length === 0 && (
              <EmptyState reason={emptyReason}>
                <EmptyStateTitle>
                  {m.panel_reports_empty_title()}
                </EmptyStateTitle>
                <EmptyStateDescription>
                  {m.panel_reports_empty_description()}
                </EmptyStateDescription>
              </EmptyState>
            )}
          </TableContent>
          <TablePagination meta={query.data?.meta} />
        </div>
      </div>
    </Table>
  )
}
