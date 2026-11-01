import type { ReportKind } from '@curupira/shared'
import * as React from 'react'

import { cn } from '#/lib/cn'

import { ReportKindPickerProvider } from './report-kind-picker-context'

type ReportKindPickerProps = Readonly<{
  value: ReportKind | undefined
  onValueChange: (kind: ReportKind) => void
  /** Groups the radios; the form field name. */
  name: string
  invalid?: boolean
  /** The id of the error text, so the group is described by it. */
  describedBy?: string
  className?: string
  children: React.ReactNode
}>

/**
 * The report type as big cards: a native radio group underneath (arrow keys, form
 * semantics and screen reader announcement for free) and a card drawn over each radio.
 * A `fieldset` with a `legend` is the group's accessible name.
 *
 * Compound and not `options={[…]}`: the screen decides which kinds to offer and in
 * which order, and the card keeps its own markup (icon, name, hint).
 */
export function ReportKindPicker({
  value,
  onValueChange,
  name,
  invalid = false,
  describedBy,
  className,
  children,
}: ReportKindPickerProps): React.JSX.Element {
  const context = { name, value, onValueChange, invalid, describedBy }

  return (
    <ReportKindPickerProvider value={context}>
      <fieldset
        data-slot="report-kind-picker"
        aria-describedby={describedBy}
        className={cn('flex min-w-0 flex-col gap-3 border-0 p-0', className)}
      >
        {children}
      </fieldset>
    </ReportKindPickerProvider>
  )
}
