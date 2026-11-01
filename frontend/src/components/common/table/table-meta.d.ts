import type { CellData, RowData, TableFeatures } from '@tanstack/react-table'

/**
 * What a column may declare beyond TanStack Table's own: the API column it sorts by (the
 * header becomes a link that writes `?sort`), and classes for the cell. Module
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
  }
}
