// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ReportMapCanvas } from './report-map-canvas'
import { ReportMapProvider } from './report-map-context'

afterEach(cleanup)

describe('ReportMapCanvas', () => {
  it('names the Leaflet container itself, because MapContainer drops `aria-label`', async () => {
    render(
      <ReportMapProvider
        value={{
          center: { latitude: -4.38, longitude: -70.03 },
          zoom: 14,
          label: 'Mapa das ocorrências',
        }}
      >
        <ReportMapCanvas />
      </ReportMapProvider>,
    )

    const map = await screen.findByRole('group', {
      name: 'Mapa das ocorrências',
    })

    expect(map.classList.contains('leaflet-container')).toBe(true)
  })
})
