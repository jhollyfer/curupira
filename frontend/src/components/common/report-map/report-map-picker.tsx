import type { ReportKind } from '@curupira/shared'
import * as React from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'

import { clampToTown } from '#/lib/geo'
import type { Coordinate } from '#/lib/geo'
import { prefersReducedMotion } from '#/lib/motion'

import { reportPinIcon } from './report-pin-icon'

type ReportMapPickerProps = Readonly<{
  /** Absent until the resident (or the GPS) places the pin; a tap on the map places it. */
  value: Coordinate | undefined
  onChange: (coordinate: Coordinate) => void
  kind: ReportKind
}>

/**
 * The pin the resident places: drag it, tap the map to move it, or - from the keyboard -
 * pan the map with the arrow keys and press Enter to drop the pin at the center (a
 * draggable marker alone would leave keyboard users with no way to place it). It also
 * follows the value, so "use my location" moves it and the map flies to it.
 * The coordinate is always pulled inside the town's box.
 */
export function ReportMapPicker({
  value,
  onChange,
  kind,
}: ReportMapPickerProps) {
  const map = useMap()

  useMapEvents({
    click: (event) =>
      onChange(
        clampToTown({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        }),
      ),
  })

  const latitude = value?.latitude
  const longitude = value?.longitude

  React.useEffect(() => {
    if (latitude === undefined || longitude === undefined) return

    const zoom = Math.max(map.getZoom(), 16)

    // `flyTo` swoops across the map: with reduced motion the view just jumps.
    if (prefersReducedMotion())
      map.setView([latitude, longitude], zoom, { animate: false })
    else map.flyTo([latitude, longitude], zoom, { duration: 0.6 })
  }, [map, latitude, longitude])

  React.useEffect(() => {
    const container = map.getContainer()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return
      const center = map.getCenter()
      onChange(clampToTown({ latitude: center.lat, longitude: center.lng }))
    }

    container.addEventListener('keydown', onKeyDown)

    return () => container.removeEventListener('keydown', onKeyDown)
  }, [map, onChange])

  if (!value) return null

  return (
    <Marker
      draggable
      position={[value.latitude, value.longitude]}
      icon={reportPinIcon(kind, undefined, 'picker')}
      eventHandlers={{
        dragend: (event) => {
          const next = event.target.getLatLng()
          onChange(clampToTown({ latitude: next.lat, longitude: next.lng }))
        },
      }}
    />
  )
}
