import type { WasteType } from '@curupira/shared'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { DateTime, Info } from 'luxon'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import { TOWN_TIME_ZONE, townDay } from '#/lib/i18n'
import { WASTE_TYPE_ICONS } from '#/lib/icons'
import {
  COLLECTION_SHIFT_LABELS,
  WASTE_TYPE_CLASSES,
  WASTE_TYPE_HINTS,
  WASTE_TYPE_LABELS,
} from '#/lib/labels'
import { monthGrid, shiftMonth, upcomingDays } from '#/lib/schedule'
import type { CollectionDay, CollectionPass } from '#/lib/schedule'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

import { useWasteCalendarContext } from './waste-calendar-context'

const DOT_SIZES = {
  sm: { box: 'size-5', icon: 'size-3' },
  md: { box: 'size-8', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-7' },
}

type WasteDotProps = Readonly<{
  type: WasteType
  size?: keyof typeof DOT_SIZES
}>

/**
 * The fixed color of a waste type with its icon inside: color AND shape, so the type
 * is readable by someone who does not tell the colors apart. Decorative - the name is
 * always written next to it or in a visually hidden text.
 */
export function WasteDot({
  type,
  size = 'md',
}: WasteDotProps): React.JSX.Element {
  const Icon = WASTE_TYPE_ICONS[type]
  const classes = DOT_SIZES[size]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'waste-dot shrink-0',
        WASTE_TYPE_CLASSES[type],
        classes.box,
      )}
    >
      <Icon weight="fill" className={classes.icon} />
    </span>
  )
}

/** "Orgânico, manhã" - what the dots say, for the screen reader. */
function describePasses(passes: ReadonlyArray<CollectionPass>): string {
  if (passes.length === 0) return m.calendar_no_collection()

  return passes
    .map(
      (pass) =>
        `${WASTE_TYPE_LABELS[pass.wasteType]()}, ${COLLECTION_SHIFT_LABELS[pass.shift]()}`,
    )
    .join('; ')
}

