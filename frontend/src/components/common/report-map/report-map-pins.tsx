import type { StorefrontReportMapResponse } from '@curupira/shared'
import { Marker, Popup } from 'react-leaflet'

import { StatusBadge } from '#/components/common/status-badge'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_KIND_LABELS } from '#/lib/labels'

import { reportPinIcon } from './report-pin-icon'

type ReportMapPinsProps = Readonly<{
  reports: ReadonlyArray<StorefrontReportMapResponse>
}>

/**
 * One pin per occurrence, colored by kind with the kind's icon inside, dashed when
 * resolved. The popup carries kind, status and day and nothing else: the public map
 * has no description, photo, protocol or contact to show.
 */
export function ReportMapPins({ reports }: ReportMapPinsProps) {
  return reports.map((report) => (
    <Marker
      key={report.id}
      position={[report.latitude, report.longitude]}
      icon={reportPinIcon(report.kind, report.status)}
      title={REPORT_KIND_LABELS[report.kind]()}
    >
      <Popup>
        <div className="flex flex-col gap-2 text-base">
          <strong className="font-bold">{REPORT_KIND_LABELS[report.kind]()}</strong>
          <StatusBadge status={report.status} />
          <span className="text-sm">
            {formatTownDate(report.day, { day: 'numeric', month: 'long' })}
          </span>
        </div>
      </Popup>
    </Marker>
  ))
}
