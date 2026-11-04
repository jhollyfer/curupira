import { DateTime } from 'luxon'
import type * as React from 'react'

import { NoSchedule } from '#/components/common/no-schedule'
import { WasteDot } from '#/components/common/waste-calendar'
import { TOWN_TIME_ZONE, townDay } from '#/lib/i18n'
import { COLLECTION_SHIFT_LABELS, WASTE_TYPE_LABELS } from '#/lib/labels'
import { nextCollection } from '#/lib/schedule'
import type { CollectionPass } from '#/lib/schedule'
import { m } from '#/paraglide/messages'

type NextCollectionProps = Readonly<{
  passes: ReadonlyArray<CollectionPass>
  now: string
}>

/** "Hoje" and "Amanhã" read better than a weekday name; later days use the weekday. */
const RELATIVE_DAYS: Record<number, (() => string) | undefined> = {
  0: () => m.home_today(),
  1: () => m.home_tomorrow(),
}

/**
 * The big answer: the next day the truck passes, with the shift and the type. A day
 * with two passes (organic in the morning, recyclables in the afternoon) lists both; a
 * neighborhood with no collection registered at all points to the city hall instead.
 */
export function NextCollection({
  passes,
  now,
}: NextCollectionProps): React.JSX.Element {
  if (passes.length === 0) return <NoSchedule />

  const next = nextCollection(
    passes,
    DateTime.fromISO(now, { zone: TOWN_TIME_ZONE }),
  )

  if (!next) {
    return <p className="text-lg font-semibold">{m.home_no_collection()}</p>
  }

  const date = townDay(next.date)
  const headline =
    RELATIVE_DAYS[next.daysAway]?.() ?? date.toLocaleString({ weekday: 'long' })

  return (
    <section aria-labelledby="next-collection" className="flex flex-col gap-4">
      <h2
        id="next-collection"
        className="text-base font-semibold text-muted-foreground"
      >
        {m.home_next_collection()}
      </h2>
      <div className="flex flex-col">
        <p className="text-numeral font-extrabold tracking-tight first-letter:uppercase">
          {headline}
        </p>
        <p className="mt-1 text-lg font-medium text-muted-foreground">
          {date.toLocaleString({
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {next.passes.map((pass) => (
          <li key={pass.id} className="flex items-center gap-3">
            <WasteDot type={pass.wasteType} size="lg" />
            <p className="flex flex-col">
              <span className="text-xl leading-tight font-bold">
                {WASTE_TYPE_LABELS[pass.wasteType]()}
              </span>
              <span className="text-base text-muted-foreground">
                {COLLECTION_SHIFT_LABELS[pass.shift]()}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
