// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ReportMap } from './index'
import { useReportMapContext } from './report-map-context'

afterEach(cleanup)

function Probe() {
  useReportMapContext('Probe')

  return <p>dentro</p>
}

describe('ReportMap', () => {
  it('shows a named loading placeholder until the map chunk arrives', () => {
    render(<ReportMap label="Mapa das ocorrências" />)

    expect(screen.getByRole('status', { name: /carregando/i })).toBeTruthy()
  })

  it('shares the center, zoom and label with the parts', () => {
    expect(() => render(<Probe />)).toThrow(/within `ReportMap`/)
  })
})
