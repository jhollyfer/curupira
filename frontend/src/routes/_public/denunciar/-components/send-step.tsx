import { LIST_LIMITS } from '@curupira/shared'
import type * as React from 'react'
import { Controller, useWatch } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { errorId, invalidProps } from '#/lib/form-a11y'
import { m } from '#/paraglide/messages'

import type { ReportFormValues } from '../-schema'

type SendStepProps = Readonly<{
  form: UseFormReturn<ReportFormValues>
}>

/** The two ways to send; the first is the default and the promise of the service. */
const CHOICES = [
  {
    anonymous: true,
    title: () => m.report_anonymous_title(),
    text: () => m.report_anonymous_text(),
  },
  {
    anonymous: false,
    title: () => m.report_contact_title(),
    text: () => m.report_contact_text(),
  },
] as const

/**
 * Step 3: optional description and who the report is from. Anonymous is on by default;
 * leaving a contact is the resident's choice and reveals one more field.
 */
export function SendStep({ form }: SendStepProps): React.JSX.Element {
  const anonymous = useWatch({ control: form.control, name: 'anonymous' })

  return (
    <div className="flex flex-col gap-6">
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="report-description">
              {m.report_description_label()}
            </FieldLabel>
            <Textarea
              {...field}
              {...invalidProps(fieldState.invalid, 'report-description')}
              id="report-description"
              rows={4}
              maxLength={LIST_LIMITS.REPORT_DESCRIPTION}
              placeholder={m.report_description_placeholder()}
              className="min-h-28 text-base"
            />
            <FieldDescription>{m.report_description_hint()}</FieldDescription>
            {fieldState.invalid && (
              <FieldError id={errorId('report-description')} errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        name="anonymous"
        control={form.control}
        render={({ field }) => (
          <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
            <legend className="mb-3 text-base font-semibold">
              {m.report_who_legend()}
            </legend>
            {CHOICES.map((choice) => (
              <label
                key={choice.title()}
                className="relative flex min-h-20 cursor-pointer flex-col justify-center gap-0.5 rounded-2xl bg-card p-4 shadow-card transition-shadow has-checked:shadow-[0_0_0_3px_var(--primary)] has-focus-visible:shadow-[0_0_0_4px_var(--ring)] motion-reduce:transition-none"
              >
                <input
                  type="radio"
                  name={field.name}
                  checked={field.value === choice.anonymous}
                  onChange={() => field.onChange(choice.anonymous)}
                  className="sr-only"
                />
                <span className="text-lg font-bold">{choice.title()}</span>
                <span className="text-base text-muted-foreground">
                  {choice.text()}
                </span>
              </label>
            ))}
          </fieldset>
        )}
      />

      {!anonymous && (
        <Controller
          name="contact"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="report-contact">
                {m.report_contact_label()}
              </FieldLabel>
              <Input
                {...field}
                {...invalidProps(fieldState.invalid, 'report-contact')}
                id="report-contact"
                autoComplete="tel"
                inputMode="text"
                placeholder={m.report_contact_placeholder()}
                className="h-12 text-base"
              />
              {fieldState.invalid && (
                <FieldError id={errorId('report-contact')} errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )}
    </div>
  )
}
