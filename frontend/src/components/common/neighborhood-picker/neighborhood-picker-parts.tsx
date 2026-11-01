import { MapPinIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

import { useNeighborhoodPickerContext } from './neighborhood-picker-context'

/** "Your neighborhood: Centro" with the change button. Only while one is chosen. */
export function NeighborhoodPickerSummary(): React.JSX.Element | null {
  const { neighborhoods, value, isOpen, open } = useNeighborhoodPickerContext(
    'NeighborhoodPickerSummary',
  )
  const chosen = neighborhoods.find((item) => item.id === value)

  if (isOpen || !chosen) return null

  return (
    <div
      data-slot="neighborhood-picker-summary"
      className="flex items-center justify-between gap-3"
    >
      <p className="flex min-w-0 items-center gap-2 text-base">
        <MapPinIcon
          aria-hidden="true"
          weight="fill"
          className="size-5 shrink-0 text-primary"
        />
        <span className="text-muted-foreground">{m.neighborhood_yours()}</span>
        <strong className="truncate font-bold">{chosen.name}</strong>
      </p>
      <Button type="button" variant="outline" size="touch" onClick={open}>
        {m.neighborhood_change()}
      </Button>
    </div>
  )
}

/**
 * The choices as big targets in a radio group (arrow keys move, space chooses). The
 * list is its own legend: a person reading with a screen reader hears the question
 * before the options.
 */
export function NeighborhoodPickerList(): React.JSX.Element | null {
  const { neighborhoods, value, isOpen, select, close } =
    useNeighborhoodPickerContext('NeighborhoodPickerList')

  if (!isOpen) return null

  return (
    <fieldset
      data-slot="neighborhood-picker-list"
      className="flex min-w-0 flex-col gap-3 border-0 p-0"
    >
      <legend className="mb-3 text-xl font-extrabold tracking-tight text-balance">
        {m.neighborhood_question()}
      </legend>
      <div className="grid grid-cols-2 gap-2.5">
        {neighborhoods.map((neighborhood) => (
          <label
            key={neighborhood.id}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-card px-3 py-2 text-center text-base font-semibold shadow-card transition-shadow hover:shadow-card-hover has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:shadow-[0_0_0_4px_var(--ring)] motion-reduce:transition-none"
          >
            <input
              type="radio"
              name="neighborhood"
              value={neighborhood.id}
              checked={value === neighborhood.id}
              onChange={() => select(neighborhood.id)}
              className="sr-only"
            />
            {neighborhood.name}
          </label>
        ))}
      </div>
      {value !== null && (
        <Button type="button" variant="ghost" size="touch" onClick={close}>
          {m.common_cancel()}
        </Button>
      )}
    </fieldset>
  )
}

/**
 * Renders its children only while no list is open: the content that depends on the
 * neighborhood (the next collection, the calendar) steps aside while the resident is
 * choosing another one, instead of showing the old neighborhood's days under the question.
 */
export function NeighborhoodPickerClosed({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element | null {
  const { isOpen } = useNeighborhoodPickerContext('NeighborhoodPickerClosed')

  if (isOpen) return null

  return <>{children}</>
}
