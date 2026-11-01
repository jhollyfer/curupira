import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useStepWizardContext } from './step-wizard-context'

/**
 * The progress indicator: a bar, "Passo 2 de 3" and the step names. The number is text
 * and the current step is `aria-current="step"`, so the progress does not depend on
 * seeing the bar's color.
 */
export function StepWizardIndicator({
  className,
}: Readonly<{ className?: string }>): React.JSX.Element {
  const { titles, step } = useStepWizardContext('StepWizardIndicator')

  return (
    <nav
      data-slot="step-wizard-indicator"
      aria-label={m.wizard_progress_label()}
      className={cn('flex flex-col gap-3', className)}
    >
      <p className="text-sm font-semibold text-muted-foreground">
        {m.wizard_progress({ current: step + 1, total: titles.length })}
      </p>
      <ol className="grid auto-cols-fr grid-flow-col gap-2">
        {titles.map((title, index) => (
          <li
            key={title}
            aria-current={(index === step && 'step') || undefined}
            data-state={
              (index < step && 'done') ||
              (index === step && 'current') ||
              'todo'
            }
            className="group flex flex-col gap-2"
          >
            <span
              aria-hidden="true"
              className="h-2 rounded-full bg-border transition-colors group-data-[state=current]:bg-primary group-data-[state=done]:bg-primary/60 motion-reduce:transition-none"
            />
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-data-[state=current]:font-bold group-data-[state=current]:text-foreground">
              <CheckIcon
                weight="bold"
                className="hidden size-3.5 group-data-[state=done]:block"
              />
              {title}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

type StepWizardPanelProps = Readonly<{
  /** Zero-based; the panel renders only while it is the current step. */
  step: number
  title: string
  children: React.ReactNode
}>

/**
 * One step's content. Only the current one is in the DOM, and on a step change focus
 * goes to its heading (a keyboard or screen-reader user would otherwise be left on a
 * button that just disappeared). Not at page load: nothing should steal focus
 * at page load.
 */
export function StepWizardPanel({
  step,
  title,
  children,
}: StepWizardPanelProps): React.JSX.Element | null {
  const wizard = useStepWizardContext('StepWizardPanel')
  const heading = React.useRef<HTMLHeadingElement>(null)
  const active = wizard.step === step

  React.useEffect(() => {
    if (active && wizard.moved.current) heading.current?.focus()
  }, [active, wizard.moved])

  if (!active) return null

  return (
    <section
      data-slot="step-wizard-panel"
      aria-labelledby={`wizard-step-${step}`}
      className="flex flex-col gap-5"
    >
      <h2
        ref={heading}
        id={`wizard-step-${step}`}
        tabIndex={-1}
        className="text-2xl font-extrabold tracking-tight text-balance outline-none"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/** The row of buttons below the panel. */
export function StepWizardActions({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="step-wizard-actions"
      className={cn(
        'flex flex-col-reverse gap-3 sm:flex-row sm:justify-between',
        className,
      )}
      {...props}
    />
  )
}

/** Goes back. Absent on the first step: there is nowhere to go. */
export function StepWizardBack(): React.JSX.Element | null {
  const { isFirst, back } = useStepWizardContext('StepWizardBack')

  if (isFirst) return <span aria-hidden="true" />

  return (
    <Button
      type="button"
      variant="outline"
      size="touch"
      onClick={back}
      data-slot="step-wizard-back"
    >
      <ArrowLeftIcon aria-hidden="true" />
      {m.wizard_back()}
    </Button>
  )
}

type StepWizardNextProps = Readonly<{
  /** The step's own validation: the parent knows when the fields are good. */
  canContinue?: boolean
}>

/** Goes forward. Absent on the last step, where the submit takes its place. */
export function StepWizardNext({
  canContinue = true,
}: StepWizardNextProps): React.JSX.Element | null {
  const { isLast, next } = useStepWizardContext('StepWizardNext')

  if (isLast) return null

  return (
    <Button
      type="button"
      size="touch"
      disabled={!canContinue}
      onClick={next}
      data-slot="step-wizard-next"
    >
      {m.wizard_next()}
      <ArrowRightIcon aria-hidden="true" />
    </Button>
  )
}

/** Renders its children only on the last step: the place for the submit button. */
export function StepWizardFinish({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element | null {
  const { isLast } = useStepWizardContext('StepWizardFinish')

  if (!isLast) return null

  return <>{children}</>
}
