/**
 * The day of the week a collection passes. Text and not the `Date#getDay` number:
 * the value is read in the database and in the API, and `1` says nothing there.
 * `WEEKDAYS` is in calendar order, Sunday first, the same as `getDay`, so the index
 * of a day in the list is the number the browser returns.
 */
export const WEEKDAY = {
  SUNDAY: 'SUNDAY',
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
} as const

export type Weekday = (typeof WEEKDAY)[keyof typeof WEEKDAY]

export const WEEKDAYS = [
  WEEKDAY.SUNDAY,
  WEEKDAY.MONDAY,
  WEEKDAY.TUESDAY,
  WEEKDAY.WEDNESDAY,
  WEEKDAY.THURSDAY,
  WEEKDAY.FRIDAY,
  WEEKDAY.SATURDAY,
] as const
