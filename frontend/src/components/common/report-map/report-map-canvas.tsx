import 'leaflet/dist/leaflet.css'

import * as React from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

import { TOWN_BOUNDS } from '#/lib/geo'
import { prefersReducedMotion } from '#/lib/motion'

import { useReportMapContext } from './report-map-context'

/**
 * Names the Leaflet container. `MapContainer` only forwards `className`, `style`, `id`
 * and `placeholder` to its `div`, so an `aria-label` passed to it never reached the DOM:
 * the focusable map was announced as a bare "group" with no name. The attribute is set on
 * the real element, once the map exists, and follows the label when the language changes.
 */
function MapName({ label }: Readonly<{ label: string }>): null {
  const map = useMap()

  React.useEffect(() => {
    const container = map.getContainer()
    container.setAttribute('role', 'group')
    container.setAttribute('aria-label', label)
  }, [map, label])

  return null
}

/**
 * The map itself: OpenStreetMap tiles, bounded to the town so nobody drags it to the
 * other side of the world, and the attribution OSM requires
 * (https://operations.osmfoundation.org/policies/tiles/). `children` are the pins.
 */
export function ReportMapCanvas({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.JSX.Element {
  const { center, zoom, label } = useReportMapContext('ReportMapCanvas')
  // Leaflet's zoom, pan and fade run in JS: only an option can stop them.
  const animate = !prefersReducedMotion()

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={zoom}
      minZoom={12}
      maxZoom={18}
      maxBounds={[
        [TOWN_BOUNDS.south, TOWN_BOUNDS.west],
        [TOWN_BOUNDS.north, TOWN_BOUNDS.east],
      ]}
      maxBoundsViscosity={1}
      scrollWheelZoom={false}
      zoomAnimation={animate}
      fadeAnimation={animate}
      markerZoomAnimation={animate}
      className="size-full"
    >
      <MapName label={label} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
