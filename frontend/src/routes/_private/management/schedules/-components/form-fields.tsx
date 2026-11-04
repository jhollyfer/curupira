import { COLLECTION_SHIFTS, WASTE_TYPES } from '@curupira/shared'
import type { ManagementScheduleCreatePayload } from '@curupira/shared'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { OptionSelectControl } from '#/components/common/option-select'
import { FieldGroup } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { AppField } from '#/integrations/react-hook-form/app-field'
import {
  COLLECTION_SHIFT_LABELS,
  WASTE_TYPE_LABELS,
  weekdayLabel,
} from '#/lib/labels'
import { GRID_WEEKDAYS } from '#/lib/schedule-grid'
import { m } from '#/paraglide/messages'

export type ScheduleFormValues = ManagementScheduleCreatePayload

/**
 * `weekday` is in the list because the API's 409 (`SCHEDULE_ALREADY_EXISTS`) points at it:
 * a slot is taken by (neighborhood, type, day, shift), and the day is the field the
 * manager changes to get out of the conflict.
 */
export const SCHEDULE_FIELDS = [
  'neighborhoodId',
  'wasteType',
  'weekday',
  'shift',
  'note',
] as const

type ScheduleFormFieldsProps = Readonly<{
  form: UseFormReturn<ScheduleFormValues>
  idPrefix: string
}>

export function ScheduleFormFields({
  form,
  idPrefix,
}: ScheduleFormFieldsProps): React.JSX.Element {
  return (
    <FieldGroup>
      <AppField
        control={form.control}
        name="wasteType"
        id={idPrefix.concat('-type')}
        label={m.panel_schedules_field_type()}
      >
        {({ field, control }) => (
          <OptionSelectControl
            {...control}
            value={field.value}
            onBlur={field.onBlur}
            options={WASTE_TYPES.map((type) => ({
              value: type,
              label: WASTE_TYPE_LABELS[type](),
            }))}
            onValueChange={(value) =>
              field.onChange(WASTE_TYPES.find((type) => type === value))
            }
          />
        )}
      </AppField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AppField
          control={form.control}
          name="weekday"
          id={idPrefix.concat('-weekday')}
          label={m.panel_schedules_field_weekday()}
        >
          {({ field, control }) => (
            <OptionSelectControl
              {...control}
              value={field.value}
              onBlur={field.onBlur}
              options={GRID_WEEKDAYS.map((day) => ({
                value: day,
                label: weekdayLabel(day),
              }))}
              onValueChange={(value) =>
                field.onChange(GRID_WEEKDAYS.find((day) => day === value))
              }
            />
          )}
        </AppField>
        <AppField
          control={form.control}
          name="shift"
          id={idPrefix.concat('-shift')}
          label={m.panel_schedules_field_shift()}
        >
          {({ field, control }) => (
            <OptionSelectControl
              {...control}
              value={field.value}
              onBlur={field.onBlur}
              options={COLLECTION_SHIFTS.map((shift) => ({
                value: shift,
                label: COLLECTION_SHIFT_LABELS[shift](),
              }))}
              onValueChange={(value) =>
                field.onChange(
                  COLLECTION_SHIFTS.find((shift) => shift === value),
                )
              }
            />
          )}
        </AppField>
      </div>

      <AppField
        control={form.control}
        name="note"
        id={idPrefix.concat('-note')}
        label={m.panel_schedules_field_note()}
      >
        {({ field, control }) => (
          <Input
            {...control}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value || null)}
            maxLength={200}
            placeholder={m.panel_schedules_field_note_placeholder()}
            className="h-11 text-sm sm:h-10"
          />
        )}
      </AppField>
    </FieldGroup>
  )
}
