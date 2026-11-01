import type * as React from 'react'

import { Field, FieldLabel } from '#/components/ui/field'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { cn } from '#/lib/cn'

export type SelectOption = Readonly<{ value: string; label: string }>

type ControlProps = Readonly<{
  id: string
  /** The empty value: "Todos os tipos". Absent means a choice is required. */
  allLabel?: string
  value: string | undefined
  options: ReadonlyArray<SelectOption>
  onValueChange: (value: string | undefined) => void
  className?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  onBlur?: () => void
}>

/**
 * The bare native `<select>` with its options, for a caller that brings its own label
 * (`AppField`). Native on purpose for filters and short enums: keyboard- and
 * screen-reader-complete for free, a platform picker on a tablet, and a six-option list
 * gains nothing from a custom popup. (The searchable `ui/combobox` is for lists too long
 * to scan.)
 *
 * `value === undefined` shows the "all" option when there is one; picking it reports
 * `undefined`, which is what clears a filter from the URL.
 */
export function OptionSelectControl({
  id,
  allLabel,
  value,
  options,
  onValueChange,
  className,
  disabled,
  onBlur,
  ...aria
}: ControlProps): React.JSX.Element {
  return (
    <NativeSelect
      id={id}
      value={value ?? ''}
      disabled={disabled}
      onBlur={onBlur}
      onChange={(event) => onValueChange(event.target.value || undefined)}
      className={cn('w-full [&_select]:h-9 [&_select]:text-sm', className)}
      {...aria}
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
  )
}

type OptionSelectProps = Readonly<
  Omit<ControlProps, 'aria-invalid' | 'aria-describedby' | 'onBlur'> & {
    label: string
  }
>

/** A labelled select for the filter rows (the label sits above, like every field). */
export function OptionSelect({
  label,
  className,
  ...control
}: OptionSelectProps): React.JSX.Element {
  return (
    <Field className={cn('w-auto min-w-36 gap-1.5', className)}>
      <FieldLabel htmlFor={control.id} className="text-sm">
        {label}
      </FieldLabel>
      <OptionSelectControl {...control} />
    </Field>
  )
}
