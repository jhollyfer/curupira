import {
  tableFeatures,
  useTable as useTableRoot,
} from '@tanstack/react-table'
import type { ColumnDef, RowData } from '@tanstack/react-table'

/**
 * The panel's tables are server-driven: filtering, sorting and pagination live in the URL
 * and in the API, so the table needs none of TanStack Table's client features - no
 * sorted/filtered/paginated row models, no visibility or resizing. `tableFeatures({})`
 * is the honest declaration of that (features are opt-in in v9), and it keeps the bundle
 * to the core. When a screen needs column visibility, it is added here once.
 * _doc-lib/tanstack-table.md (features are opt-in).
 */
export const features = tableFeatures({})

export type TableFeaturesOfPanel = typeof features

export type TableColumns<TRow extends RowData> = Array<
  ColumnDef<TableFeaturesOfPanel, TRow>
>

type UseTableOptions<TRow extends RowData> = Readonly<{
  rows: ReadonlyArray<TRow>
  columns: TableColumns<TRow>
  getRowId: (row: TRow) => string
}>

export function useTable<TRow extends RowData>({
  rows,
  columns,
  getRowId,
}: UseTableOptions<TRow>) {
  return useTableRoot({ features, data: rows, columns, getRowId })
}

export type TableInstance<TRow extends RowData> = ReturnType<
  typeof useTable<TRow>
>