function describeDay(
  day: DateTime,
  passes: ReadonlyArray<CollectionPass>,
): string {
  const date = day.toLocaleString({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return `${date}: ${describePasses(passes)}`
}

function DayDots({ day }: Readonly<{ day: CollectionDay }>): React.JSX.Element {
  // Two passes of the same type on one day (morning and afternoon) show one dot.
  const types = [...new Set(day.passes.map((pass) => pass.wasteType))]

  return (
    <span className="flex min-h-5 flex-wrap items-center justify-center gap-0.5">
      {types.map((type) => (
        <WasteDot key={type} type={type} size="sm" />
      ))}
    </span>
  )
}

/**
 * The next 14 days in a row you scroll sideways (snap to each day), today first. A
 * scrollable region needs to be reachable by keyboard, hence `tabIndex={0}` and a name.
 */
export function WasteCalendarStrip({
  days = 14,
}: Readonly<{ days?: number }>): React.JSX.Element {
  const { passes, now } = useWasteCalendarContext('WasteCalendarStrip')
  const list = upcomingDays(passes, now, days)

  return (
    <div
      data-slot="waste-calendar-strip"
      role="region"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be reachable by keyboard (WCAG 2.1.1)
      tabIndex={0}
      aria-label={m.calendar_strip_label()}
      className="-mx-4 overflow-x-auto px-4 pb-2 outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
    >
      <ul className="flex snap-x snap-mandatory gap-2">
        {list.map((day, index) => {
          const date = townDay(day.date)

          return (
            <li
              key={day.date}
              data-today={index === 0}
              className="relative flex w-16 shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl bg-card px-1 py-3 shadow-card data-[today=true]:bg-primary data-[today=true]:text-primary-foreground"
            >
              <span className="text-xs font-bold uppercase">
                {date.toLocaleString({ weekday: 'short' })}
              </span>
              <span className="text-2xl leading-none font-extrabold tabular-nums">
                {date.day}
              </span>
              <DayDots day={day} />
              <span className="sr-only">{describeDay(date, day.passes)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Sunday-first short weekday names in the screen's language, with the long name. */
function weekdayHeads(): Array<{ short: string; long: string }> {
  const locale = getLocale()
  const short = Info.weekdays('short', { locale })
  const long = Info.weekdays('long', { locale })
  // Luxon lists Monday first; the grid starts on Sunday.
  const rotate = <T,>(items: ReadonlyArray<T>): Array<T> => [
    ...items.slice(-1),
    ...items.slice(0, -1),
  ]

  return rotate(short).map((label, index) => ({
    short: label,
    long: rotate(long)[index] ?? label,
  }))
}

type WasteCalendarMonthProps = Readonly<{
  /** `YYYY-MM`. */
  month: string
  onMonthChange: (month: string) => void | Promise<void>
}>

/**
 * The month as a table: week rows, a column per weekday. Each cell is a button that
 * selects the day for `WasteCalendarDetail`; the dots are decoration and the full
 * sentence for a day is in its accessible name.
 */
export function WasteCalendarMonth({
  month,
  onMonthChange,
}: WasteCalendarMonthProps): React.JSX.Element {
  const { passes, now, selected, select } =
    useWasteCalendarContext('WasteCalendarMonth')
  const first = DateTime.fromFormat(month, 'yyyy-LL', { zone: TOWN_TIME_ZONE })
  const weeks = monthGrid(passes, first.year, first.month)
  const today = now.toFormat('yyyy-LL-dd')

  return (
    <div data-slot="waste-calendar-month" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-touch"
          aria-label={m.calendar_previous_month()}
          onClick={() => {
            void onMonthChange(shiftMonth(month, -1))
          }}
        >
          <CaretLeftIcon aria-hidden="true" weight="bold" />
        </Button>
        <h2
          aria-live="polite"
          className="text-xl font-extrabold tracking-tight first-letter:uppercase"
        >
          {first.setLocale(getLocale()).toLocaleString({
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon-touch"
          aria-label={m.calendar_next_month()}
          onClick={() => {
            void onMonthChange(shiftMonth(month, 1))
          }}
        >
          <CaretRightIcon aria-hidden="true" weight="bold" />
        </Button>
      </div>
      <table className="w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">{m.calendar_caption()}</caption>
        <thead>
          <tr>
            {weekdayHeads().map((head) => (
              <th
                key={head.long}
                scope="col"
                className="pb-1 text-xs font-bold text-muted-foreground uppercase"
              >
                <abbr title={head.long} className="no-underline">
                  {head.short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.date}>
              {week.map((cell) => {
                const date = townDay(cell.date)

                return (
                  <td key={cell.date} className="p-0">
                    <button
                      type="button"
                      aria-pressed={selected === cell.date}
                      aria-label={describeDay(date, cell.passes)}
                      data-outside={!cell.inMonth}
                      data-today={cell.date === today}
                      onClick={() => select(cell.date)}
                      className="flex min-h-14 w-full flex-col items-center justify-start gap-1 rounded-xl bg-card px-0.5 py-1.5 text-base font-bold tabular-nums shadow-card transition-colors outline-none hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring/60 aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[outside=true]:opacity-40 data-[today=true]:shadow-[0_0_0_2px_var(--primary)] motion-reduce:transition-none"
                    >
                      <span aria-hidden="true">{date.day}</span>
                      <DayDots day={cell} />
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** What passes on the selected day, in words. */
export function WasteCalendarDetail(): React.JSX.Element {
  const { passes, selected } = useWasteCalendarContext('WasteCalendarDetail')
  const date = townDay(selected)
  const dayPasses = upcomingDays(passes, date, 1)[0]?.passes ?? []

  return (
    <section
      data-slot="waste-calendar-detail"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl bg-surface-warm p-4"
    >
      <h3 className="text-lg font-extrabold first-letter:uppercase">
        {date.toLocaleString({
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </h3>
      {dayPasses.length === 0 && (
        <p className="text-base text-muted-foreground">
          {m.calendar_no_collection()}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {dayPasses.map((pass) => (
          <li key={pass.id} className="flex items-start gap-3">
            <WasteDot type={pass.wasteType} />
            <div className="flex min-w-0 flex-col">
              <p className="text-base font-bold">
                {WASTE_TYPE_LABELS[pass.wasteType]()}
                <span className="font-medium text-muted-foreground">
                  {' '}
                  {COLLECTION_SHIFT_LABELS[pass.shift]()}
                </span>
              </p>
              {pass.note && (
                <p className="text-sm text-muted-foreground">{pass.note}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The four colors and what goes in each collection: the key to every dot. */
export function WasteCalendarLegend(): React.JSX.Element {
  const types = [
    ...new Set(
      useWasteCalendarContext('WasteCalendarLegend').passes.map(
        (pass) => pass.wasteType,
      ),
    ),
  ]

  return (
    <section data-slot="waste-calendar-legend" className="flex flex-col gap-3">
      <h3 className="text-lg font-extrabold">{m.calendar_legend_title()}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {types.map((type) => (
          <li key={type} className="flex items-start gap-3">
            <WasteDot type={type} />
            <div className="flex flex-col">
              <p className="text-base font-bold">{WASTE_TYPE_LABELS[type]()}</p>
              <p className="text-sm text-muted-foreground">
                {WASTE_TYPE_HINTS[type]()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
