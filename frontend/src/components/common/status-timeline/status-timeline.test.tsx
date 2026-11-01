// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { StatusTimeline, StatusTimelineSteps } from './index'

afterEach(cleanup)

const EVENTS = [
  { status: 'RECEIVED', message: null, at: '2026-11-01T10:00:00-04:00' },
  {
    status: 'IN_REVIEW',
    message: 'Foto conferida.',
    at: '2026-11-02T09:00:00-04:00',
  },
] as const

describe('StatusTimeline', () => {
  it('lists the four steps in order', () => {
    render(
      <StatusTimeline current="IN_REVIEW" events={EVENTS}>
        <StatusTimelineSteps />
      </StatusTimeline>,
    )

    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(4)
  })

  it('marks only the current step and shows its message', () => {
    render(
      <StatusTimeline current="IN_REVIEW" events={EVENTS}>
        <StatusTimelineSteps />
      </StatusTimeline>,
    )

    const current = screen
      .getAllByRole('listitem')
      .filter((item) => item.getAttribute('aria-current') === 'step')

    expect(current).toHaveLength(1)
    expect(current[0]?.textContent).toContain('Foto conferida.')
  })

  it('treats a resolved report as all done up to the last step', () => {
    render(
      <StatusTimeline current="RESOLVED" events={[]}>
        <StatusTimelineSteps />
      </StatusTimeline>,
    )

    const states = screen
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('data-state'))

    expect(states).toEqual(['done', 'done', 'done', 'current'])
  })

  it('throws outside the provider', () => {
    expect(() => render(<StatusTimelineSteps />)).toThrow(
      /within `StatusTimeline`/,
    )
  })
})
