import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useIsMobile } from '#/hooks/use-mobile'
import { managementReportsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { hasReportsFilter } from '#/lib/management-search'
import { m } from '#/paraglide/messages'

import { reportColumns } from './columns'
import { ReportsFilters } from './filters'
import { ReportsMap } from './reports-map'

const route = getRouteApi('/_private/gestao/reports/')

const VIEWS = ['list', 'map'] as const

type View = (typeof VIEWS)[number]

export function ReportsPage(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const query = useQuery(managementReportsQueryOptions(search))
  const rows = query.data?.data ?? []
  const isMobile = useIsMobile()
  // Which half a phone shows. Local on purpose: it is a way of looking, not a filter, and
  // the filters that decide *what* is listed stay in the URL across the breakpoint.
  const [view, setView] = React.useState<View>('list')

  const table = useTable({
    rows,
    columns: reportColumns(),
    getRowId: (row) => row.id,
  })

  let emptyReason: 'empty' | 'filtered' = 'empty'
  if (hasReportsFilter(search) || search.search) emptyReason = 'filtered'

  const list = (
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
            <EmptyStateTitle>{m.panel_reports_empty_title()}</EmptyStateTitle>
            <EmptyStateDescription>
              {m.panel_reports_empty_description()}
            </EmptyStateDescription>
          </EmptyState>
        )}
      </TableContent>
      <TablePagination meta={query.data?.meta} />
    </div>
  )

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

      {isMobile && (
        // The map and the list are two ways into the same set, and a phone has the room
        // for one: tabs, not a 18rem map squeezed above a card list. Only the open tab
        // mounts, so Leaflet is not loaded for someone who never opens the map.
        <Tabs
          value={view}
          onValueChange={(next) => {
            const found = VIEWS.find((item) => item === next)
            if (found) setView(found)
          }}
          className="gap-3"
        >
          <TabsList
            className="w-full"
            aria-label={m.panel_reports_views_label()}
          >
            <TabsTrigger
              value="list"
              className="min-h-11 text-sm text-foreground"
            >
              {m.panel_reports_view_list()}
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="min-h-11 text-sm text-foreground"
            >
              {m.panel_reports_view_map()}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list">{list}</TabsContent>
          <TabsContent value="map">
            <ReportsMap className="h-[calc(100svh-18rem)] min-h-72 rounded-md border shadow-none" />
          </TabsContent>
        </Tabs>
      )}

      {/* Map beside the table from 1280px; stacked below, where each needs the width.
          The grid is the scroll container when stacked, because the table's own area
          cannot be bounded by a map above it. */}
      {!isMobile && (
        <div className="grid min-h-0 flex-1 gap-4 max-xl:grid-rows-[18rem_minmax(26rem,auto)] max-xl:overflow-auto xl:grid-cols-[minmax(16rem,2fr)_minmax(0,3fr)]">
          <ReportsMap className="h-72 rounded-md border shadow-none xl:h-full" />
          {list}
        </div>
      )}
    </Table>
  )
}
