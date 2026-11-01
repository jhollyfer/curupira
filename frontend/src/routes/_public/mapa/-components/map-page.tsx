import { REPORT_KINDS } from '@curupira/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { ReportMap, ReportMapPins } from '#/components/common/report-map'
import { StatusBadge } from '#/components/common/status-badge'
import { storefrontReportsMapQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_KIND_ICONS } from '#/lib/icons'
import { REPORT_KIND_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

const route = getRouteApi('/_public/mapa/')

const CHIP =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-card px-4 text-base font-semibold shadow-card outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-ring/60 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground motion-reduce:transition-none'

export function MapPage(): React.JSX.Element {
  const { kind } = route.useSearch()
  const { data } = useSuspenseQuery(storefrontReportsMapQueryOptions())
  const reports = data.filter((item) => !kind || item.kind === kind)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
          {m.map_title()}
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          {m.map_intro()}
        </p>
      </header>

      <nav aria-label={m.map_filter_label()}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link to="/mapa" search={{}} data-active={!kind} className={CHIP}>
              {m.map_filter_all()}
            </Link>
          </li>
          {REPORT_KINDS.map((item) => {
            const Icon = REPORT_KIND_ICONS[item]

            return (
              <li key={item}>
                <Link
                  to="/mapa"
                  search={{ kind: item }}
                  data-active={kind === item}
                  aria-current={(kind === item && 'true') || undefined}
                  className={CHIP}
                >
                  <Icon aria-hidden="true" weight="fill" />
                  {REPORT_KIND_LABELS[item]()}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <ReportMap label={m.map_label()} className="h-[60dvh] min-h-80">
        <React.Suspense fallback={null}>
          <ReportMapPins reports={reports} />
        </React.Suspense>
      </ReportMap>

      <p className="text-sm text-muted-foreground">{m.map_privacy()}</p>

      <section aria-labelledby="map-list" className="flex flex-col gap-3">
        <h2 id="map-list" className="text-2xl font-extrabold tracking-tight">
          {m.map_list_title({ count: reports.length })}
        </h2>
        {reports.length === 0 && (
          <p className="text-base text-muted-foreground">{m.map_empty()}</p>
        )}
        <ul className="grid gap-2 md:grid-cols-2">
          {reports.map((report) => {
            const Icon = REPORT_KIND_ICONS[report.kind]

            return (
              <li
                key={report.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-card"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="report-pin shrink-0"
                    data-kind={report.kind}
                    data-status={report.status}
                  >
                    <Icon weight="fill" className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-base font-bold">
                      {REPORT_KIND_LABELS[report.kind]()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTownDate(report.day, {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
