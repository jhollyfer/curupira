import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { FlexRender } from '@tanstack/react-table'
import type { Header, RowData } from '@tanstack/react-table'
import type * as React from 'react'

import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useTableContext } from './table-context'
import type { TableFeaturesOfPanel, TableInstance } from './use-table'

type TableGridProps<TRow extends RowData> = Readonly<{
  table: TableInstance<TRow>
  /** Makes the row a link-like target; the cell with the actions stops the click. */
  onRowClick?: (row: TRow) => void
  /** The table's accessible name (a `<caption>` kept for screen readers). */
  caption: string
}>

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
} as const

/**
 * Sorting is a link, not a button with state: it writes `?sort=&direction=` into the
 * URL (so F5 and a shared link keep the order) and drops `page`, because page 4 of
 * another order is not the page the manager was looking at. Asc, then desc, then back to
 * the default order.
 */
function SortHeader<TRow extends RowData>({
  header,
}: Readonly<{
  header: Header<TableFeaturesOfPanel, TRow, unknown>
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
      className="-mx-2 inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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

export function TableGrid<TRow extends RowData>({
  table,
  onRowClick,
  caption,
}: TableGridProps<TRow>): React.JSX.Element | null {
  const { search, isPlaceholderData } = useTableContext('TableGrid')
  const rows = table.getRowModel().rows

  if (rows.length === 0) return null

  return (
    <div
      data-slot="table-grid"
      className={cn(
        'relative min-h-0 w-full flex-1 overflow-auto rounded-md border bg-card transition-opacity duration-150 motion-reduce:transition-none',
        isPlaceholderData && 'opacity-60',
      )}
      aria-busy={isPlaceholderData}
    >
      <TableRoot className="min-w-[40rem]">
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="sticky top-0 z-sticky bg-card">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sortKey = header.column.columnDef.meta?.sortKey
                let ariaSort: 'ascending' | 'descending' | undefined
                if (sortKey && search.sort === sortKey)
                  ariaSort = ARIA_SORT[search.direction ?? 'asc']

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={ariaSort}
                    className={header.column.columnDef.meta?.className}
                  >
                    {!header.isPlaceholder && <SortHeader header={header} />}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(onRowClick && 'cursor-pointer')}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.columnDef.meta?.className}
                >
                  <FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableRoot>
    </div>
  )
}
