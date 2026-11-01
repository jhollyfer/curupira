import type { ManagementScheduleShowResponse } from '@curupira/shared'
import { describe, expect, it } from 'vitest'

import {
  GRID_WASTE_TYPES,
  GRID_WEEKDAYS,
  countEntries,
  groupSchedules,
} from './schedule-grid'

function entry(
  id: string,
  rest: Pick<ManagementScheduleShowResponse, 'wasteType' | 'weekday' | 'shift'>,
): ManagementScheduleShowResponse {
  return {
    id,
    neighborhoodId: '00000000-0000-4000-8000-a00000000001',
    neighborhoodName: 'Centro',
    note: null,
    createdAt: '2026-01-01T00:00:00-05:00',
    updatedAt: null,
    ...rest,
  }
}

describe('groupSchedules', () => {
  it('builds every cell, empty ones included, so the grid never has a hole', () => {
    const grid = groupSchedules([])

    for (const type of GRID_WASTE_TYPES) {
      for (const day of GRID_WEEKDAYS) expect(grid[type][day]).toEqual([])
    }
  })

  it('puts each collection in its type and weekday cell', () => {
    const monday = entry('1', {
      wasteType: 'ORGANIC',
      weekday: 'MONDAY',
      shift: 'MORNING',
    })
    const grid = groupSchedules([monday])

    expect(grid.ORGANIC.MONDAY).toEqual([monday])
    expect(grid.ORGANIC.TUESDAY).toEqual([])
  })

  it('orders two shifts of the same day by the clock', () => {
    const night = entry('n', {
      wasteType: 'ORGANIC',
      weekday: 'SUNDAY',
      shift: 'NIGHT',
    })
    const morning = entry('m', {
      wasteType: 'ORGANIC',
      weekday: 'SUNDAY',
      shift: 'MORNING',
    })

    expect(
      groupSchedules([night, morning]).ORGANIC.SUNDAY.map((item) => item.id),
    ).toEqual(['m', 'n'])
  })

  it('counts the entries', () => {
    expect(
      countEntries([
        entry('1', { wasteType: 'BULKY', weekday: 'FRIDAY', shift: 'NIGHT' }),
      ]),
    ).toBe(1)
  })
})
