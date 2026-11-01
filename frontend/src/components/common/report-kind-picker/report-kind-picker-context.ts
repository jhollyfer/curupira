import type { ReportKind } from '@curupira/shared'
import * as React from 'react'

/** What every option of the picker shares: the group name and the chosen kind. */
export type ReportKindPickerContextValue = {
  name: string
  value: ReportKind | undefined
  onValueChange: (kind: ReportKind) => void
  invalid: boolean
  describedBy: string | undefined
}

const ReportKindPickerContext =
  React.createContext<ReportKindPickerContextValue | null>(null)

export const ReportKindPickerProvider = ReportKindPickerContext.Provider

export function useReportKindPickerContext(
  consumer: string,
): ReportKindPickerContextValue {
  const context = React.use(ReportKindPickerContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`ReportKindPicker\``)
  }

  return context
}
