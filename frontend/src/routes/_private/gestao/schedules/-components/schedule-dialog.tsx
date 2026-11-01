import { ManagementScheduleCreateValidator } from '@curupira/shared'
import type {
  ManagementScheduleShowResponse,
  Merge,
  WasteType,
  Weekday,
} from '@curupira/shared'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { SubmitButton } from '#/components/common/submit-button'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { DEPENDENTS, queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useMutationForm } from '#/hooks/use-mutation-form'
import { AppFormRootError } from '#/integrations/react-hook-form/app-field'
import {
  useManagementScheduleCreateMutation,
  useManagementScheduleUpdateMutation,
} from '#/integrations/tanstack-query/mutations/management'
import type { ScheduleUpdateVariables } from '#/integrations/tanstack-query/mutations/management'
import { cn } from '#/lib/cn'
import { createDialogHandle } from '#/lib/dialog-handle'
import type { DialogHandle } from '#/lib/dialog-handle'
import { PHONE_SHEET_CLASSES } from '#/lib/dialog-layout'
import { weekdayLabel, WASTE_TYPE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { SCHEDULE_FIELDS, ScheduleFormFields } from './form-fields'
import type { ScheduleFormValues } from './form-fields'

/** What opens the dialog: an empty cell of the grid, or an existing collection. */
export type ScheduleDialogPayload =
  | Readonly<{
      mode: 'create'
      neighborhoodId: string
      wasteType: WasteType
      weekday: Weekday
    }>
  | Readonly<{ mode: 'edit'; entry: ManagementScheduleShowResponse }>

export type ScheduleDialogHandle = DialogHandle<ScheduleDialogPayload>

export function createScheduleDialogHandle(): ScheduleDialogHandle {
  return createDialogHandle<ScheduleDialogPayload>()
}

const INVALIDATE = [queryKeys.management.schedules.all, ...DEPENDENTS.schedules]

type FormProps = Readonly<{
  handle: ScheduleDialogHandle
  /** Opens the delete confirmation; only the edit form has the button. */
  onDelete?: () => void
  defaults: ScheduleFormValues
  title: string
  description: string
  idPrefix: string
}>

/**
 * The dialog's body is a form that **mounts when the dialog opens** (the content of a
 * Base UI dialog unmounts on close), so every opening starts from the cell that was
 * clicked and nothing leaks from the previous one.
 */
function ScheduleFormBody({
  form,
  onSubmit,
  isPending,
  handle,
  onDelete,
  title,
  description,
  idPrefix,
}: Merge<
  Omit<FormProps, 'defaults'>,
  {
    form: UseFormReturn<ScheduleFormValues>
    onSubmit: (event?: React.BaseSyntheticEvent) => void
    isPending: boolean
  }
>): React.JSX.Element {
  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <ScheduleFormFields form={form} idPrefix={idPrefix} />
      <AppFormRootError form={form} />
      <DialogFooter className="sm:justify-between">
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            className="max-sm:w-full"
            onClick={onDelete}
          >
            {m.common_delete()}
          </Button>
        )}
        <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="max-sm:w-full"
            onClick={() => handle.close()}
          >
            {m.common_cancel()}
          </Button>
          <SubmitButton isPending={isPending} className="max-sm:w-full">
            {m.common_save()}
          </SubmitButton>
        </div>
      </DialogFooter>
    </form>
  )
}

function CreateForm({
  handle,
  defaults,
  ...text
}: Omit<FormProps, 'onDelete'>): React.JSX.Element {
  const { form, mutation, onSubmit } = useMutationForm<
    ScheduleFormValues,
    ManagementScheduleShowResponse,
    ScheduleFormValues
  >({
    validator: ManagementScheduleCreateValidator,
    defaults,
    fields: SCHEDULE_FIELDS,
    mutation: useManagementScheduleCreateMutation,
    invalidate: INVALIDATE,
    success: m.panel_schedules_saved(),
    // The 409 on a repeated slot makes a resend after a 5xx safe: it cannot create two.
    retry: 'schedule-create-error',
    payload: (values) => values,
    onSuccess: () => handle.close(),
  })

  return (
    <ScheduleFormBody
      {...text}
      handle={handle}
      form={form}
      onSubmit={onSubmit}
      isPending={mutation.isPending}
    />
  )
}

function EditForm({
  handle,
  defaults,
  entryId,
  onDelete,
  ...text
}: Merge<FormProps, { entryId: string }>): React.JSX.Element {
  const { form, mutation, onSubmit } = useMutationForm<
    ScheduleFormValues,
    ManagementScheduleShowResponse,
    ScheduleUpdateVariables
  >({
    validator: ManagementScheduleCreateValidator,
    defaults,
    fields: SCHEDULE_FIELDS,
    mutation: useManagementScheduleUpdateMutation,
    invalidate: INVALIDATE,
    success: m.panel_schedules_saved(),
    retry: 'schedule-update-error',
    payload: (values) => ({ ...values, id: entryId }),
    onSuccess: () => handle.close(),
  })

  return (
    <ScheduleFormBody
      {...text}
      handle={handle}
      onDelete={onDelete}
      form={form}
      onSubmit={onSubmit}
      isPending={mutation.isPending}
    />
  )
}

type ScheduleDialogProps = Readonly<{
  handle: ScheduleDialogHandle
  onDelete: (entry: ManagementScheduleShowResponse) => void
}>

export function ScheduleDialog({
  handle,
  onDelete,
}: ScheduleDialogProps): React.JSX.Element {
  return (
    <Dialog handle={handle}>
      {({ payload }) => (
        <DialogContent className={cn(PHONE_SHEET_CLASSES, 'sm:max-w-md')}>
          {payload?.mode === 'create' && (
            <CreateForm
              handle={handle}
              idPrefix="schedule-create"
              title={m.panel_schedules_dialog_create()}
              description={m.panel_schedules_dialog_create_description({
                type: WASTE_TYPE_LABELS[payload.wasteType](),
                day: weekdayLabel(payload.weekday),
              })}
              defaults={{
                neighborhoodId: payload.neighborhoodId,
                wasteType: payload.wasteType,
                weekday: payload.weekday,
                shift: 'MORNING',
                note: null,
              }}
            />
          )}
          {payload?.mode === 'edit' && (
            <EditForm
              handle={handle}
              idPrefix="schedule-update"
              entryId={payload.entry.id}
              title={m.panel_schedules_dialog_edit()}
              description={m.panel_schedules_dialog_edit_description({
                neighborhood: payload.entry.neighborhoodName,
              })}
              defaults={{
                neighborhoodId: payload.entry.neighborhoodId,
                wasteType: payload.entry.wasteType,
                weekday: payload.entry.weekday,
                shift: payload.entry.shift,
                note: payload.entry.note,
              }}
              onDelete={() => onDelete(payload.entry)}
            />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
