import { REPORT_KINDS } from '@curupira/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
  ReportKindPicker,
  ReportKindPickerLegend,
  ReportKindPickerOption,
} from '#/components/common/report-kind-picker'
import {
  StepWizard,
  StepWizardActions,
  StepWizardBack,
  StepWizardFinish,
  StepWizardIndicator,
  StepWizardNext,
  StepWizardPanel,
} from '#/components/common/step-wizard'
import { SubmitButton } from '#/components/common/submit-button'
import { FieldError } from '#/components/ui/field'
import { useReportSubmit } from '#/hooks/use-report-submit'
import { useUnsavedChangesBlocker } from '#/hooks/use-unsaved-changes-blocker'
import { errorDescribedBy, errorId } from '#/lib/form-a11y'
import { toCoordinate } from '#/lib/geo'
import type { ReportDraft } from '#/lib/report-queue'
import { m } from '#/paraglide/messages'

import { ReportFormValidator } from '../-schema'
import type { ReportFormValues } from '../-schema'
import { EvidenceStep } from './evidence-step'
import { ReportDone } from './report-done'
import { SendStep } from './send-step'

/** Which wizard step holds each field, so an invalid submit can point at the right one. */
const FIELD_STEPS: Record<string, number | undefined> = {
  kind: 0,
  photos: 1,
  latitude: 1,
  longitude: 1,
  description: 2,
  contact: 2,
}

function firstStepWithError(errors: object): number {
  return Math.min(
    ...Object.keys(errors).map((field) => FIELD_STEPS[field] ?? 2),
    2,
  )
}

function toDraft(values: ReportFormValues): ReportDraft {
  return {
    kind: values.kind,
    latitude: values.latitude,
    longitude: values.longitude,
    description: values.description?.trim() || undefined,
    // Anonymous is the default and the promise: the contact never leaves the form unless
    // the resident turned the switch off.
    contact: (!values.anonymous && values.contact?.trim()) || undefined,
    photos: values.photos,
  }
}

export function ReportPage(): React.JSX.Element {
  const { submit, outcome, isPending, reset } = useReportSubmit()
  const [step, setStep] = React.useState(0)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportFormValidator),
    mode: 'onTouched',
    defaultValues: {
      photos: [],
      anonymous: true,
      description: '',
      contact: '',
    },
  })

  // A report half-typed is lost if the resident leaves by accident (a tab swipe, the back
  // button): ask first, but never after it was sent or saved.
  useUnsavedChangesBlocker(form.formState.isDirty && !outcome)

  const kind = useWatch({ control: form.control, name: 'kind' })
  const photos = useWatch({ control: form.control, name: 'photos' })
  const latitude = useWatch({ control: form.control, name: 'latitude' })
  const longitude = useWatch({ control: form.control, name: 'longitude' })

  const hasKind = Boolean(kind)
  const canContinue = [
    hasKind,
    photos.length > 0 && toCoordinate(latitude, longitude) !== undefined,
    true,
  ]

  function onSubmit(event?: React.BaseSyntheticEvent): void {
    void form.handleSubmit(
      (values) => submit(toDraft(values)),
      // A failing field may live on a step that is not on screen: take the resident
      // to the first step that has an error, or the tap on "Enviar" would do nothing.
      (errors) => setStep(firstStepWithError(errors)),
    )(event)
  }

  /** What stops "Continuar" on each step, in words: a disabled button must say why. */
  function missingText(): string | undefined {
    if (step === 0 && !hasKind) return m.report_missing_kind()
    if (step === 1 && photos.length === 0) return m.report_missing_photo()
    if (step === 1 && toCoordinate(latitude, longitude) === undefined)
      return m.report_missing_location()

    return undefined
  }

  if (outcome) {
    return (
      <ReportDone
        outcome={outcome}
        onNewReport={() => {
          reset()
          form.reset()
          setStep(0)
        }}
      />
    )
  }

  return (
    <div className="page-container-md flex flex-col gap-6 py-8 md:py-12">
      <h1 className="text-fluid-title font-extrabold tracking-tight text-balance">
        {m.report_title()}
      </h1>

      {/* `method="post"`: a tap on "Enviar" before hydration becomes a native submit
          instead of putting the form in the URL. */}
      <form method="post" noValidate onSubmit={onSubmit}>
        <StepWizard
          titles={[
            m.report_step_kind(),
            m.report_step_evidence(),
            m.report_step_send(),
          ]}
          value={step}
          onValueChange={setStep}
        >
          <StepWizardIndicator />

          <StepWizardPanel step={0} title={m.report_kind_title()}>
            <Controller
              name="kind"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-3">
                  <ReportKindPicker
                    className="sm:grid sm:grid-cols-2 sm:gap-4"
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={fieldState.invalid}
                    describedBy={errorDescribedBy(
                      fieldState.invalid,
                      field.name,
                    )}
                  >
                    <ReportKindPickerLegend className="sr-only">
                      {m.report_kind_legend()}
                    </ReportKindPickerLegend>
                    {REPORT_KINDS.map((item) => (
                      <ReportKindPickerOption key={item} kind={item} />
                    ))}
                  </ReportKindPicker>
                  {fieldState.invalid && (
                    <FieldError
                      id={errorId(field.name)}
                      errors={[fieldState.error]}
                    />
                  )}
                </div>
              )}
            />
          </StepWizardPanel>

          <StepWizardPanel step={1} title={m.report_evidence_title()}>
            <EvidenceStep form={form} kind={kind} />
          </StepWizardPanel>

          <StepWizardPanel step={2} title={m.report_send_title()}>
            <SendStep form={form} />
          </StepWizardPanel>

          {/* A disabled button that does not say why is a dead end: name what is missing. */}
          <p
            role="status"
            className="text-base font-semibold text-muted-foreground"
          >
            {missingText()}
          </p>

          <StepWizardActions>
            <StepWizardBack />
            <StepWizardNext canContinue={canContinue[step] ?? true} />
            <StepWizardFinish>
              <SubmitButton size="touch-lg" isPending={isPending}>
                {m.report_submit()}
              </SubmitButton>
            </StepWizardFinish>
          </StepWizardActions>
        </StepWizard>
      </form>
    </div>
  )
}
