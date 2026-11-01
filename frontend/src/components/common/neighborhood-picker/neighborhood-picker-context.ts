import type { StorefrontNeighborhoodShowResponse } from '@curupira/shared'
import * as React from 'react'

export type NeighborhoodPickerContextValue = {
  neighborhoods: ReadonlyArray<StorefrontNeighborhoodShowResponse>
  /** The chosen neighborhood id, or `null` when none was chosen yet. */
  value: string | null
  /** Is the list of choices showing? Always, until a neighborhood is chosen. */
  isOpen: boolean
  select: (id: string) => void
  open: () => void
  close: () => void
}

const NeighborhoodPickerContext =
  React.createContext<NeighborhoodPickerContextValue | null>(null)

export const NeighborhoodPickerProvider = NeighborhoodPickerContext.Provider

export function useNeighborhoodPickerContext(
  consumer: string,
): NeighborhoodPickerContextValue {
  const context = React.use(NeighborhoodPickerContext)

  if (!context) {
    throw new Error(
      `\`${consumer}\` must be used within \`NeighborhoodPicker\``,
    )
  }

  return context
}
