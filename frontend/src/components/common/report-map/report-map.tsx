import { ClientOnly } from '@tanstack/react-router'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/cn'
import { TOWN_CENTER, TOWN_ZOOM } from '#/lib/geo'
import type { Coordinate } from '#/lib/geo'
import { m } from '#/paraglide/messages'

import { ReportMapProvider } from './report-map-context'

/**
 * Leaflet touches `window` as soon as it is imported, and weighs about 40 KB. So the
 * canvas is a lazy chunk, loaded only in the browser and only on the screens that draw
 * a map: the home, the schedule and the tracking page never download it. That is the
 * slow-network rule for this app. The parts that live inside the map (`ReportMapPins`,
 * `ReportMapPicker`) are lazy for the same reason.
 *
 * Leaflet + react-leaflet are not covered by `_doc-lib`. Official pages consulted:
 * https://leafletjs.com/reference.html and https://react-leaflet.js.org/docs/start-introduction/
 *
 * `async`/`await` inside `lazy`, and not `.then`: `lazy` needs a module with a
 * `default`, and the named export is mapped to it here.
 */
const ReportMapCanvas = React.lazy(async () => {
  const module = await import('./report-map-canvas')

  return { default: module.ReportMapCanvas }
})

type ReportMapProps = Readonly<{
  center?: Coordinate
  zoom?: number
  /** The accessible name of the map, e.g. "Mapa das ocorrências". */
  label: string
  className?: string
  children?: React.ReactNode
}>

export function ReportMap({
  center = TOWN_CENTER,
  zoom = TOWN_ZOOM,
  label,
  className,
  children,
}: ReportMapProps): React.JSX.Element {
  const placeholder = (
    <Skeleton
      role="status"
      aria-label={m.map_loading()}
      className="size-full rounded-2xl"
    />
  )

  const unavailable = (
    <p
      role="alert"
      className="grid size-full place-items-center p-6 text-center text-base font-semibold text-muted-foreground"
    >
      {m.map_unavailable()}
    </p>
  )

  return (
    <ReportMapProvider value={{ center, zoom, label }}>
      <div
        data-slot="report-map"
        className={cn(
          'relative isolate h-96 overflow-hidden rounded-2xl bg-muted shadow-card',
          className,
        )}
      >
        <ClientOnly fallback={placeholder}>
          {/* The map chunk is a network request like any other, and a resident with no
              signal may never have opened a map: without this boundary the failed import
              would take the whole screen down with it (the form must still work). */}
          <ErrorBoundary fallback={unavailable}>
            <React.Suspense fallback={placeholder}>
              <ReportMapCanvas>{children}</ReportMapCanvas>
            </React.Suspense>
          </ErrorBoundary>
        </ClientOnly>
      </div>
    </ReportMapProvider>
  )
}

/** The pins of a list of reports, with a popup each. Lazy: it imports Leaflet. */
export const ReportMapPins = React.lazy(async () => {
  const module = await import('./report-map-pins')

  return { default: module.ReportMapPins }
})

/** The draggable pin the resident places. Lazy: it imports Leaflet. */
export const ReportMapPicker = React.lazy(async () => {
  const module = await import('./report-map-picker')

  return { default: module.ReportMapPicker }
})
