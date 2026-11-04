// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'
import { NextCollection } from '#/routes/_public/-components/next-collection'

import { CITY_HALL_URL, NoSchedule } from './index'

afterEach(cleanup)

describe('NoSchedule', () => {
  it('says the schedule is missing and links to the city hall in a new tab', () => {
    render(<NoSchedule />)

    expect(screen.getByText(m.no_schedule_title())).toBeTruthy()
    const link = screen.getByRole('link', {
      name: new RegExp(m.no_schedule_city_hall()),
    })
    expect(link.getAttribute('href')).toBe(CITY_HALL_URL)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('is what the next collection shows for a neighborhood with no schedule', () => {
    render(<NextCollection passes={[]} now="2026-11-04T08:00:00-04:00" />)

    expect(screen.getByText(m.no_schedule_title())).toBeTruthy()
    expect(screen.queryByText(m.home_no_collection())).toBeNull()
  })
})
