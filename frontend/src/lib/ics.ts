import { DateTime } from 'luxon'

import { ICS_BYDAY, SHIFT_HOURS, firstOccurrence } from './schedule'
import type { CollectionPass } from './schedule'

/**
 * The `.ics` file of a neighborhood's schedule, built in the browser with no library
 * (RFC 5545, https://datatracker.ietf.org/doc/html/rfc5545).
 *
 * Why UTC times and a weekly `RRULE`, instead of one event per date or a `VTIMEZONE`:
 * the town sits on UTC-4 all year with no daylight saving, so "every Monday 06:00 in
 * Manaus" is "every Monday 10:00Z" forever. A single recurring event per pass keeps the
 * file a few lines long and the phone's calendar keeps repeating it with no end date to
 * renew. A `VTIMEZONE` block would be the only way to keep local times, and it is a
 * second place for a mistake that this fixed offset makes unnecessary.
 *
 * Text arrives already translated (`summary`), so the file follows the screen language.
 */

export type IcsInput = Readonly<{
  neighborhoodName: string
  passes: ReadonlyArray<CollectionPass>
  /** The first day searched for each weekday (normally today). */
  from: DateTime
  /** Written as DTSTAMP; injected so the file is deterministic in tests. */
  now: DateTime
  /** The event title of a pass, in the screen's language. */
  summary: (pass: CollectionPass) => string
  calendarName: string
}>

const LINE_BREAK = '\r\n'
/** RFC 5545 §3.1: lines are at most 75 octets. */
const MAX_OCTETS = 75

/** Backslash, semicolon, comma and newline are the characters TEXT values escape. */
export function escapeIcsText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n')
}

/**
 * Folds a long line: continuation lines start with one space. Counts octets, not
 * characters, because the accented names of the town are multi-byte; splitting inside
 * a character would corrupt it, so the walk goes by code point.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder()
  const chunks: Array<string> = []
  let current = ''
  let size = 0

  for (const char of line) {
    const width = encoder.encode(char).length
    // Continuation lines carry the leading space, which counts too.
    const limit = chunks.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1

    if (size + width > limit) {
      chunks.push(current)
      current = ''
      size = 0
    }

    current += char
    size += width
  }

  chunks.push(current)

  return chunks.join(`${LINE_BREAK} `)
}

function utc(value: DateTime): string {
  return value.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")
}

function event(input: IcsInput, pass: CollectionPass): Array<string> {
  const { start, end } = SHIFT_HOURS[pass.shift]
  const day = firstOccurrence(input.from, pass.weekday)
  const startsAt = day.set({ hour: start, minute: 0, second: 0 })
  const endsAt = day.set({ hour: end, minute: 0, second: 0 })

  const lines = [
    'BEGIN:VEVENT',
    `UID:${pass.id}@curupira`,
    `DTSTAMP:${utc(input.now)}`,
    `DTSTART:${utc(startsAt)}`,
    `DTEND:${utc(endsAt)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${ICS_BYDAY[pass.weekday]}`,
    `SUMMARY:${escapeIcsText(input.summary(pass))}`,
    `LOCATION:${escapeIcsText(input.neighborhoodName)}`,
  ]

  if (pass.note) lines.push(`DESCRIPTION:${escapeIcsText(pass.note)}`)

  lines.push('END:VEVENT')

  return lines
}

export function buildIcs(input: IcsInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Curupira//Coleta//PT',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
    ...input.passes.flatMap((pass) => event(input, pass)),
    'END:VCALENDAR',
  ]

  return lines.map(foldIcsLine).join(LINE_BREAK).concat(LINE_BREAK)
}
