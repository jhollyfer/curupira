import { DateTime } from 'luxon'

import { TOWN_TIME_ZONE } from './i18n'

/**
 * `<input type="datetime-local">` speaks a zone-less `yyyy-MM-ddTHH:mm`, and the API
 * speaks an ISO instant with an offset. Both conversions go through the town's zone, so
 * a manager typing "08:00" on a laptop set to another zone still means 08:00 in
 * Benjamin Constant - the hour the residents will read.
 */
const LOCAL_FORMAT = "yyyy-LL-dd'T'HH:mm"

export function instantToLocalInput(iso: string): string {
  const parsed = DateTime.fromISO(iso, { zone: TOWN_TIME_ZONE })
  if (!parsed.isValid) return ''

  return parsed.toFormat(LOCAL_FORMAT)
}

export function localInputToInstant(text: string): string | undefined {
  const parsed = DateTime.fromFormat(text, LOCAL_FORMAT, {
    zone: TOWN_TIME_ZONE,
  })
  if (!parsed.isValid) return undefined

  // `toISO` is typed `string | null` only for invalid dates, which returned above.
  return parsed.toISO({ suppressMilliseconds: true })
}
