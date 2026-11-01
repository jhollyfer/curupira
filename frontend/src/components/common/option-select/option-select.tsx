import type * as React from 'react'

import { Field, FieldLabel } from '#/components/ui/field'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { cn } from '#/lib/cn'

export type SelectOption = Readonly<{ value: string; label: string }>

type OptionSelectProps = Readonly<{
  id: string
  label: string
  /** The empty value: "Todos os tipos". Absent means a choice is required. */
  allLabel?: string
  value: string | undefined
  options: ReadonlyArray<SelectOption>
  onValueChange: (value: string | undefined) => void
  className?: string
  disabled?: boolean
}>

/**
 * A labelled native `<select>`. Native on purpose for the panel's filters and short
 * enums: it is keyboard- and screen-reader-complete for free, it opens a platform picker
 * on a tablet, and a six-option list gains nothing from a custom popup. (The searchable
 * `ui/combobox` is for lists too long to scan.)
 *
 * `value === undefined` shows the "all" option; picking it reports `undefined`, which is
 * what clears the filter from the URL.
 */
export function OptionSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onValueChange,
  className,
  disabled,
}: OptionSelectProps): React.JSX.Element {
  return (
    <Field className={cn('w-auto min-w-36 gap-1.5', className)}>
      <FieldLabel htmlFor={id} className="text-sm">
        {label}
      </FieldLabel>
      <NativeSelect
        id={id}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value || undefined)}
        className="w-full [&_select]:h-9 [&_select]:text-sm"
      >
        {allLabel !== undefined && (
          <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        )}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
