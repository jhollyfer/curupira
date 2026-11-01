import { describe, expect, it } from 'vitest'

import {
  SERIES_DAYS,
  axisCeiling,
  countOf,
  fillDailySeries,
  seriesPeak,
  seriesTotal,
} from './report-stats'

describe('fillDailySeries', () => {
  it('returns exactly thirty days ending today, quiet days as zero', () => {
    const series = fillDailySeries(
      [
        { day: '2026-05-31', total: 3 },
        { day: '2026-05-10', total: 1 },
      ],
      '2026-05-31',
    )

    expect(series).toHaveLength(SERIES_DAYS)
    expect(series[0]?.day).toBe('2026-05-02')
    expect(series.at(-1)).toEqual({ day: '2026-05-31', total: 3 })
    expect(series.find((point) => point.day === '2026-05-10')?.total).toBe(1)
    expect(series.find((point) => point.day === '2026-05-11')?.total).toBe(0)
  })

  it('ignores days outside the window', () => {
    const series = fillDailySeries([{ day: '2026-03-01', total: 9 }], '2026-05-31')

    expect(seriesTotal(series)).toBe(0)
  })

  it('crosses the month boundary', () => {
    const series = fillDailySeries([], '2026-03-05')

    expect(series[0]?.day).toBe('2026-02-04')
  })
})

describe('series helpers', () => {
  it('sums and finds the peak', () => {
    const series = [
      { day: 'a', total: 2 },
      { day: 'b', total: 5 },
    ]

    expect(seriesTotal(series)).toBe(7)
    expect(seriesPeak(series)).toBe(5)
  })

  it('never lets the axis collapse to zero and rounds up to an even tick', () => {
    expect(axisCeiling(0)).toBe(4)
    expect(axisCeiling(4)).toBe(4)
    expect(axisCeiling(5)).toBe(6)
    expect(axisCeiling(9)).toBe(10)
  })

  it('counts a missing key as zero', () => {
    expect(countOf({ BURNING: 3 }, 'BURNING')).toBe(3)
    expect(countOf({ BURNING: 3 }, 'OTHER')).toBe(0)
  })
})
