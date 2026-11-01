import { REPORT_KINDS, REPORT_STATUSES } from '@curupira/shared'
import { XIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { OptionSelect } from '#/components/common/option-select'
import { Button } from '#/components/ui/button'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { managementNeighborhoodOptionsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { REPORT_KIND_LABELS, REPORT_STATUS_LABELS } from '#/lib/labels'
import { hasReportsFilter } from '#/lib/management-search'
import type { ReportsSearch } from '#/lib/management-search'
import { m } from '#/paraglide/messages'

import { SearchFilter } from '../../../-components/search-filter'

const route = getRouteApi('/_private/gestao/reports/')

/**
 * Every control writes one param of the URL and drops `page` (page 3 of a narrower cut
 * does not exist). Clearing a select reports `undefined`, which removes the key, so the
 * URL carries only what is filtered.
 */
export function ReportsFilters(): React.JSX.Element {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data: neighborhoods } = useSuspenseQuery(
    managementNeighborhoodOptionsQueryOptions(),
  )
  const ids = React.useId()

  function apply(change: Partial<ReportsSearch>): void {
    void navigate({
      search: (previous) => ({ ...previous, ...change, page: undefined }),
    })
  }

  function clear(): void {
    void navigate({ search: {} })
  }

  const filtered = hasReportsFilter(search) || Boolean(search.search)

  return (
    <form
      role="search"
      aria-label={m.panel_reports_filters_label()}
      className="flex shrink-0 flex-wrap items-end gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <OptionSelect
        id={ids.concat('-kind')}
        label={m.panel_reports_filter_kind()}
        allLabel={m.panel_reports_filter_all_kinds()}
        value={search.kind}
        options={REPORT_KINDS.map((kind) => ({
          value: kind,
          label: REPORT_KIND_LABELS[kind](),
        }))}
        onValueChange={(value) => apply({ kind: REPORT_KINDS.find((kind) => kind === value) })}
      />
      <OptionSelect
        id={ids.concat('-neighborhood')}
        label={m.panel_reports_filter_neighborhood()}
        allLabel={m.panel_reports_filter_all_neighborhoods()}
        value={search.neighborhoodId}
        options={neighborhoods.map((item) => ({ value: item.id, label: item.name }))}
        onValueChange={(neighborhoodId) => apply({ neighborhoodId })}
      />
      <OptionSelect
        id={ids.concat('-status')}
        label={m.panel_reports_filter_status()}
        allLabel={m.panel_reports_filter_all_statuses()}
        value={search.status}
        options={REPORT_STATUSES.map((status) => ({
          value: status,
          label: REPORT_STATUS_LABELS[status](),
        }))}
        onValueChange={(value) =>
          apply({ status: REPORT_STATUSES.find((status) => status === value) })
        }
      />

      <Field className="w-auto gap-1.5">
        <FieldLabel htmlFor={ids.concat('-from')} className="text-sm">
          {m.panel_reports_filter_from()}
        </FieldLabel>
        <Input
          id={ids.concat('-from')}
          type="date"
          value={search.from ?? ''}
          max={search.to}
          onChange={(event) => apply({ from: event.target.value || undefined })}
          className="h-9 w-40 text-sm"
        />
      </Field>
      <Field className="w-auto gap-1.5">
        <FieldLabel htmlFor={ids.concat('-to')} className="text-sm">
          {m.panel_reports_filter_to()}
        </FieldLabel>
        <Input
          id={ids.concat('-to')}
          type="date"
          value={search.to ?? ''}
          min={search.from}
          onChange={(event) => apply({ to: event.target.value || undefined })}
          className="h-9 w-40 text-sm"
        />
      </Field>

      <SearchFilter
        id={ids.concat('-search')}
        label={m.panel_reports_filter_search()}
        value={search.search}
        placeholder="CUR-"
        onCommit={(value) => apply({ search: value })}
      />

      {filtered && (
        <Button type="button" variant="ghost" onClick={clear} className="h-9">
          <XIcon aria-hidden="true" data-icon="inline-start" />
          {m.panel_reports_filter_clear()}
        </Button>
      )}
    </form>
  )
}
