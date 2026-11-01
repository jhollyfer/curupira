import type { Merge } from '@curupira/shared'
import * as React from 'react'

import { PageShell } from '#/components/common/page-shell'
import type { ListSearch } from '#/lib/list-search'

import { TableProvider } from './table-context'

type TableProps = Readonly<
  Merge<
    Omit<React.ComponentProps<typeof PageShell>, 'to' | 'search'>,
    {
      to: string
      search: ListSearch
      isPlaceholderData?: boolean
      isError?: boolean
      onRetry?: () => void
    }
  >
>

/**
 * The listing's context: where the sort and pagination links point (`to`) and the
 * filters they must carry (`search`). Compound, like the rest of the kit: the parts
 * (`TableGrid`, `TablePagination`...) read this instead of taking five props each.
 */
export function Table({
  to,
  search,
  isPlaceholderData = false,
  isError = false,
  onRetry,
  children,
  ...rest
}: TableProps): React.JSX.Element {
  const value = { to, search, isPlaceholderData, isError, onRetry }

  return (
    <TableProvider value={value}>
      <PageShell data-slot="table" {...rest}>
        {children}
      </PageShell>
    </TableProvider>
  )
}
