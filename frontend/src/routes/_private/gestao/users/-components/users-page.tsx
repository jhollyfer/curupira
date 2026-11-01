import { ACTIVE_STATUSES, USER_ROLES } from '@curupira/shared'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { OptionSelect } from '#/components/common/option-select'
import { useTable } from '#/components/common/table'
import { managementUsersQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { countActiveFilters } from '#/lib/active-filters'
import { ACTIVE_STATUS_LABELS, USER_ROLE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { userColumns } from './columns'
import { FilterPanel } from '../../../-components/filter-panel'
import { ListPage } from '../../../-components/list-page'
import { SearchFilter } from '../../../-components/search-filter'

const route = getRouteApi('/_private/gestao/users/')

export function UsersPage(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const ids = React.useId()
  const query = useQuery(managementUsersQueryOptions(search))

  const table = useTable({
    rows: query.data?.data ?? [],
    columns: userColumns(),
    getRowId: (row) => row.id,
  })

  return (
    <ListPage
      to="/gestao/users"
      search={search}
      title={m.panel_users_title()}
      description={m.panel_users_description()}
      query={query}
      table={table}
      filtered={Boolean(search.role || search.status || search.search)}
      emptyTitle={m.panel_users_empty_title()}
      emptyDescription={m.panel_users_empty_description()}
      create={{ to: '/gestao/users/new', label: m.panel_users_new() }}
      filters={
        <FilterPanel
          label={m.panel_users_filters_label()}
          activeCount={countActiveFilters(search, ['role', 'status', 'search'])}
          onClear={() => void navigate({ search: {} })}
        >
          <OptionSelect
            id={ids.concat('-role')}
            label={m.panel_users_filter_role()}
            allLabel={m.panel_users_filter_all_roles()}
            value={search.role}
            options={USER_ROLES.map((role) => ({
              value: role,
              label: USER_ROLE_LABELS[role](),
            }))}
            onValueChange={(value) =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  role: USER_ROLES.find((role) => role === value),
                  page: undefined,
                }),
              })
            }
          />
          <OptionSelect
            id={ids.concat('-status')}
            label={m.panel_users_filter_status()}
            allLabel={m.panel_users_filter_all_statuses()}
            value={search.status}
            options={ACTIVE_STATUSES.map((status) => ({
              value: status,
              label: ACTIVE_STATUS_LABELS[status](),
            }))}
            onValueChange={(value) =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  status: ACTIVE_STATUSES.find((status) => status === value),
                  page: undefined,
                }),
              })
            }
          />
          <SearchFilter
            id={ids.concat('-search')}
            label={m.panel_users_filter_search()}
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
        </FilterPanel>
      }
      onRowClick={(row) =>
        void navigate({ to: '/gestao/users/$id/edit', params: { id: row.id } })
      }
    />
  )
}
