import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import {
  firstOccurrence,
  monthGrid,
  nextCollection,
  shiftMonth,
  upcomingDays,
} from './schedule'
import type { CollectionPass } from './schedule'

const ZONE = 'America/Manaus'

let counter = 0

function pass(
  weekday: CollectionPass['weekday'],
  wasteType: CollectionPass['wasteType'],
  shift: CollectionPass['shift'] = 'MORNING',
): CollectionPass {
  counter += 1

  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    neighborhoodId: '00000000-0000-4000-8000-000000000001',
    wasteType,
    weekday,
    shift,
    note: null,
  }
}

const SCHEDULE = [
  pass('MONDAY', 'ORGANIC'),
  pass('THURSDAY', 'ORGANIC', 'AFTERNOON'),
  pass('THURSDAY', 'RECYCLABLE', 'MORNING'),
  pass('SATURDAY', 'BULKY', 'NIGHT'),
]

function at(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: ZONE })
}

describe('nextCollection', () => {
  it('counts today while the shift has not ended', () => {
    // Monday 2026-11-02, 09:00 in Manaus.
    const next = nextCollection(SCHEDULE, at('2026-11-02T09:00'))

    expect(next?.date).toBe('2026-11-02')
    expect(next?.daysAway).toBe(0)
  })

  it('moves to the next pass once the shift is over', () => {
    const next = nextCollection(SCHEDULE, at('2026-11-02T12:30'))

    expect(next?.date).toBe('2026-11-05')
    expect(next?.daysAway).toBe(3)
  })

  it('orders the day by shift and keeps both types of a double day', () => {
    const next = nextCollection(SCHEDULE, at('2026-11-03T08:00'))

    expect(next?.passes.map((item) => item.wasteType)).toEqual([
      'RECYCLABLE',
      'ORGANIC',
    ])
  })

  it('drops only the shifts already over on the same day', () => {
    const next = nextCollection(SCHEDULE, at('2026-11-05T14:00'))

    expect(next?.passes.map((item) => item.shift)).toEqual(['AFTERNOON'])
  })

  it('crosses the year', () => {
    // Thursday 2026-12-31 after every shift: next is Saturday 2027-01-02.
    const next = nextCollection(SCHEDULE, at('2026-12-31T20:00'))

    expect(next?.date).toBe('2027-01-02')
  })

  it('reads the clock in Manaus, not in UTC', () => {
    // 01:00Z on Tuesday is still Monday 21:00 in Manaus, and the Monday shift is over.
    const next = nextCollection(
      SCHEDULE,
      DateTime.fromISO('2026-11-03T01:00:00Z'),
    )

    expect(next?.date).toBe('2026-11-05')
  })

  it('is null without any pass', () => {
    expect(nextCollection([], at('2026-11-02T09:00'))).toBeNull()
  })
})

describe('upcomingDays', () => {
  it('returns the requested number of consecutive days', () => {
    const days = upcomingDays(SCHEDULE, at('2026-12-28T15:00'), 14)

    expect(days).toHaveLength(14)
    expect(days[0]?.date).toBe('2026-12-28')
    expect(days[4]?.date).toBe('2027-01-01')
    expect(days[13]?.date).toBe('2027-01-10')
  })

  it('fills each day with the passes of its weekday', () => {
    const days = upcomingDays(SCHEDULE, at('2026-11-02T00:00'), 7)

    expect(days.map((day) => day.passes.length)).toEqual([1, 0, 0, 2, 0, 1, 0])
  })
})

describe('monthGrid', () => {
  it('pads to full Sunday-first weeks', () => {
    // February 2026 starts on a Sunday and has 28 days: exactly four weeks.
    const grid = monthGrid(SCHEDULE, 2026, 2)

    expect(grid).toHaveLength(4)
    expect(grid[0]?.[0]?.date).toBe('2026-02-01')
    expect(grid.every((week) => week.length === 7)).toBe(true)
  })

  it('marks the neighbor months days as outside', () => {
    // November 2026 starts on a Sunday; October 2026 ends before it.
    const grid = monthGrid(SCHEDULE, 2026, 10)
    const first = grid[0]?.[0]

    expect(first?.date).toBe('2026-09-27')
    expect(first?.inMonth).toBe(false)
    expect(grid.flat().filter((cell) => cell.inMonth)).toHaveLength(31)
  })

  it('handles December into January', () => {
    const grid = monthGrid(SCHEDULE, 2026, 12)
    const last = grid.at(-1)?.at(-1)

    expect(last?.date).toBe('2027-01-02')
    expect(last?.inMonth).toBe(false)
  })

  it('puts the passes on the right weekday column', () => {
    const grid = monthGrid(SCHEDULE, 2026, 11)
    const thursday = grid.flat().find((cell) => cell.date === '2026-11-05')

    expect(thursday?.passes).toHaveLength(2)
  })
})

describe('firstOccurrence', () => {
  it('returns the same day when it already falls on the weekday', () => {
    expect(
      firstOccurrence(at('2026-12-31T10:00'), 'THURSDAY').toISODate(),
    ).toBe('2026-12-31')
  })

  it('crosses the year for a Monday after Dec 31st', () => {
    expect(firstOccurrence(at('2026-12-31T10:00'), 'MONDAY').toISODate()).toBe(
      '2027-01-04',
    )
  })
})

describe('shiftMonth', () => {
  it('crosses the year in both directions', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2027-01', -1)).toBe('2026-12')
  })
})
