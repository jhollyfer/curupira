import type { ReportStatus } from '@curupira/shared'
import * as React from 'react'

/** One thing that happened to the report, as the tracking page returns it. */
export type TimelineEvent = Readonly<{
  status: ReportStatus
  message: string | null
  at: string
}>

export type StatusTimelineContextValue = {
  /** Where the report is now. */
  current: ReportStatus
  events: ReadonlyArray<TimelineEvent>
}

const StatusTimelineContext =
  React.createContext<StatusTimelineContextValue | null>(null)

export const StatusTimelineProvider = StatusTimelineContext.Provider

export function useStatusTimelineContext(
  consumer: string,
): StatusTimelineContextValue {
  const context = React.use(StatusTimelineContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`StatusTimeline\``)
  }

  return context
}
