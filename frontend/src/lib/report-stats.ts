import { DateTime } from 'luxon'

import { TOWN_TIME_ZONE } from './i18n'

/**
 * The numbers of the overview, computed from the API's stats. The API returns only the
 * days that had a report; the chart needs all thirty, so the gaps are filled here with
 * zero - a line that skips the quiet days draws a trend that did not happen.
 */
export const SERIES_DAYS = 30

export type DailyPoint = Readonly<{ day: string; total: number }>

/** `today` is `yyyy-MM-dd` in the town's zone (the loader hands it over as text). */
export function fillDailySeries(
  entries: ReadonlyArray<DailyPoint>,
  today: string,
): Array<DailyPoint> {
  const totals = new Map(entries.map((entry) => [entry.day, entry.total]))
  const end = DateTime.fromFormat(today, 'yyyy-LL-dd', {
    zone: TOWN_TIME_ZONE,
  })
  const series: Array<DailyPoint> = []

  for (let offset = SERIES_DAYS - 1; offset >= 0; offset -= 1) {
    const day = end.minus({ days: offset }).toFormat('yyyy-LL-dd')
    series.push({ day, total: totals.get(day) ?? 0 })
  }

  return series
}

export function seriesTotal(series: ReadonlyArray<DailyPoint>): number {
  return series.reduce((sum, point) => sum + point.total, 0)
}

export function seriesPeak(series: ReadonlyArray<DailyPoint>): number {
  return series.reduce((peak, point) => Math.max(peak, point.total), 0)
}

/**
 * The y axis ceiling: the peak rounded up to a step the ticks can show, never zero (an
 * all-quiet month still needs an axis to draw a baseline on).
 */
export function axisCeiling(peak: number): number {
  if (peak <= 4) return 4

  return Math.ceil(peak / 2) * 2
}

export function countOf(
  record: Readonly<Partial<Record<string, number>>>,
  key: string,
): number {
  return record[key] ?? 0
}

/** The PRD's goal for the share of reports answered within 7 days (docs/PRD.md §7). */
export const RESPONSE_GOAL_PERCENT = 80

/**
 * The share of due reports answered within 7 days, as a whole percent, or `null` while
 * none is due yet: 0% would read as a failure when there is simply nothing to measure.
 */
export function responsePercent(
  rate: Readonly<{ answered: number; due: number }>,
): number | null {
  if (rate.due === 0) return null

  return Math.round((rate.answered / rate.due) * 100)
}
