import type { CellData, RowData, TableFeatures } from '@tanstack/react-table'

/**
 * What a column may declare beyond TanStack Table's own: the API column it sorts by (the
 * header becomes a link that writes `?sort`), classes for the cell, and its place in the
 * card layout. Module
 * augmentation, so it needs `interface` - the only place the lint allows it.
 */
declare module '@tanstack/react-table' {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    sortKey?: string
    className?: string
    /**
     * Where the column lands when the table is drawn as stacked cards (a phone):
     * `title` is the card's heading and tap target, `actions` sits at its corner, and
     * `hidden` stays out of the card. Absent, the column is a labelled line of the card.
     */
    card?: 'title' | 'actions' | 'hidden'
  }
}
