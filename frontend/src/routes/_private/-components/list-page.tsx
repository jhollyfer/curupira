import type { Paginated } from '@curupira/shared'
import { PlusIcon } from '@phosphor-icons/react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import type { RowData } from '@tanstack/react-table'
import type * as React from 'react'

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '#/components/common/empty-state'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  PageShellHeader,
} from '#/components/common/page-shell'
import {
  Table,
  TableContent,
  TableGrid,
  TablePagination,
} from '#/components/common/table'
import type { TableInstance } from '#/components/common/table'
import { Button } from '#/components/ui/button'
import type { ListSearch } from '#/lib/list-search'

type ListPageProps<TRow extends RowData> = Readonly<{
  /** The listing's own route, for the sort and pagination links. */
  to: string
  search: ListSearch
  title: string
  description: string
  query: UseQueryResult<Paginated<TRow>>
  table: TableInstance<TRow>
  /** Whether the empty result is "nothing yet" or "nothing matches the filters". */
  filtered: boolean
  emptyTitle: string
  emptyDescription: string
  /** The "new" button; absent on a listing nobody creates in. */
  create?: Readonly<{ to: LinkProps['to']; label: string }>
  filters?: React.ReactNode
  onRowClick?: (row: TRow) => void
}>

/**
 * The shared skeleton of the panel's tables - header with the create button, the filters
 * row, the grid, the empty and error states and the pagination. Notices, neighborhoods
 * and accounts differ in columns, filters and actions, never in this structure, so it
 * lives once instead of three times with three chances to forget the error state.
 */
export function ListPage<TRow extends RowData>({
  to,
  search,
  title,
  description,
  query,
  table,
  filtered,
  emptyTitle,
  emptyDescription,
  create,
  filters,
  onRowClick,
}: ListPageProps<TRow>): React.JSX.Element {
  const isEmpty = query.isSuccess && query.data.data.length === 0
  let reason: 'empty' | 'filtered' = 'empty'
  if (filtered) reason = 'filtered'

  return (
    <Table
      to={to}
      search={search}
      isPlaceholderData={query.isPlaceholderData}
      isError={query.isError}
      onRetry={() => void query.refetch()}
    >
      <PageShellHeader>
        <PageHeader>
          <PageHeaderTitle>{title}</PageHeaderTitle>
          <PageHeaderDescription>{description}</PageHeaderDescription>
          {create && (
            <PageHeaderActions>
              <Button render={<Link to={create.to} />}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                {create.label}
              </Button>
            </PageHeaderActions>
          )}
        </PageHeader>
      </PageShellHeader>

      {filters}

      <TableContent>
        <TableGrid table={table} caption={title} onRowClick={onRowClick} />
        {isEmpty && (
          <EmptyState reason={reason}>
            <EmptyStateTitle>{emptyTitle}</EmptyStateTitle>
            <EmptyStateDescription>{emptyDescription}</EmptyStateDescription>
            {create && (
              <EmptyStateActions>
                <Button render={<Link to={create.to} />}>{create.label}</Button>
              </EmptyStateActions>
            )}
          </EmptyState>
        )}
      </TableContent>
      <TablePagination meta={query.data?.meta} />
    </Table>
  )
}
