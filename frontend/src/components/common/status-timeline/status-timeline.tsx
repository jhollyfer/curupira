import type { ReportStatus } from '@curupira/shared'
import * as React from 'react'

import { cn } from '#/lib/cn'

import { StatusTimelineProvider } from './status-timeline-context'
import type { TimelineEvent } from './status-timeline-context'

type StatusTimelineProps = Readonly<{
  current: ReportStatus
  events: ReadonlyArray<TimelineEvent>
  className?: string
  children: React.ReactNode
}>

/**
 * The report's path as a vertical timeline: received, in review, forwarded, resolved.
 * The root only shares where the report is and what happened; `StatusTimelineSteps`
 * draws the four steps and a screen may add anything around it (a title, the protocol).
 */
export function StatusTimeline({
  current,
  events,
  className,
  children,
}: StatusTimelineProps): React.JSX.Element {
  return (
    <StatusTimelineProvider value={{ current, events }}>
      <div
        data-slot="status-timeline"
        className={cn('flex flex-col gap-4', className)}
      >
        {children}
      </div>
    </StatusTimelineProvider>
  )
}
