import type { PaginationMeta } from '@curupira/shared'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as React from 'react'

import { PageShellFooter } from '#/components/common/page-shell'
import { Button } from '#/components/ui/button'
import { Field, FieldLabel } from '#/components/ui/field'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { m } from '#/paraglide/messages'

import { useTableContext } from './table-context'

const PER_PAGE_OPTIONS = [10, 20, 50]

function pageParam(page: number): number | undefined {
  if (page <= 1) return undefined

  return page
}

export function TablePagination({
  meta,
}: Readonly<{ meta: PaginationMeta | undefined }>): React.JSX.Element | null {
  const { to, search } = useTableContext('TablePagination')
  const navigate = useNavigate()
  const perPageId = React.useId()

  if (!meta) return null

  const { currentPage, lastPage, total } = meta
  const isFirst = currentPage <= 1
  const isLast = currentPage >= lastPage

  return (
    <PageShellFooter data-slot="table-pagination">
      <nav
        aria-label={m.panel_table_pagination()}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-4">
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel htmlFor={perPageId} className="flex-none text-sm">
              {m.panel_table_per_page()}
            </FieldLabel>
            <NativeSelect
              id={perPageId}
              value={String(meta.perPage)}
              onChange={(event) =>
                void navigate({
                  to,
                  search: {
                    ...search,
                    perPage: Number(event.target.value),
                    page: undefined,
                  },
                })
              }
              className="w-20"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={String(option)}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <p className="text-sm text-muted-foreground tabular-nums">
            {m.panel_table_total({ total })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm tabular-nums" aria-live="polite">
            {m.panel_table_page({ current: currentPage, last: lastPage })}
          </p>
          <Button
            variant="outline"
            size="icon"
            disabled={isFirst}
            aria-label={m.panel_table_previous()}
            render={
              <Link
                to={to}
                search={{ ...search, page: pageParam(currentPage - 1) }}
                disabled={isFirst}
              />
            }
          >
            <CaretLeftIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={isLast}
            aria-label={m.panel_table_next()}
            render={
              <Link
                to={to}
                search={{ ...search, page: pageParam(currentPage + 1) }}
                disabled={isLast}
              />
            }
          >
            <CaretRightIcon aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </PageShellFooter>
  )
}
