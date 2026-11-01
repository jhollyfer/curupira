import type { ReportKind } from '@curupira/shared'
import { CrosshairIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { ReportMap, ReportMapPicker } from '#/components/common/report-map'
import { Button } from '#/components/ui/button'
import { GeoError, clampToTown, currentPosition, isInsideTown } from '#/lib/geo'
import type { Coordinate } from '#/lib/geo'
import { m } from '#/paraglide/messages'

type LocationFieldProps = Readonly<{
  value: Coordinate | undefined
  onChange: (coordinate: Coordinate) => void
  kind: ReportKind
  invalid: boolean
  describedBy?: string
}>

type Status =
  'idle' | 'locating' | 'denied' | 'unavailable' | 'timeout' | 'outside'

const STATUS_TEXTS = {
  idle: () => m.report_location_hint(),
  locating: () => m.report_location_locating(),
  denied: () => m.report_location_denied(),
  unavailable: () => m.report_location_unavailable(),
  timeout: () => m.report_location_timeout(),
  outside: () => m.report_location_outside(),
} satisfies Record<Status, () => string>

/**
 * Where it happened. The GPS is asked once when the step opens (the resident has just
 * been told why) and again on the button; if it fails, is denied or lands outside
 * town, the pin is placed by hand: tap the map or drag the pin. The text under the map
 * always says what to do next, in a live region.
 */
export function LocationField({
  value,
  onChange,
  kind,
  invalid,
  describedBy,
}: LocationFieldProps): React.JSX.Element {
  const [status, setStatus] = React.useState<Status>('idle')
  // Close enough to see the street once a pin exists; the town view before that.
  let zoom: number | undefined
  if (value) zoom = 16

  async function locate(): Promise<void> {
    setStatus('locating')

    try {
      const position = await currentPosition()

      if (!isInsideTown(position)) {
        setStatus('outside')
        return
      }

      onChange(clampToTown(position))
      setStatus('idle')
    } catch (error) {
      if (error instanceof GeoError) setStatus(error.reason)
      else setStatus('unavailable')
    }
  }

  // Once, when the step opens and nothing is placed yet. The ref guards the double
  // effect run of development, which would otherwise ask twice.
  const asked = React.useRef(false)
  React.useEffect(() => {
    if (asked.current || value) return
    asked.current = true
    void locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- must run only on mount
  }, [])

  return (
    <div className="flex flex-col gap-3" aria-describedby={describedBy}>
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="self-start"
        disabled={status === 'locating'}
        onClick={() => {
          void locate()
        }}
      >
        <CrosshairIcon aria-hidden="true" />
        {m.report_location_use_mine()}
      </Button>

      <ReportMap
        label={m.report_location_map_label()}
        className="h-72"
        center={value}
        zoom={zoom}
      >
        <React.Suspense fallback={null}>
          <ReportMapPicker value={value} onChange={onChange} kind={kind} />
        </React.Suspense>
      </ReportMap>

      <p
        aria-live="polite"
        data-invalid={invalid}
        className="text-base text-muted-foreground data-[invalid=true]:font-semibold data-[invalid=true]:text-destructive"
      >
        {value && m.report_location_placed()}
        {!value && STATUS_TEXTS[status]()}
      </p>
      <p className="text-sm text-muted-foreground">
        {m.report_location_keyboard()}
      </p>
    </div>
  )
}
