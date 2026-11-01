import { FlexRender } from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import type * as React from 'react'

import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { useIsMobile } from '#/hooks/use-mobile'
import { cn } from '#/lib/cn'

import { TableCards } from './table-cards'
import { useTableContext } from './table-context'
import { isRowClick } from './table-row-click'
import { SortHeader } from './table-sort-header'
import type { TableInstance } from './use-table'

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

export function TableGrid<TRow extends RowData>({
  table,
  onRowClick,
  caption,
}: TableGridProps<TRow>): React.JSX.Element | null {
  const { search, isPlaceholderData } = useTableContext('TableGrid')
  const rows = table.getRowModel().rows
  // A phone has no width for five columns: the same rows, columns and sort links are
  // drawn as stacked cards instead of a second table to keep in sync.
  const isMobile = useIsMobile()

  if (rows.length === 0) return null

  if (isMobile) {
    return <TableCards table={table} caption={caption} />
  }

  return (
    <div
      data-slot="table-grid"
      className={cn(
        'relative min-h-0 w-full overflow-auto rounded-md border bg-card transition-opacity duration-150 motion-reduce:transition-none',
        isPlaceholderData && 'opacity-60',
      )}
      aria-busy={isPlaceholderData}
    >
      <TableRoot className="min-w-[34rem]">
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
              onClick={(event) => {
                if (isRowClick(event)) onRowClick?.(row.original)
              }}
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  // On a touch tablet the record link is the 44px target; its padding
                  // grows the hit area without changing the row's look on a mouse.
                  className={cn(
                    'pointer-coarse:[&_a]:inline-block pointer-coarse:[&_a]:py-3.5',
                    cell.column.columnDef.meta?.className,
                  )}
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
