import type { LocalizedText } from '@curupira/shared'
import { DateTime } from 'luxon'

import { getLocale } from '#/paraglide/runtime'
import type { MessagePart } from '#/paraglide/runtime'

/**
 * What depends on the current language and is not a message (`i18n.md` §2): record
 * content in the three languages, number and date. Interface text is `m.*()`;
 * the enum label is `lib/labels.ts`.
 */

/**
 * Benjamin Constant's time zone: UTC-4 all year, no daylight saving. Every date is
 * shown in it, and not in the browser's zone: the page renders on SSR, and the same
 * instant in two zones diverges at hydration (and a resident in Tabatinga, which
 * shares the zone, would read the same hour anyway).
 */
export const TOWN_TIME_ZONE = 'America/Manaus'

/** The text in the current language of content that exists in all three. */
export function localized(text: LocalizedText): string {
  return text[getLocale()]
}

/**
 * A number in the current language. Built on each use because the language changes with
 * the URL; `Intl` keeps the data cache internally. Never a hand-built format.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(getLocale(), options).format(value)
}

/** "Now" on the town's clock. Read in a `loader` or an event, never in the render. */
export function townNow(): DateTime {
  return DateTime.now().setZone(TOWN_TIME_ZONE).setLocale(getLocale())
}

/** An API instant on the town's clock and in the current language. */
export function townDateTime(value: string): DateTime {
  return DateTime.fromISO(value).setZone(TOWN_TIME_ZONE).setLocale(getLocale())
}

/** A `YYYY-MM-DD` day (no time, no zone) as a date on the town's clock. */
export function townDay(value: string): DateTime {
  return DateTime.fromISO(value, { zone: TOWN_TIME_ZONE }).setLocale(
    getLocale(),
  )
}

/** The API instant formatted on the town's clock and in the current language. */
export function formatTownDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return townDateTime(value).toLocaleString(options)
}

/** "Now" as text, for a `loader` to hand to the screen: server and client then agree. */
export function townNowIso(): string {
  return townNow().toISO({ suppressMilliseconds: true }) ?? ''
}

/**
 * The plain text of a stretch of `m.x.parts()` (`_doc-lib/paraglide.md#/markup`): the markup
 * parts carry no text of their own, so only the `text` parts count.
 */
export function partsText(parts: MessagePart[]): string {
  let result = ''
  for (const part of parts) {
    if (part.type === 'text') result += part.value
  }
  return result
}
