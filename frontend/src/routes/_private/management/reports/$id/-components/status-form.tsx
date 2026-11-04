import {
  LIST_LIMITS,
  ManagementReportUpdateStatusValidator,
} from '@curupira/shared'
import type {
  ManagementReportShowResponse,
  ReportStatus,
} from '@curupira/shared'
import { LockSimpleIcon } from '@phosphor-icons/react'
import * as React from 'react'
import { Controller } from 'react-hook-form'

import { SubmitButton } from '#/components/common/submit-button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '#/components/ui/field'
import { Textarea } from '#/components/ui/textarea'
import { DEPENDENTS, queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useMutationForm } from '#/hooks/use-mutation-form'
import {
  AppField,
  AppFormRootError,
} from '#/integrations/react-hook-form/app-field'
import { useManagementReportStatusMutation } from '#/integrations/tanstack-query/mutations/management'
import type { ReportStatusVariables } from '#/integrations/tanstack-query/mutations/management'
import { errorId, invalidProps } from '#/lib/form-a11y'
import { REPORT_STATUS_ICONS } from '#/lib/icons'
import { REPORT_STATUS_LABELS } from '#/lib/labels'
import { isFinal, statusOptions } from '#/lib/report-status'
import type { StatusBlock } from '#/lib/report-status'
import { m } from '#/paraglide/messages'

type FormValues = Readonly<{ status: ReportStatus; message?: string }>

const FIELDS = ['status', 'message'] as const

/** Why an option is disabled, in words: a greyed radio with no reason is a dead end. */
const BLOCK_REASONS = {
  current: () => m.panel_report_status_blocked_current(),
  regression: () => m.panel_report_status_blocked_regression(),
} satisfies Record<StatusBlock, () => string>

type StatusFormProps = Readonly<{
  report: ManagementReportShowResponse
}>

/**
 * Moves the report forward and writes the response the resident reads on the tracking
 * page. **Only forward**: the options that go back (or repeat) are disabled *and say why*
 * (`BLOCK_REASONS`), mirroring the backend's `REPORT_STATUS_REGRESSION`.
 *
 * Keyed by the current status in the parent: after a save the report changed, so the form
 * remounts with the next default instead of keeping a stale selection.
 */
export function StatusForm({ report }: StatusFormProps): React.JSX.Element {
  const options = statusOptions(report.status)
  const nextOption = options.find((option) => !option.blocked)
  const baseId = React.useId()

  const { form, mutation, onSubmit } = useMutationForm<
    FormValues,
    ManagementReportShowResponse,
    ReportStatusVariables
  >({
    validator: ManagementReportUpdateStatusValidator,
    defaults: { status: nextOption?.status ?? report.status, message: '' },
    fields: FIELDS,
    mutation: useManagementReportStatusMutation,
    invalidate: [queryKeys.management.reports.all, ...DEPENDENTS.reports],
    success: m.panel_report_status_saved(),
    // An edit of status is safe to resend: moving to the same target twice is refused
    // by the 422 rule, never applied twice.
    retry: 'report-status-error',
    payload: ({ status, message }) => {
      if (!message) return { id: report.id, status }

      return { id: report.id, status, message }
    },
  })

  if (isFinal(report.status)) {
    return (
      <p className="flex items-start gap-3 rounded-md border bg-muted/50 p-4 text-sm">
        <LockSimpleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {m.panel_report_status_final()}
      </p>
    )
  }

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      aria-label={m.panel_report_status_form()}
    >
      <FieldGroup>
        <Controller
          name="status"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">
                {m.panel_report_status_legend()}
              </FieldLegend>
              <div
                role="radiogroup"
                aria-label={m.panel_report_status_legend()}
                {...invalidProps(fieldState.invalid, baseId)}
                className="flex flex-col gap-2"
              >
                {options.map((option) => {
                  const Icon = REPORT_STATUS_ICONS[option.status]
                  const optionId = baseId.concat('-', option.status)
                  const reasonId = optionId.concat('-reason')
                  const blocked = option.blocked

                  return (
                    <label
                      key={option.status}
                      htmlFor={optionId}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-accent has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                    >
                      <input
                        id={optionId}
                        type="radio"
                        name={field.name}
                        value={option.status}
                        checked={field.value === option.status}
                        disabled={Boolean(blocked)}
                        aria-describedby={(blocked && reasonId) || undefined}
                        onChange={() => field.onChange(option.status)}
                        onBlur={field.onBlur}
                        className="size-4 accent-[var(--primary)]"
                      />
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium">
                          {REPORT_STATUS_LABELS[option.status]()}
                        </span>
                        {blocked && (
                          <span
                            id={reasonId}
                            className="text-xs text-muted-foreground"
                          >
                            {BLOCK_REASONS[blocked]()}
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
              {fieldState.invalid && (
                <FieldError id={errorId(baseId)} errors={[fieldState.error]} />
              )}
            </FieldSet>
          )}
        />

        <AppField
          control={form.control}
          name="message"
          id={baseId.concat('-message')}
          label={m.panel_report_response_label()}
        >
          {({ field, control }) => (
            <React.Fragment>
              <Textarea
                {...field}
                {...control}
                value={field.value ?? ''}
                rows={3}
                maxLength={LIST_LIMITS.REPORT_RESPONSE}
                className="min-h-20 text-sm"
              />
              <FieldDescription>
                {m.panel_report_response_hint({
                  count: (field.value ?? '').length,
                  max: LIST_LIMITS.REPORT_RESPONSE,
                })}
              </FieldDescription>
            </React.Fragment>
          )}
        </AppField>

        <AppFormRootError form={form} />

        <Field>
          <SubmitButton
            isPending={mutation.isPending}
            className="w-full self-start sm:w-auto"
          >
            {m.panel_report_status_submit()}
          </SubmitButton>
        </Field>
      </FieldGroup>
    </form>
  )
}
