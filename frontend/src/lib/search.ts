import type { ReportKind } from '@curupira/shared'
import { DateTime } from 'luxon'

import { TOWN_TIME_ZONE } from './i18n'

/**
 * The URL state of the public screens, validated by hand (`validateSearch` is
 * synchronous, and an invalid value is dropped, not thrown: the URL is editable by
 * anyone). Literals are typed with `import type`, see `list-search.ts` on chunk cycles.
 */

const REPORT_KIND_BY_TEXT: Record<string, ReportKind | undefined> = {
  BURNING: 'BURNING',
  DUMPING: 'DUMPING',
  DEFORESTATION: 'DEFORESTATION',
  OTHER: 'OTHER',
}

export type MapSearch = {
  kind?: ReportKind
}

export function validateMapSearch(search: Record<string, unknown>): MapSearch {
  const kind = REPORT_KIND_BY_TEXT[String(search.kind)]
  if (kind) return { kind }

  return {}
}

export type ScheduleSearch = {
  /** `YYYY-MM`; absent means the current month. */
  month?: string
}

export function validateScheduleSearch(
  search: Record<string, unknown>,
): ScheduleSearch {
  const month = String(search.month)
  const parsed = DateTime.fromFormat(month, 'yyyy-LL', { zone: TOWN_TIME_ZONE })

  if (parsed.isValid) return { month: parsed.toFormat('yyyy-LL') }

  return {}
}

export type TrackSearch = {
  protocol?: string
}

/** The protocol is normalized by the shared validator on submit; here only bounded. */
export function validateTrackSearch(
  search: Record<string, unknown>,
): TrackSearch {
  if (typeof search.protocol !== 'string' || !search.protocol) return {}

  return { protocol: search.protocol.slice(0, 40) }
}
