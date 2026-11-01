import 'leaflet/dist/leaflet.css'

import * as React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'

import { TOWN_BOUNDS } from '#/lib/geo'

import { useReportMapContext } from './report-map-context'

/**
 * The map itself: OpenStreetMap tiles, bounded to the town so nobody drags it to the
 * other side of the world, and the attribution OSM requires
 * (https://operations.osmfoundation.org/policies/tiles/). `children` are the pins.
 */
export function ReportMapCanvas({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.JSX.Element {
  const { center, zoom, label } = useReportMapContext('ReportMapCanvas')

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
      aria-label={label}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
