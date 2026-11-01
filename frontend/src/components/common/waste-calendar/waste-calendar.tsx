import { DateTime } from 'luxon'
import * as React from 'react'

import { cn } from '#/lib/cn'
import { TOWN_TIME_ZONE } from '#/lib/i18n'
import type { CollectionPass } from '#/lib/schedule'
import { getLocale } from '#/paraglide/runtime'

import { WasteCalendarProvider } from './waste-calendar-context'

type WasteCalendarProps = Readonly<{
  passes: ReadonlyArray<CollectionPass>
  /** ISO instant read once in the route's `loader`. */
  now: string
  className?: string
  children: React.ReactNode
}>

/**
 * The collection schedule as a calendar. The same data feeds three views that a screen
 * mixes as it needs: the 14-day strip of the home, the month grid and the selected
 * day's details. The root shares the passes, the clock and the selected day, so
 * tapping a day in the grid updates the details without the screen wiring it.
 *
 * `now` arrives as text from the loader instead of being read here: a clock read in the
 * render makes the server's HTML and the hydrated one disagree around midnight.
 */
export function WasteCalendar({
  passes,
  now,
  className,
  children,
}: WasteCalendarProps): React.JSX.Element {
  const clock = DateTime.fromISO(now, { zone: TOWN_TIME_ZONE }).setLocale(
    getLocale(),
  )
  const [selected, setSelected] = React.useState(clock.toFormat('yyyy-LL-dd'))

  const context = { passes, now: clock, selected, select: setSelected }

  return (
    <WasteCalendarProvider value={context}>
      <div
        data-slot="waste-calendar"
        className={cn('flex flex-col gap-5', className)}
      >
        {children}
      </div>
    </WasteCalendarProvider>
  )
}
