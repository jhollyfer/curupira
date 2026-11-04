import { REPORT_KINDS, REPORT_STATUSES } from '@curupira/shared'
import { CheckCircleIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import { managementReportStatsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { formatNumber } from '#/lib/i18n'
import { REPORT_KIND_ICONS, REPORT_STATUS_ICONS } from '#/lib/icons'
import { REPORT_KIND_LABELS, REPORT_STATUS_LABELS } from '#/lib/labels'
import {
  RESPONSE_GOAL_PERCENT,
  countOf,
  fillDailySeries,
  responsePercent,
  seriesTotal,
} from '#/lib/report-stats'
import { m } from '#/paraglide/messages'

import { DailyChart } from './daily-chart'

const route = getRouteApi('/_private/management/')

/**
 * The status segments use the badge scale's *foreground* tokens: they are the dark,
 * AA-on-surface member of each pair, and the same four hues the status badge already
 * teaches. The name and the count always sit next to the segment, so no status is told
 * apart by color alone.
 */
const SEGMENT_COLORS = {
  RECEIVED: 'var(--badge-neutral-fg)',
  IN_REVIEW: 'var(--badge-warning-fg)',
  FORWARDED: 'var(--badge-info-fg)',
  RESOLVED: 'var(--badge-success-fg)',
} as const

function Untreated({ count }: Readonly<{ count: number }>): React.JSX.Element {
  if (count === 0) {
    return (
      <section
        aria-labelledby="untreated-title"
        className="flex items-start gap-4 border-l-4 border-primary bg-muted/50 py-4 pr-4 pl-5"
      >
        <CheckCircleIcon
          aria-hidden="true"
          weight="fill"
          className="mt-0.5 size-6 shrink-0 text-primary"
        />
        <div className="flex flex-col gap-1">
          <h2 id="untreated-title" className="text-lg font-semibold">
            {m.panel_overview_untreated_none_title()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {m.panel_overview_untreated_none_description()}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="untreated-title"
      className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-badge-warning-fg bg-badge-warning/60 py-4 pr-4 pl-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="untreated-title" className="text-lg font-semibold">
          {m.panel_overview_untreated_title({ count })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {m.panel_overview_untreated_description()}
        </p>
      </div>
      <Button
        render={
          <Link
            to="/management/reports"
            search={{ status: 'RECEIVED', sort: 'createdAt', direction: 'asc' }}
          />
        }
      >
        {m.panel_overview_untreated_action()}
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </Button>
    </section>
  )
}

/**
 * The PRD's success metric: of the last 30 days' reports already past their 7 days (or
 * answered in time), the share the team answered within 7 days, against the 80% goal.
 */
function ResponseRate({
  rate,
}: Readonly<{ rate: { answered: number; due: number } }>): React.JSX.Element {
  const percent = responsePercent(rate)

  return (
    <section
      aria-labelledby="response-rate-title"
      className="flex flex-col gap-1"
    >
      <h2 id="response-rate-title" className="text-lg font-semibold">
        {m.panel_overview_response_title()}
      </h2>
      {percent === null && (
        <p className="text-sm text-muted-foreground">
          {m.panel_overview_response_empty()}
        </p>
      )}
      {percent !== null && (
        <>
          <p className="text-3xl font-bold tabular-nums">
            {m.panel_overview_response_value({
              percent: formatNumber(percent),
              answered: formatNumber(rate.answered),
              due: formatNumber(rate.due),
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {m.panel_overview_response_goal({
              goal: formatNumber(RESPONSE_GOAL_PERCENT),
            })}
          </p>
        </>
      )}
    </section>
  )
}

export function OverviewPage(): React.JSX.Element {
  const { today } = route.useLoaderData()
  const { data: stats } = useSuspenseQuery(managementReportStatsQueryOptions())
  const series = fillDailySeries(stats.lastThirtyDays, today)
  const untreated = countOf(stats.byStatus, 'RECEIVED')
  const kindPeak = Math.max(
    1,
    ...REPORT_KINDS.map((kind) => countOf(stats.byKind, kind)),
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {m.panel_overview_title()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {m.panel_overview_intro({ total: formatNumber(stats.total) })}
        </p>
      </header>

      <Untreated count={untreated} />

      <ResponseRate rate={stats.responseWithinSevenDays} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section
          aria-labelledby="by-status-title"
          className="flex flex-col gap-4"
        >
          <h2 id="by-status-title" className="text-lg font-semibold">
            {m.panel_overview_by_status()}
          </h2>
          {/* One stacked bar: the status is a part of the whole, which is the one job
              a stacked bar does better than four rows. Segments are separated by a
              surface-colored gap, not a border, so they never touch. */}
          <div
            role="img"
            aria-label={m.panel_overview_by_status_label()}
            className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
          >
            {REPORT_STATUSES.map((status) => {
              const count = countOf(stats.byStatus, status)
              if (count === 0) return null

              return (
                <span
                  key={status}
                  style={{
                    flexGrow: count,
                    background: SEGMENT_COLORS[status],
                  }}
                  className="min-w-1"
                />
              )
            })}
          </div>
          <ul className="flex flex-col divide-y">
            {REPORT_STATUSES.map((status) => {
              const Icon = REPORT_STATUS_ICONS[status]

              return (
                <li key={status} className="flex items-center gap-3 py-2.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: SEGMENT_COLORS[status] }}
                  />
                  <Icon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  <span className="flex-1 text-sm">
                    {REPORT_STATUS_LABELS[status]()}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatNumber(countOf(stats.byStatus, status))}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section
          aria-labelledby="by-kind-title"
          className="flex min-w-0 flex-col gap-4"
        >
          <h2 id="by-kind-title" className="text-lg font-semibold">
            {m.panel_overview_by_kind()}
          </h2>
          <ul className="flex flex-col divide-y">
            {REPORT_KINDS.map((kind) => {
              const Icon = REPORT_KIND_ICONS[kind]
              const count = countOf(stats.byKind, kind)

              return (
                <li key={kind} className="flex items-center gap-3 py-2.5">
                  {/* The same disc the map draws for this kind, so the color learned
                      here is the one read on the pins. */}
                  <span
                    aria-hidden="true"
                    className="report-pin shrink-0 border-2!"
                    data-kind={kind}
                  >
                    <Icon weight="fill" className="size-4" />
                  </span>
                  <span className="w-32 shrink-0 text-sm">
                    {REPORT_KIND_LABELS[kind]()}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-2 min-w-0 flex-1 items-center"
                  >
                    <span
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(count / kindPeak) * 100}%`,
                        minWidth: Math.min(count, 1) * 6,
                      }}
                    />
                  </span>
                  <span className="w-10 text-right text-sm font-semibold tabular-nums">
                    {formatNumber(count)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section
        aria-labelledby="chart-title"
        className="flex flex-col gap-4 border-t pt-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="chart-title" className="text-lg font-semibold">
            {m.panel_overview_chart_title()}
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {m.panel_overview_chart_total({
              count: formatNumber(seriesTotal(series)),
            })}
          </p>
        </div>
        <DailyChart series={series} />
      </section>
    </div>
  )
}
