import { useSuspenseQuery } from '@tanstack/react-query'
import type * as React from 'react'

import { StatusBadge } from '#/components/common/status-badge'
import {
  StatusTimeline,
  StatusTimelineSteps,
} from '#/components/common/status-timeline'
import { storefrontReportByProtocolQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_KIND_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

/** What the code opens: the kind, the date, the status and the path so far. */
export function TrackResult({
  protocol,
}: Readonly<{ protocol: string }>): React.JSX.Element {
  const { data: report } = useSuspenseQuery(
    storefrontReportByProtocolQueryOptions(protocol),
  )

  return (
    <section
      aria-labelledby="track-result-title"
      className="flex flex-col gap-6 rounded-3xl bg-card p-5 shadow-card-elevated md:p-6"
    >
      <header className="flex flex-col gap-2">
        <p className="text-base font-semibold text-muted-foreground">
          {m.track_result_protocol()}
        </p>
        <h2
          id="track-result-title"
          className="text-3xl font-extrabold tracking-wider tabular-nums"
        >
          {report.protocol}
        </h2>
        <p className="text-lg font-semibold">
          {REPORT_KIND_LABELS[report.kind]()}
          <span className="font-medium text-muted-foreground">
            {' '}
            {m.track_result_received({
              date: formatTownDate(report.createdAt, {
                day: 'numeric',
                month: 'long',
              }),
            })}
          </span>
        </p>
        <StatusBadge status={report.status} className="self-start" />
      </header>
      <StatusTimeline current={report.status} events={report.events}>
        <StatusTimelineSteps />
      </StatusTimeline>
    </section>
  )
}
