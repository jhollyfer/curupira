import type { ReportKind } from '@curupira/shared'
import type * as React from 'react'
import { Controller, useWatch } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { errorDescribedBy, errorId } from '#/lib/form-a11y'
import { toCoordinate } from '#/lib/geo'
import { m } from '#/paraglide/messages'

import type { ReportFormValues } from '../-schema'
import { LocationField } from './location-field'
import { PhotoField } from './photo-field'

type EvidenceStepProps = Readonly<{
  form: UseFormReturn<ReportFormValues>
  kind: ReportKind | undefined
}>

/**
 * Step 2: the photo and the place. Both are required to continue. From `lg` they sit side
 * by side: the photo on the left, the map on the right at a size you can actually place a
 * pin on, instead of a 288px strip under the photos.
 */
export function EvidenceStep({
  form,
  kind,
}: EvidenceStepProps): React.JSX.Element {
  const [latitude, longitude] = useWatch({
    control: form.control,
    name: ['latitude', 'longitude'],
  })
  const placed = toCoordinate(latitude, longitude)

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-10">
      <Controller
        name="photos"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{m.report_photo_label()}</FieldLabel>
            <PhotoField
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              describedBy={errorDescribedBy(fieldState.invalid, field.name)}
            />
            {fieldState.invalid && (
              <FieldError
                id={errorId(field.name)}
                errors={[fieldState.error]}
              />
            )}
          </Field>
        )}
      />

      <Controller
        name="latitude"
        control={form.control}
        render={({ fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{m.report_location_label()}</FieldLabel>
            <LocationField
              value={placed}
              kind={kind ?? 'OTHER'}
              invalid={fieldState.invalid}
              onChange={(coordinate) => {
                form.setValue('latitude', coordinate.latitude, {
                  shouldValidate: true,
                  shouldTouch: true,
                })
                form.setValue('longitude', coordinate.longitude, {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }}
            />
          </Field>
        )}
      />
    </div>
  )
}
