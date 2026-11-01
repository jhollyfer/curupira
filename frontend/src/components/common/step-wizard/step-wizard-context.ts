import * as React from 'react'

/**
 * What the whole wizard shares: where it is and how to move. Born at the top, read by
 * the indicator, the panels and the buttons - passing `step` and the handlers down by
 * prop would repeat them in every part of every wizard.
 */
export type StepWizardContextValue = {
  /** Step titles, in order: the count of steps is their length. */
  titles: ReadonlyArray<string>
  /** Zero-based current step. */
  step: number
  isFirst: boolean
  isLast: boolean
  /** Set once the user has moved: the panels only take focus after that, not at load. */
  moved: React.RefObject<boolean>
  goTo: (step: number) => void
  next: () => void
  back: () => void
}

const StepWizardContext = React.createContext<StepWizardContextValue | null>(
  null,
)

export const StepWizardProvider = StepWizardContext.Provider

/**
 * The wizard's state, for whoever is inside `StepWizard`. The `consumer` goes into
 * the message so the error says **which** part was left outside the provider.
 */
export function useStepWizardContext(consumer: string): StepWizardContextValue {
  const context = React.use(StepWizardContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`StepWizard\``)
  }

  return context
}
