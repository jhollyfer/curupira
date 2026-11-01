import type { DateTime } from 'luxon'
import * as React from 'react'

import type { CollectionPass } from '#/lib/schedule'

export type WasteCalendarContextValue = {
  passes: ReadonlyArray<CollectionPass>
  /** "Now" on the town clock, fixed by the route's loader (same on server and client). */
  now: DateTime
  /** `YYYY-MM-DD` of the day whose details are showing. */
  selected: string
  select: (date: string) => void
}

const WasteCalendarContext = React.createContext<WasteCalendarContextValue | null>(
  null,
)

export const WasteCalendarProvider = WasteCalendarContext.Provider

export function useWasteCalendarContext(
  consumer: string,
): WasteCalendarContextValue {
  const context = React.use(WasteCalendarContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`WasteCalendar\``)
  }

  return context
}
