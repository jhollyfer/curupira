import { FlexRender } from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useTableContext } from './table-context'
import { SortHeader } from './table-sort-header'
import type { TableInstance } from './use-table'

type TableCardsProps<TRow extends RowData> = Readonly<{
  table: TableInstance<TRow>
  caption: string
}>

/**
 * The table as a list of cards, for a phone. It reads the same `table` instance as the
 * grid - same columns, same cells, same sort links - so a new column appears in both
 * without a second definition to forget. Per column, `meta.card` says where it goes:
 * `title` is the heading (and the 44px tap target, usually the record's link), `actions`
 * is the corner menu, `hidden` stays out, and anything else is a "label: value" line.
 *
 * A list, not a table: the cards have no column to align, and a screen reader announces
 * "list, 10 items" instead of a grid it cannot navigate by column. The whole card is
 * the tap target the way the row is on the desktop, but through a stretched link (the
 * title's `::after` covers the card) rather than a click handler on the `<li>`: the real
 * link stays the one keyboard and screen-reader path, and the actions menu sits above
 * it (`z-1`) so its taps are not swallowed.
 *
 * `data-slot="table-mobile-cards"` is what `PageShell` looks for to hand the scroll to
 * the page: a card list inside a half-screen scroll box was a scroll inside a scroll.
 */
export function TableCards<TRow extends RowData>({
  table,
  caption,
}: TableCardsProps<TRow>): React.JSX.Element {
  const { isPlaceholderData } = useTableContext('TableCards')
  const headers = table.getHeaderGroups().flatMap((group) => group.headers)
  const sortable = headers.filter(
    (header) => header.column.columnDef.meta?.sortKey,
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 transition-opacity duration-150 motion-reduce:transition-none',
        { 'opacity-60': isPlaceholderData },
      )}
      aria-busy={isPlaceholderData}
    >
      {sortable.length > 0 && (
        <div
          role="group"
          aria-label={m.panel_table_sort_group()}
          className="flex flex-wrap items-center gap-2"
        >
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            {m.panel_table_sort_group()}
          </span>
          {sortable.map((header) => (
            <SortHeader
              key={header.id}
              header={header}
              className="mx-0 min-h-11 border bg-card px-3 text-sm"
            />
          ))}
        </div>
      )}

      <ul
        data-slot="table-mobile-cards"
        aria-label={caption}
        className="flex flex-col gap-3"
      >
        {table.getRowModel().rows.map((row) => {
          const cells = row.getAllCells()
          const placed = (place: 'title' | 'actions') =>
            cells.filter((cell) => cell.column.columnDef.meta?.card === place)
          const fields = cells.filter((cell) => {
            const place = cell.column.columnDef.meta?.card

            return place === undefined
          })

          return (
            <li
              key={row.id}
              className="relative flex flex-col gap-3 rounded-md border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 text-base font-medium [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:overflow-visible [&_a]:text-base [&_a]:whitespace-normal [&_a]:after:absolute [&_a]:after:inset-0 [&_a]:after:content-['']">
                  {placed('title').map((cell) => (
                    <FlexRender key={cell.id} cell={cell} />
                  ))}
                </div>
                <div className="relative z-1 -mt-1 -mr-2 shrink-0">
                  {placed('actions').map((cell) => (
                    <FlexRender key={cell.id} cell={cell} />
                  ))}
                </div>
              </div>

              <dl className="flex flex-col gap-2 text-sm">
                {fields.map((cell) => {
                  const header = headers.find(
                    (item) => item.column.id === cell.column.id,
                  )

                  return (
                    <div
                      key={cell.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <dt className="shrink-0 text-xs text-muted-foreground">
                        {header && <FlexRender header={header} />}
                      </dt>
                      <dd className="min-w-0 text-right">
                        <FlexRender cell={cell} />
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
