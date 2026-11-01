import type { ManagementNeighborhoodCreatePayload } from '@curupira/shared'
import { MapPinIcon, XIcon } from '@phosphor-icons/react'
import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { ReportMap, ReportMapPicker } from '#/components/common/report-map'
import { Button } from '#/components/ui/button'
import { FieldDescription, FieldGroup } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { AppField } from '#/integrations/react-hook-form/app-field'
import { toCoordinate } from '#/lib/geo'
import type { Coordinate } from '#/lib/geo'
import { m } from '#/paraglide/messages'

export type NeighborhoodFormValues = ManagementNeighborhoodCreatePayload

export const NEIGHBORHOOD_FIELDS = ['name', 'latitude', 'longitude'] as const

/** An empty box is "no center" (`null`), not `0`: zero latitude is a real place. */
function numberOrNull(text: string): number | null {
  if (text.trim() === '') return null

  const parsed = Number(text)
  if (Number.isNaN(parsed)) return null

  return parsed
}

type NeighborhoodFormFieldsProps = Readonly<{
  form: UseFormReturn<NeighborhoodFormValues>
  idPrefix: string
}>

/**
 * Name, and the optional center. The center is chosen on the map (a click, or dragging the
 * pin) and mirrored into the two number fields, which stay editable for a manager who has
 * the coordinates; the API wants both or none, so "clear" empties both at once.
 */
export function NeighborhoodFormFields({
  form,
  idPrefix,
}: NeighborhoodFormFieldsProps): React.JSX.Element {
  const latitude = form.watch('latitude')
  const longitude = form.watch('longitude')
  const center = toCoordinate(latitude ?? undefined, longitude ?? undefined)

  function pick(coordinate: Coordinate): void {
    const options = { shouldDirty: true, shouldValidate: true }
    form.setValue('latitude', Number(coordinate.latitude.toFixed(6)), options)
    form.setValue('longitude', Number(coordinate.longitude.toFixed(6)), options)
  }

  function clearCenter(): void {
    const options = { shouldDirty: true, shouldValidate: true }
    form.setValue('latitude', null, options)
    form.setValue('longitude', null, options)
  }

  return (
    <FieldGroup>
      <AppField
        control={form.control}
        name="name"
        id={idPrefix.concat('-name')}
        label={m.panel_neighborhoods_field_name()}
      >
        {({ field, control }) => (
          <Input
            {...field}
            {...control}
            maxLength={80}
            className="h-10 text-sm"
          />
        )}
      </AppField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AppField
          control={form.control}
          name="latitude"
          id={idPrefix.concat('-latitude')}
          label={m.panel_neighborhoods_field_latitude()}
        >
          {({ field, control }) => (
            <Input
              {...control}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              type="number"
              step="any"
              inputMode="decimal"
              value={field.value ?? ''}
              onChange={(event) =>
                field.onChange(numberOrNull(event.target.value))
              }
              className="h-10 text-sm tabular-nums"
            />
          )}
        </AppField>
        <AppField
          control={form.control}
          name="longitude"
          id={idPrefix.concat('-longitude')}
          label={m.panel_neighborhoods_field_longitude()}
        >
          {({ field, control }) => (
            <Input
              {...control}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              type="number"
              step="any"
              inputMode="decimal"
              value={field.value ?? ''}
              onChange={(event) =>
                field.onChange(numberOrNull(event.target.value))
              }
              className="h-10 text-sm tabular-nums"
            />
          )}
        </AppField>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MapPinIcon aria-hidden="true" className="size-4" />
            {m.panel_neighborhoods_map_title()}
          </p>
          {center && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCenter}
            >
              <XIcon aria-hidden="true" data-icon="inline-start" />
              {m.panel_neighborhoods_map_clear()}
            </Button>
          )}
        </div>
        <ReportMap
          label={m.panel_neighborhoods_map_label()}
          center={center}
          className="h-72 rounded-md border shadow-none"
        >
          <React.Suspense fallback={null}>
            <ReportMapPicker value={center} onChange={pick} kind="OTHER" />
          </React.Suspense>
        </ReportMap>
        <FieldDescription>{m.panel_neighborhoods_map_hint()}</FieldDescription>
      </div>
    </FieldGroup>
  )
}
