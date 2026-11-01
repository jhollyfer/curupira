import { ArrowClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { PageShellContent } from '#/components/common/page-shell'
import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { m } from '#/paraglide/messages'

import { useTableContext } from './table-context'

/**
 * The scroll area of a listing, and the place where a failed load is drawn: the toolbar
 * and the filters stay usable around the error, so the manager can change the filter
 * that probably caused it instead of facing a blank page.
 */
export function TableContent({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { isError, onRetry } = useTableContext('TableContent')

  if (isError) {
    return (
      <PageShellContent data-slot="table-content">
        <Empty role="alert">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{m.panel_table_error_title()}</EmptyTitle>
            <EmptyDescription>
              {m.panel_table_error_description()}
            </EmptyDescription>
          </EmptyHeader>
          {onRetry && (
            <EmptyContent>
              <Button variant="outline" onClick={onRetry}>
                <ArrowClockwiseIcon aria-hidden="true" />
                {m.common_retry()}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </PageShellContent>
    )
  }

  return (
    <PageShellContent data-slot="table-content">{children}</PageShellContent>
  )
}
