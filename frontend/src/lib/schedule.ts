import type {
  CollectionShift,
  StorefrontScheduleShowResponse,
  Weekday,
} from '@curupira/shared'
import { DateTime } from 'luxon'

import { TOWN_TIME_ZONE } from './i18n'

/**
 * The derived values of the collection schedule, pure and with "now" injected.
 *
 * Why pure and injected: "next collection" depends on the clock, and a clock read
 * inside the function makes SSR and hydration disagree around midnight and makes the
 * test depend on the day it runs. The caller reads the clock once (in a `loader` or an
 * event) and passes it in.
 *
 * Why `YYYY-MM-DD` strings for days: a day is not an instant. Carrying `Date`
 * would drag the browser's zone along (a phone set to another zone showed the truck one
 * day early); the town is UTC-4 all year with no daylight saving, so the day is
 * resolved once, on `America/Manaus`, and the rest of the app compares text.
 *
 * Enum values are literals typed by `import type`, and not the shared objects: this file
 * is reached by several route chunks, and a runtime import of the vocabulary at module
 * scope is the edge that makes a chunk cycle (see `list-search.ts`).
 */

export type CollectionPass = StorefrontScheduleShowResponse

/** A day and what passes on it, in shift order. */
export type CollectionDay = Readonly<{
  /** `YYYY-MM-DD` on the town clock. */
  date: string
  passes: ReadonlyArray<CollectionPass>
}>

/** A cell of the month grid: a day plus whether it belongs to the month shown. */
export type MonthCell = Readonly<
  CollectionDay & {
    inMonth: boolean
  }
>

export type NextCollection = Readonly<
  CollectionDay & {
    /** 0 is today. */
    daysAway: number
  }
>

/** Luxon numbers Monday=1 .. Sunday=7. */
const WEEKDAY_BY_LUXON: Record<number, Weekday | undefined> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
}

/** The inverse, for the `.ics` weekly rule (`BYDAY`). */
export const ICS_BYDAY: Record<Weekday, string> = {
  SUNDAY: 'SU',
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
}

/** Luxon weekday number of each `Weekday`. */
const LUXON_BY_WEEKDAY: Record<Weekday, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
}

/**
 * When each shift ends and starts, on the town clock. A resident reads "morning", so
 * the schedule never carries an hour; these are the working hours the app assumes
 * for "has it passed already" and for the calendar file. To be confirmed with the
 * city hall (see `data/schedules.ts`).
 */
export const SHIFT_HOURS: Record<
  CollectionShift,
  Readonly<{ start: number; end: number }>
> = {
  MORNING: { start: 6, end: 12 },
  AFTERNOON: { start: 13, end: 18 },
  NIGHT: { start: 19, end: 23 },
}

const SHIFT_ORDER: Record<CollectionShift, number> = {
  MORNING: 0,
  AFTERNOON: 1,
  NIGHT: 2,
}

const TYPE_ORDER: Record<CollectionPass['wasteType'], number> = {
  ORGANIC: 0,
  RECYCLABLE: 1,
  BULKY: 2,
  DEBRIS: 3,
}

export function townWeekday(day: DateTime): Weekday | undefined {
  return WEEKDAY_BY_LUXON[day.weekday]
}

/** Shift first, then waste type: the same order on every screen. */
function byShiftThenType(a: CollectionPass, b: CollectionPass): number {
  return (
    SHIFT_ORDER[a.shift] - SHIFT_ORDER[b.shift] ||
    TYPE_ORDER[a.wasteType] - TYPE_ORDER[b.wasteType]
  )
}

function dayKey(day: DateTime): string {
  return day.toFormat('yyyy-LL-dd')
}

/** The passes of a weekday, in display order. */
export function passesOnWeekday(
  passes: ReadonlyArray<CollectionPass>,
  weekday: Weekday | undefined,
): Array<CollectionPass> {
  if (!weekday) return []

  return passes.filter((pass) => pass.weekday === weekday).sort(byShiftThenType)
}

function collectionDay(
  passes: ReadonlyArray<CollectionPass>,
  day: DateTime,
): CollectionDay {
  return {
    date: dayKey(day),
    passes: passesOnWeekday(passes, townWeekday(day)),
  }
}

/** `count` consecutive days starting at `from`'s day (the strip of the home). */
export function upcomingDays(
  passes: ReadonlyArray<CollectionPass>,
  from: DateTime,
  count: number,
): Array<CollectionDay> {
  const start = from.setZone(TOWN_TIME_ZONE).startOf('day')

  return Array.from({ length: count }, (_, index) =>
    collectionDay(passes, start.plus({ days: index })),
  )
}

/**
 * The next day the truck passes. Today counts while at least one of today's shifts has
 * not ended; afterwards the search moves on. Looks one week ahead plus today, which
 * covers any weekly schedule; `null` only when the neighborhood has no pass at all.
 */
export function nextCollection(
  passes: ReadonlyArray<CollectionPass>,
  now: DateTime,
): NextCollection | null {
  const local = now.setZone(TOWN_TIME_ZONE)
  const start = local.startOf('day')

  for (let daysAway = 0; daysAway <= 7; daysAway += 1) {
    const day = collectionDay(passes, start.plus({ days: daysAway }))
    const pending = day.passes.filter(
      (pass) => daysAway > 0 || local.hour < SHIFT_HOURS[pass.shift].end,
    )

    if (pending.length > 0) return { date: day.date, passes: pending, daysAway }
  }

  return null
}

/**
 * The month as a grid of weeks, Sunday first (the order of `WEEKDAYS` in the shared
 * package), padded with the neighbor months' days so every row has seven cells.
 */
export function monthGrid(
  passes: ReadonlyArray<CollectionPass>,
  year: number,
  month: number,
): Array<Array<MonthCell>> {
  const first = DateTime.fromObject({ year, month, day: 1 }, { zone: TOWN_TIME_ZONE })
  // Sunday is 7 in Luxon and must be column 0.
  const lead = first.weekday % 7
  const start = first.minus({ days: lead })
  const total = Math.ceil((lead + (first.daysInMonth ?? 31)) / 7) * 7

  const cells = Array.from({ length: total }, (_, index): MonthCell => {
    const day = start.plus({ days: index })

    return { ...collectionDay(passes, day), inMonth: day.month === month }
  })

  return Array.from({ length: total / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  )
}

/** The first date on or after `from` that falls on `weekday`, as a town-clock day. */
export function firstOccurrence(from: DateTime, weekday: Weekday): DateTime {
  const start = from.setZone(TOWN_TIME_ZONE).startOf('day')
  const ahead = (LUXON_BY_WEEKDAY[weekday] - start.weekday + 7) % 7

  return start.plus({ days: ahead })
}

/** `YYYY-MM` for the month a day belongs to. */
export function monthKey(day: DateTime): string {
  return day.toFormat('yyyy-LL')
}

/** Moves a `YYYY-MM` key by whole months, crossing the year. */
export function shiftMonth(key: string, delta: number): string {
  const base = DateTime.fromFormat(key, 'yyyy-LL', { zone: TOWN_TIME_ZONE })

  return monthKey(base.plus({ months: delta }))
}
