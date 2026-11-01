// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import type { CollectionPass } from '#/lib/schedule'

import {
  WasteCalendar,
  WasteCalendarDetail,
  WasteCalendarLegend,
  WasteCalendarMonth,
  WasteCalendarStrip,
} from './index'

afterEach(cleanup)

const PASSES: Array<CollectionPass> = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    neighborhoodId: '00000000-0000-4000-8000-0000000000aa',
    wasteType: 'ORGANIC',
    weekday: 'MONDAY',
    shift: 'MORNING',
    note: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    neighborhoodId: '00000000-0000-4000-8000-0000000000aa',
    wasteType: 'RECYCLABLE',
    weekday: 'THURSDAY',
    shift: 'AFTERNOON',
    note: 'Lavar antes',
  },
]

// Monday 2026-11-02, 08:00 in Manaus.
const NOW = '2026-11-02T08:00:00-04:00'

describe('WasteCalendar', () => {
  it('renders 14 days in the strip, each with a spoken description', () => {
    render(
      <WasteCalendar passes={PASSES} now={NOW}>
        <WasteCalendarStrip />
      </WasteCalendar>,
    )

    const strip = screen.getByRole('region')

    expect(within(strip).getAllByRole('listitem')).toHaveLength(14)
    expect(strip.textContent).toMatch(/orgânico/i)
  })

  it('selecting a day in the month updates the detail', async () => {
    const user = userEvent.setup()
    render(
      <WasteCalendar passes={PASSES} now={NOW}>
        <WasteCalendarMonth month="2026-11" onMonthChange={() => undefined} />
        <WasteCalendarDetail />
      </WasteCalendar>,
    )

    await user.click(screen.getByRole('button', { name: /5 de novembro/i }))

    expect(
      within(screen.getByRole('heading', { level: 3 }).parentElement ?? document.body)
        .getByText('Lavar antes'),
    ).toBeTruthy()
  })

  it('asks for the previous month through the callback', async () => {
    const user = userEvent.setup()
    const months: Array<string> = []
    render(
      <WasteCalendar passes={PASSES} now={NOW}>
        <WasteCalendarMonth month="2027-01" onMonthChange={(next) => {
            months.push(next)
          }} />
      </WasteCalendar>,
    )

    await user.click(screen.getByRole('button', { name: /anterior|previous/i }))

    expect(months).toEqual(['2026-12'])
  })

  it('lists only the waste types the neighborhood really has in the legend', () => {
    render(
      <WasteCalendar passes={PASSES} now={NOW}>
        <WasteCalendarLegend />
      </WasteCalendar>,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
