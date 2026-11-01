import type {
  ManagementScheduleShowResponse,
  WasteType,
  Weekday,
} from '@curupira/shared'
import { PlusIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { useIsMobile } from '#/hooks/use-mobile'
import { WASTE_TYPE_ICONS } from '#/lib/icons'
import {
  COLLECTION_SHIFT_LABELS,
  WASTE_TYPE_CLASSES,
  WASTE_TYPE_LABELS,
  weekdayLabel,
} from '#/lib/labels'
import {
  GRID_WASTE_TYPES,
  GRID_WEEKDAYS,
  groupSchedules,
} from '#/lib/schedule-grid'
import type { ScheduleGrid } from '#/lib/schedule-grid'
import { m } from '#/paraglide/messages'

import type { ScheduleDialogHandle } from './schedule-dialog'

type WeeklyGridProps = Readonly<{
  neighborhoodId: string
  entries: ReadonlyArray<ManagementScheduleShowResponse>
  dialog: ScheduleDialogHandle
}>

/**
 * The week of one neighborhood: a row per waste type, a column per weekday. A real
 * `<table>` (headers and row headers) because that is what it is - two dimensions of
 * data - and a screen reader announces "Orgânico, segunda" for every cell for free.
 *
 * Each collection is a chip in its type's fixed color (`.waste-*`) that opens the edit
 * dialog; the "+" in each cell opens the create dialog already set to that type and day.
 * The cells are 44px targets: the grid is the screen's whole job, and a missed tap on a
 * 20px chip is the most common mistake it would produce.
 */
type CellProps = Readonly<{
  neighborhoodId: string
  type: WasteType
  day: Weekday
  entries: ScheduleGrid[WasteType][Weekday]
  dialog: ScheduleDialogHandle
}>

/**
 * One (type, weekday) slot: its collections as chips plus the "+" that adds one. The
 * grid's cell and the phone's day list draw the same slot, so the buttons live once.
 */
function GridCell({
  neighborhoodId,
  type,
  day,
  entries,
  dialog,
}: CellProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-start gap-1.5 md:flex-col">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          title={entry.note ?? undefined}
          onClick={() => dialog.openWithPayload({ mode: 'edit', entry })}
          className={`${WASTE_TYPE_CLASSES[type]} min-h-11 rounded-md px-3 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-1 md:min-h-9 md:px-2.5`}
        >
          {COLLECTION_SHIFT_LABELS[entry.shift]()}
          <span className="sr-only">
            {m.panel_schedules_chip_edit({
              type: WASTE_TYPE_LABELS[type](),
              day: weekdayLabel(day),
            })}
          </span>
        </button>
      ))}
      <button
        type="button"
        aria-label={m.panel_schedules_add({
          type: WASTE_TYPE_LABELS[type](),
          day: weekdayLabel(day),
        })}
        onClick={() =>
          dialog.openWithPayload({
            mode: 'create',
            neighborhoodId,
            wasteType: type,
            weekday: day,
          })
        }
        className="grid size-11 place-items-center rounded-md border border-dashed text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:size-9"
      >
        <PlusIcon aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

/**
 * The phone's week: a section per weekday, a row per waste type. The 7 x 4 grid is 56rem
 * wide and a phone would scroll it sideways, losing the row headers - the one thing that
 * says which type a chip is. Turned the other way round (days down, types across the
 * row) it needs no horizontal travel and reads like a calendar agenda.
 */
function DayList({
  neighborhoodId,
  grid,
  dialog,
}: Readonly<{
  neighborhoodId: string
  grid: ScheduleGrid
  dialog: ScheduleDialogHandle
}>): React.JSX.Element {
  return (
    <ol
      aria-label={m.panel_schedules_grid_caption()}
      className="flex flex-col gap-3"
    >
      {GRID_WEEKDAYS.map((day) => (
        <li key={day} className="rounded-md border bg-card">
          <h3 className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">
            {weekdayLabel(day)}
          </h3>
          <ul className="flex flex-col divide-y">
            {GRID_WASTE_TYPES.map((type) => {
              const Icon = WASTE_TYPE_ICONS[type]

              return (
                <li key={type} className="flex flex-col gap-2 px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <Icon aria-hidden="true" weight="fill" className="size-4" />
                    {WASTE_TYPE_LABELS[type]()}
                  </span>
                  <GridCell
                    neighborhoodId={neighborhoodId}
                    type={type}
                    day={day}
                    entries={grid[type][day]}
                    dialog={dialog}
                  />
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}

/**
 * The week of one neighborhood: a row per waste type, a column per weekday. A real
 * `<table>` (headers and row headers) because that is what it is - two dimensions of
 * data - and a screen reader announces "Orgânico, segunda" for every cell for free. On a
 * phone it becomes a list per weekday (`DayList`).
 *
 * Each collection is a chip in its type's fixed color (`.waste-*`) that opens the edit
 * dialog; the "+" in each cell opens the create dialog already set to that type and day.
 * The targets are 44px on touch screens: the grid is the screen's whole job, and a
 * missed tap on a 20px chip is the most common mistake it would produce.
 */
export function WeeklyGrid({
  neighborhoodId,
  entries,
  dialog,
}: WeeklyGridProps): React.JSX.Element {
  const grid = groupSchedules(entries)
  const isMobile = useIsMobile()

  if (isMobile)
    return (
      <DayList neighborhoodId={neighborhoodId} grid={grid} dialog={dialog} />
    )

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <caption className="sr-only">
          {m.panel_schedules_grid_caption()}
        </caption>
        <thead>
          <tr className="border-b bg-muted/40">
            <th scope="col" className="w-40 px-3 py-2 text-left font-medium">
              {m.panel_schedules_grid_type()}
            </th>
            {GRID_WEEKDAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="px-2 py-2 text-left font-medium"
              >
                <span aria-hidden="true">{weekdayLabel(day, 'short')}</span>
                <span className="sr-only">{weekdayLabel(day)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRID_WASTE_TYPES.map((type) => {
            const Icon = WASTE_TYPE_ICONS[type]

            return (
              <tr key={type} className="border-b last:border-b-0">
                <th scope="row" className="px-3 py-3 text-left font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Icon aria-hidden="true" weight="fill" className="size-4" />
                    {WASTE_TYPE_LABELS[type]()}
                  </span>
                </th>
                {GRID_WEEKDAYS.map((day) => (
                  <td key={day} className="px-2 py-2 align-top">
                    <GridCell
                      neighborhoodId={neighborhoodId}
                      type={type}
                      day={day}
                      entries={grid[type][day]}
                      dialog={dialog}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
