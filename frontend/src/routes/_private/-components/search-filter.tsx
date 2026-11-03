import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/cn'

type SearchFilterProps = Readonly<{
  id: string
  label: string
  value: string | undefined
  placeholder?: string
  onCommit: (value: string | undefined) => void
  className?: string
}>

/**
 * The text filter of a listing. Uncontrolled and committed on blur or Enter: a controlled
 * input that navigates per keystroke would refetch the table (and the map) per letter.
 * `key` resets it when the URL changes from outside - the "clear filters" button.
 */
export function SearchFilter({
  id,
  label,
  value,
  placeholder,
  onCommit,
  className,
}: SearchFilterProps): React.JSX.Element {
  return (
    <Field className={cn('w-auto min-w-52 gap-1.5', className)}>
      <FieldLabel htmlFor={id} className="text-sm">
        {label}
      </FieldLabel>
      <div className="relative">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          key={value ?? ''}
          id={id}
          type="search"
          defaultValue={value ?? ''}
          placeholder={placeholder}
          onBlur={(event) => onCommit(event.target.value.trim() || undefined)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          className="h-11 pl-8 text-sm sm:h-9"
        />
      </div>
    </Field>
  )
}
