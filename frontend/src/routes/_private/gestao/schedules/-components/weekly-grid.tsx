import type { ManagementScheduleShowResponse } from '@curupira/shared'
import { PlusIcon } from '@phosphor-icons/react'
import type * as React from 'react'

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
export function WeeklyGrid({
  neighborhoodId,
  entries,
  dialog,
}: WeeklyGridProps): React.JSX.Element {
  const grid = groupSchedules(entries)

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
                    <div className="flex flex-col items-start gap-1.5">
                      {grid[type][day].map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          title={entry.note ?? undefined}
                          onClick={() =>
                            dialog.openWithPayload({ mode: 'edit', entry })
                          }
                          className={`${WASTE_TYPE_CLASSES[type]} min-h-9 rounded-md px-2.5 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-1`}
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
                        className="grid size-9 place-items-center rounded-md border border-dashed text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <PlusIcon aria-hidden="true" className="size-4" />
                      </button>
                    </div>
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
