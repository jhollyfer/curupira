import { NOTICE_STATUSES } from '@curupira/shared'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { OptionSelect } from '#/components/common/option-select'
import { countActiveFilters } from '#/lib/active-filters'
import { NOTICE_STATUS_LABELS } from '#/lib/labels'
import type { NoticesSearch } from '#/lib/management-search'
import { m } from '#/paraglide/messages'

import { FilterPanel } from '../../../-components/filter-panel'
import { SearchFilter } from '../../../-components/search-filter'

const route = getRouteApi('/_private/management/notices/')

const FILTER_KEYS = ['status', 'search'] satisfies ReadonlyArray<
  keyof NoticesSearch
>

export function NoticesFilters(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const ids = React.useId()

  return (
    <FilterPanel
      label={m.panel_notices_filters_label()}
      activeCount={countActiveFilters(search, FILTER_KEYS)}
      onClear={() => void navigate({ search: {} })}
    >
      <OptionSelect
        id={ids.concat('-status')}
        label={m.panel_notices_filter_status()}
        allLabel={m.panel_notices_filter_all()}
        value={search.status}
        options={NOTICE_STATUSES.map((status) => ({
          value: status,
          label: NOTICE_STATUS_LABELS[status](),
        }))}
        onValueChange={(value) =>
          void navigate({
            search: (previous) => ({
              ...previous,
              status: NOTICE_STATUSES.find((status) => status === value),
              page: undefined,
            }),
          })
        }
      />
      <SearchFilter
        id={ids.concat('-search')}
        label={m.panel_notices_filter_search()}
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
  )
}
