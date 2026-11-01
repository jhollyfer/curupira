import * as React from 'react'

import { cn } from '#/lib/cn'

import { StepWizardProvider } from './step-wizard-context'

type StepWizardProps = Readonly<{
  titles: ReadonlyArray<string>
  /** Zero-based current step; the parent owns it, so it can reset or restore it. */
  value: number
  onValueChange: (step: number) => void
  className?: string
  children: React.ReactNode
}>

/**
 * A step-by-step flow: progress indicator, one panel at a time, back and next.
 *
 * Compound and not a `steps={[{title, content}]}` prop: each step's content is a form
 * section with its own fields, and the screen keeps the whole form (one
 * react-hook-form) above the wizard, so going back never loses what was typed.
 * The wizard only decides **which** panel is on screen.
 *
 * The step is controlled by the parent: the reports screen jumps back to step 1 after
 * a send, and a wizard that owned the state would need an imperative `reset()`.
 */
export function StepWizard({
  titles,
  value,
  onValueChange,
  className,
  children,
}: StepWizardProps): React.JSX.Element {
  const last = titles.length - 1
  const step = Math.min(Math.max(value, 0), last)

  // No `useMemo`: the React Compiler memoizes the object by what it reads.
  const context = {
    titles,
    step,
    isFirst: step === 0,
    isLast: step === last,
    goTo: (target: number) =>
      onValueChange(Math.min(Math.max(target, 0), last)),
    next: () => onValueChange(Math.min(step + 1, last)),
    back: () => onValueChange(Math.max(step - 1, 0)),
  }

  return (
    <StepWizardProvider value={context}>
      <div
        data-slot="step-wizard"
        className={cn('flex flex-col gap-6', className)}
      >
        {children}
      </div>
    </StepWizardProvider>
  )
}
