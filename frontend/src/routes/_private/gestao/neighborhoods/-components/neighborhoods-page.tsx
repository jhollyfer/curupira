import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { useTable } from '#/components/common/table'
import { managementNeighborhoodsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { neighborhoodColumns } from './columns'
import { ListPage } from '../../../-components/list-page'
import { SearchFilter } from '../../../-components/search-filter'

const route = getRouteApi('/_private/gestao/neighborhoods/')

export function NeighborhoodsPage(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const searchId = React.useId()
  const query = useQuery(managementNeighborhoodsQueryOptions(search))

  const table = useTable({
    rows: query.data?.data ?? [],
    columns: neighborhoodColumns(),
    getRowId: (row) => row.id,
  })

  return (
    <ListPage
      to="/gestao/neighborhoods"
      search={search}
      title={m.panel_neighborhoods_title()}
      description={m.panel_neighborhoods_description()}
      query={query}
      table={table}
      filtered={Boolean(search.search)}
      emptyTitle={m.panel_neighborhoods_empty_title()}
      emptyDescription={m.panel_neighborhoods_empty_description()}
      create={{
        to: '/gestao/neighborhoods/new',
        label: m.panel_neighborhoods_new(),
      }}
      filters={
        <form
          role="search"
          aria-label={m.panel_neighborhoods_filters_label()}
          className="flex shrink-0 flex-wrap items-end gap-3"
          onSubmit={(event) => event.preventDefault()}
        >
          <SearchFilter
            id={searchId}
            label={m.panel_neighborhoods_filter_search()}
            value={search.search}
            onCommit={(value) =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  search: value,
                  page: undefined,
                }),
              })
            }
          />
        </form>
      }
      onRowClick={(row) =>
        void navigate({
          to: '/gestao/neighborhoods/$id/edit',
          params: { id: row.id },
        })
      }
    />
  )
}
