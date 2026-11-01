import type {
  CollectionShift,
  ManagementScheduleShowResponse,
  WasteType,
  Weekday,
} from '@curupira/shared'

/**
 * The weekly grid of one neighborhood: waste type in the rows, weekday in the columns.
 * Pure on purpose - the screen only renders what this returns, so the grouping rules
 * (which cell a collection lands in, in which order the shifts read) are tested here.
 *
 * Weeks start on Sunday because the shared `WEEKDAYS` does, and the public calendar
 * reads the same order.
 */
export const GRID_WEEKDAYS: ReadonlyArray<Weekday> = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export const GRID_WASTE_TYPES: ReadonlyArray<WasteType> = [
  'ORGANIC',
  'RECYCLABLE',
  'BULKY',
  'DEBRIS',
]

const SHIFT_ORDER = {
  MORNING: 0,
  AFTERNOON: 1,
  NIGHT: 2,
} satisfies Record<CollectionShift, number>

export type GridEntry = ManagementScheduleShowResponse

export type ScheduleGrid = Record<WasteType, Record<Weekday, Array<GridEntry>>>

function emptyRow(): Record<Weekday, Array<GridEntry>> {
  return {
    SUNDAY: [],
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
  }
}

export function groupSchedules(
  entries: ReadonlyArray<GridEntry>,
): ScheduleGrid {
  const grid: ScheduleGrid = {
    ORGANIC: emptyRow(),
    RECYCLABLE: emptyRow(),
    BULKY: emptyRow(),
    DEBRIS: emptyRow(),
  }

  for (const entry of entries) {
    grid[entry.wasteType][entry.weekday].push(entry)
  }

  for (const type of GRID_WASTE_TYPES) {
    for (const day of GRID_WEEKDAYS) {
      grid[type][day].sort(
        (a, b) => SHIFT_ORDER[a.shift] - SHIFT_ORDER[b.shift],
      )
    }
  }

  return grid
}

/** How many collections the week has, for the screen's summary. */
export function countEntries(entries: ReadonlyArray<GridEntry>): number {
  return entries.length
}
