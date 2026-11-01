import { CalendarBlankIcon } from '@phosphor-icons/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'
import { toast } from 'sonner'

import {
  ConfirmDialog,
  ConfirmDialogCancel,
  ConfirmDialogConfirm,
  ConfirmDialogDescription,
  ConfirmDialogFooter,
  ConfirmDialogHeader,
  ConfirmDialogTitle,
} from '#/components/common/confirm-dialog'
import { OptionSelect } from '#/components/common/option-select'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  PageShellHeader,
} from '#/components/common/page-shell'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { Skeleton } from '#/components/ui/skeleton'
import { DEPENDENTS, queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useInvalidate } from '#/integrations/tanstack-query/invalidate'
import { useManagementScheduleDeleteMutation } from '#/integrations/tanstack-query/mutations/management'
import {
  managementNeighborhoodOptionsQueryOptions,
  managementSchedulesQueryOptions,
} from '#/integrations/tanstack-query/queries/management'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { notifyError } from '#/lib/form-errors'
import { WASTE_TYPE_LABELS, weekdayLabel } from '#/lib/labels'
import { countEntries } from '#/lib/schedule-grid'
import { m } from '#/paraglide/messages'

import { ScheduleDialog, createScheduleDialogHandle } from './schedule-dialog'
import { WeeklyGrid } from './weekly-grid'

const route = getRouteApi('/_private/gestao/schedules/')

export function SchedulesPage(): React.JSX.Element {
  const { neighborhoodId } = route.useSearch()
  const navigate = route.useNavigate()
  const invalidate = useInvalidate()
  const selectId = React.useId()
  const { data: neighborhoods } = useSuspenseQuery(
    managementNeighborhoodOptionsQueryOptions(),
  )
  const schedules = useQuery(managementSchedulesQueryOptions(neighborhoodId))
  const [dialog] = React.useState(createScheduleDialogHandle)
  const [deleteHandle] = React.useState(() =>
    createConfirmHandle<{ id: string; label: string }>(),
  )

  const remove = useManagementScheduleDeleteMutation({
    onError: (error) => notifyError(error, { id: 'schedule-delete' }),
    onSuccess: () => {
      toast.success(m.panel_schedules_removed())
      return invalidate([
        queryKeys.management.schedules.all,
        ...DEPENDENTS.schedules,
      ])
    },
  })

  const entries = schedules.data ?? []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageShellHeader>
        <PageHeader>
          <PageHeaderTitle>{m.panel_schedules_title()}</PageHeaderTitle>
          <PageHeaderDescription>
            {m.panel_schedules_description()}
          </PageHeaderDescription>
        </PageHeader>
      </PageShellHeader>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <OptionSelect
          id={selectId}
          label={m.panel_schedules_neighborhood()}
          allLabel={m.panel_schedules_neighborhood_placeholder()}
          value={neighborhoodId}
          options={neighborhoods.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          onValueChange={(value) =>
            void navigate({ search: { neighborhoodId: value } })
          }
          className="w-full md:w-auto md:min-w-64"
        />
        {neighborhoodId && schedules.isSuccess && (
          <p
            className="text-sm text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {m.panel_schedules_count({ count: countEntries(entries) })}
          </p>
        )}
      </div>

      {!neighborhoodId && (
        <Empty className="rounded-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarBlankIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{m.panel_schedules_choose_title()}</EmptyTitle>
            <EmptyDescription>
              {m.panel_schedules_choose_description()}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {neighborhoodId && schedules.isPending && (
        <Skeleton
          className="h-72 w-full"
          role="status"
          aria-label={m.common_loading()}
        />
      )}

      {neighborhoodId && schedules.isError && (
        <p role="alert" className="rounded-md border p-4 text-sm">
          {m.panel_table_error_title()}
        </p>
      )}

      {neighborhoodId && schedules.isSuccess && (
        <WeeklyGrid
          neighborhoodId={neighborhoodId}
          entries={entries}
          dialog={dialog}
        />
      )}

      <ScheduleDialog
        handle={dialog}
        onDelete={(entry) => {
          dialog.close()
          deleteHandle.openWithPayload({
            id: entry.id,
            label: `${WASTE_TYPE_LABELS[entry.wasteType]()}, ${weekdayLabel(entry.weekday)}`,
          })
        }}
      />

      <ConfirmDialog
        handle={deleteHandle}
        destructive
        onConfirm={(payload) => {
          if (payload) remove.mutate(payload.id)
        }}
      >
        {(payload) => (
          <React.Fragment>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>
                {m.panel_schedules_delete_title({ label: payload.label })}
              </ConfirmDialogTitle>
              <ConfirmDialogDescription>
                {m.panel_schedules_delete_description()}
              </ConfirmDialogDescription>
            </ConfirmDialogHeader>
            <ConfirmDialogFooter>
              <ConfirmDialogCancel />
              <ConfirmDialogConfirm>{m.common_delete()}</ConfirmDialogConfirm>
            </ConfirmDialogFooter>
          </React.Fragment>
        )}
      </ConfirmDialog>
    </div>
  )
}
