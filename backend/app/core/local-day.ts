/**
 * The city's calendar day. Benjamin Constant is on Amazonas time (UTC-4, no daylight
 * saving), and a "day" cut at UTC midnight would move an evening report to the next day
 * on the public map and in the dashboard. One zone, named once, used by the SQL grouping
 * and by the JS formatting alike so the two cannot disagree.
 */
export const LOCAL_TIME_ZONE = 'America/Manaus'

export class LocalDay {
  private static readonly FORMAT = new Intl.DateTimeFormat('en-CA', {
    timeZone: LOCAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  /** `YYYY-MM-DD` of the instant, in the city's zone. */
  static of(instant: Date): string {
    return LocalDay.FORMAT.format(instant)
  }

  /** The last `count` days ending at `last` (inclusive), oldest first. */
  static lastDays(last: Date, count: number): string[] {
    const DAY_MS = 24 * 60 * 60 * 1000

    return Array.from({ length: count }, (_, index) =>
      LocalDay.of(new Date(last.getTime() - (count - 1 - index) * DAY_MS)),
    )
  }
}
