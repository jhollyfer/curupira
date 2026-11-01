import { NOTICE_STATUSES } from '@curupira/shared'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { OptionSelect } from '#/components/common/option-select'
import { NOTICE_STATUS_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { SearchFilter } from '../../../-components/search-filter'

const route = getRouteApi('/_private/gestao/notices/')

export function NoticesFilters(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const ids = React.useId()

  return (
    <form
      role="search"
      aria-label={m.panel_notices_filters_label()}
      className="flex shrink-0 flex-wrap items-end gap-3"
      onSubmit={(event) => event.preventDefault()}
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
    </form>
  )
}
