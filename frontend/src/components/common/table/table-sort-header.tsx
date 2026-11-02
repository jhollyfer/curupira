import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsDownUpIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { FlexRender } from '@tanstack/react-table'
import type { Header, RowData } from '@tanstack/react-table'
import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useTableContext } from './table-context'
import type { TableFeaturesOfPanel } from './use-table'

/**
 * Sorting is a link, not a button with state: it writes `?sort=&direction=` into the
 * URL (so F5 and a shared link keep the order) and drops `page`, because page 4 of
 * another order is not the page the manager was looking at. Asc, then desc, then back to
 * the default order.
 */
export function SortHeader<TRow extends RowData>({
  header,
  className,
}: Readonly<{
  header: Header<TableFeaturesOfPanel, TRow, unknown>
  className?: string
}>): React.JSX.Element {
  const { to, search } = useTableContext('TableGrid')
  const sortKey = header.column.columnDef.meta?.sortKey
  const content = <FlexRender header={header} />

  if (!sortKey) return content

  const active = search.sort === sortKey
  const direction = search.direction ?? 'asc'
  let next: { sort?: string; direction?: 'asc' | 'desc' } = {
    sort: sortKey,
    direction: 'asc',
  }
  if (active && direction === 'asc') next = { sort: sortKey, direction: 'desc' }
  if (active && direction === 'desc') next = {}

  return (
    <Link
      to={to}
      search={{ ...search, ...next, page: undefined }}
      className={cn(
        '-mx-2 inline-flex min-h-8 pointer-coarse:min-h-11 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      {content}
      {!active && (
        <ArrowsDownUpIcon aria-hidden="true" className="size-3.5 opacity-50" />
      )}
      {active && direction === 'asc' && (
        <ArrowUpIcon aria-hidden="true" className="size-3.5" />
      )}
      {active && direction === 'desc' && (
        <ArrowDownIcon aria-hidden="true" className="size-3.5" />
      )}
      <span className="sr-only">{m.panel_table_sort_by()}</span>
    </Link>
  )
}
