import type { ReportKind, ReportStatus } from '@curupira/shared'
import { Marker } from 'react-leaflet'

import { REPORT_KIND_LABELS } from '#/lib/labels'

import { reportPinIcon } from './report-pin-icon'

type SelectablePin = Readonly<{
  id: string
  kind: ReportKind
  status: ReportStatus
  latitude: number
  longitude: number
  /** The marker's accessible name: what the screen reader says for the pin. */
  title: string
}>

type ReportMapSelectablePinsProps = Readonly<{
  reports: ReadonlyArray<SelectablePin>
  onSelect?: (id: string) => void
}>

/**
 * The panel's pins: same disc and color per kind as the public map, but a click selects
 * the report (the page opens its detail) instead of opening a popup. Leaflet markers are
 * focusable and `Enter` fires `click`, so the map is operable without a mouse.
 */
export function ReportMapSelectablePins({
  reports,
  onSelect,
}: ReportMapSelectablePinsProps) {
  return reports.map((report) => (
    <Marker
      key={report.id}
      position={[report.latitude, report.longitude]}
      icon={reportPinIcon(report.kind, report.status)}
      title={`${REPORT_KIND_LABELS[report.kind]()} ${report.title}`}
      eventHandlers={{ click: () => onSelect?.(report.id) }}
    />
  ))
}
