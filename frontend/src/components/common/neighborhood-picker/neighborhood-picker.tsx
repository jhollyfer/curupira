import type { StorefrontNeighborhoodShowResponse } from '@curupira/shared'
import * as React from 'react'

import { cn } from '#/lib/cn'

import { NeighborhoodPickerProvider } from './neighborhood-picker-context'

type NeighborhoodPickerProps = Readonly<{
  neighborhoods: ReadonlyArray<StorefrontNeighborhoodShowResponse>
  value: string | null
  onValueChange: (id: string) => void
  className?: string
  children: React.ReactNode
}>

/**
 * "Which is your neighborhood?": asked once, remembered, changeable. The root holds the
 * single piece of state that is its own (is the list open?) and the parts decide what
 * to draw: `NeighborhoodPickerSummary` when one is chosen, `NeighborhoodPickerList`
 * while choosing. Both the home and the schedule screen use it; each screen owns
 * where the value is stored.
 */
export function NeighborhoodPicker({
  neighborhoods,
  value,
  onValueChange,
  className,
  children,
}: NeighborhoodPickerProps): React.JSX.Element {
  const [forcedOpen, setForcedOpen] = React.useState(false)

  const context = {
    neighborhoods,
    value,
    // No neighborhood yet: the list is the only thing to show.
    isOpen: value === null || forcedOpen,
    select: (id: string) => {
      onValueChange(id)
      setForcedOpen(false)
    },
    open: () => setForcedOpen(true),
    close: () => setForcedOpen(false),
  }

  return (
    <NeighborhoodPickerProvider value={context}>
      <div
        data-slot="neighborhood-picker"
        className={cn('flex flex-col gap-4', className)}
      >
        {children}
      </div>
    </NeighborhoodPickerProvider>
  )
}
