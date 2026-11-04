import { LockSimpleIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import {
  PageHeader,
  PageHeaderBack,
  PageHeaderBadges,
  PageHeaderDescription,
  PageHeaderTitle,
} from '#/components/common/page-shell'
import { Picture } from '#/components/common/picture'
import {
  ReportMap,
  ReportMapSelectablePins,
} from '#/components/common/report-map'
import { StatusBadge } from '#/components/common/status-badge'
import {
  StatusTimeline,
  StatusTimelineSteps,
} from '#/components/common/status-timeline'
import { managementReportQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_KIND_ICONS } from '#/lib/icons'
import { REPORT_KIND_LABELS, REPORT_STATUS_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { StatusForm } from './status-form'

const route = getRouteApi('/_private/management/reports/$id/')

function Term({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function ReportDetail(): React.JSX.Element {
  const { id } = route.useParams()
  const { data: report } = useSuspenseQuery(managementReportQueryOptions(id))
  const KindIcon = REPORT_KIND_ICONS[report.kind]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader>
        <PageHeaderBack to="/management/reports" />
        <PageHeaderTitle>
          <span className="font-mono">{report.protocol}</span>
          <PageHeaderBadges>
            <StatusBadge status={report.status} />
          </PageHeaderBadges>
        </PageHeaderTitle>
        <PageHeaderDescription>
          <span className="inline-flex items-center gap-1.5">
            <KindIcon aria-hidden="true" weight="fill" className="size-3.5" />
            {REPORT_KIND_LABELS[report.kind]()}
          </span>
        </PageHeaderDescription>
      </PageHeader>

      {/* One column up to 1024px: photos, small map, then the update form and the
          history, so on a phone the form is reached after the evidence it is about. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-8">
          <section
            aria-labelledby="report-info"
            className="flex flex-col gap-4"
          >
            <h2 id="report-info" className="text-lg font-semibold">
              {m.panel_report_info()}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Term label={m.panel_report_received()}>
                {formatTownDate(report.createdAt, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Term>
              <Term label={m.panel_report_neighborhood()}>
                {report.neighborhoodName ?? m.panel_reports_no_neighborhood()}
              </Term>
            </dl>
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-medium text-muted-foreground">
                {m.panel_report_description()}
              </h3>
              {report.description && (
                <p className="max-w-prose text-sm whitespace-pre-line">
                  {report.description}
                </p>
              )}
              {!report.description && (
                <p className="text-sm text-muted-foreground">
                  {m.panel_report_no_description()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <LockSimpleIcon aria-hidden="true" className="size-3.5" />
                {m.panel_report_contact()}
              </h3>
              {report.contact && <p className="text-sm">{report.contact}</p>}
              {!report.contact && (
                <p className="text-sm text-muted-foreground">
                  {m.panel_report_no_contact()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {m.panel_report_contact_private()}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="report-photos"
            className="flex flex-col gap-3"
          >
            <h2 id="report-photos" className="text-lg font-semibold">
              {m.panel_report_photos({ count: report.photos.length })}
            </h2>
            {report.photos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {m.panel_report_no_photos()}
              </p>
            )}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {report.photos.map((photo, index) => (
                <li key={photo.id}>
                  {/* The photo opens at full size in a new tab: the panel needs to read
                      detail (a plate, a fire front), and a lightbox would add focus-trap
                      code for what the browser already does well. */}
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-md border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <Picture
                      src={photo.url}
                      alt={m.panel_report_photo_alt({ number: index + 1 })}
                      width={480}
                      height={320}
                      placement="fold"
                      className="aspect-3/2 w-full object-cover"
                    />
                    <span className="sr-only">
                      {m.panel_report_photo_open()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="report-location"
            className="flex flex-col gap-3"
          >
            <h2 id="report-location" className="text-lg font-semibold">
              {m.panel_report_location()}
            </h2>
            <ReportMap
              label={m.panel_report_map_label()}
              center={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              zoom={16}
              className="h-52 rounded-md border shadow-none md:h-64"
            >
              <React.Suspense fallback={null}>
                <ReportMapSelectablePins
                  reports={[{ ...report, title: report.protocol }]}
                />
              </React.Suspense>
            </ReportMap>
            <p className="text-xs text-muted-foreground tabular-nums">
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </p>
          </section>
        </div>

        <aside className="flex flex-col gap-8">
          <section
            aria-labelledby="report-update"
            className="flex flex-col gap-4"
          >
            <h2 id="report-update" className="text-lg font-semibold">
              {m.panel_report_update()}
            </h2>
            <StatusForm key={report.status} report={report} />
          </section>

          <section
            aria-labelledby="report-history"
            className="flex flex-col gap-4"
          >
            <h2 id="report-history" className="text-lg font-semibold">
              {m.panel_report_history()}
            </h2>
            <StatusTimeline current={report.status} events={report.events}>
              <StatusTimelineSteps />
            </StatusTimeline>
            <ol
              aria-label={m.panel_report_log()}
              className="flex flex-col divide-y border-t text-sm"
            >
              {[...report.events].reverse().map((event) => (
                <li
                  key={event.at.concat(event.status)}
                  className="flex flex-col gap-0.5 py-2.5"
                >
                  <span className="font-medium">
                    {REPORT_STATUS_LABELS[event.status]()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTownDate(event.at, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {event.authorName && ` · ${event.authorName}`}
                  </span>
                  {event.message && <span>{event.message}</span>}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  )
}
