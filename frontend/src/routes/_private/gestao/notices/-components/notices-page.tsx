import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import { useTable } from '#/components/common/table'
import { managementNoticesQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { ListPage } from '../../../-components/list-page'

import { noticeColumns } from './columns'
import { NoticesFilters } from './filters'

const route = getRouteApi('/_private/gestao/notices/')

export function NoticesPage(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const query = useQuery(managementNoticesQueryOptions(search))

  const table = useTable({
    rows: query.data?.data ?? [],
    columns: noticeColumns(),
    getRowId: (row) => row.id,
  })

  return (
    <ListPage
      to="/gestao/notices"
      search={search}
      title={m.panel_notices_title()}
      description={m.panel_notices_description()}
      query={query}
      table={table}
      filtered={Boolean(search.status || search.search)}
      emptyTitle={m.panel_notices_empty_title()}
      emptyDescription={m.panel_notices_empty_description()}
      create={{ to: '/gestao/notices/new', label: m.panel_notices_new() }}
      filters={<NoticesFilters />}
      onRowClick={(row) =>
        void navigate({ to: '/gestao/notices/$id/edit', params: { id: row.id } })
      }
    />
  )
}
