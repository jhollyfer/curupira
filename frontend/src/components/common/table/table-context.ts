import * as React from 'react'

import type { ListSearch } from '#/lib/list-search'

export type TableContextValue = {
  /** The listing's own route, for the sort and pagination links. */
  to: string
  search: ListSearch
  /** A new page is loading over the old one: dim the rows instead of blanking them. */
  isPlaceholderData: boolean
  isError: boolean
  onRetry?: () => void
}

const TableContext = React.createContext<TableContextValue | null>(null)

export const TableProvider = TableContext.Provider

export function useTableContext(consumer: string): TableContextValue {
  const context = React.use(TableContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`Table\``)
  }

  return context
}
