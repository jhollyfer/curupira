import { REPORT_STATUSES } from '@curupira/shared'
import type { ReportStatus } from '@curupira/shared'
import { CheckIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { cn } from '#/lib/cn'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_STATUS_ICONS } from '#/lib/icons'
import { REPORT_STATUS_HINTS, REPORT_STATUS_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { useStatusTimelineContext } from './status-timeline-context'

type StepState = 'done' | 'current' | 'todo'

/**
 * Where a step stands relative to the report. The last status is both current and
 * finished: a resolved report is "done", not "in progress".
 */
function stateOf(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return 'done'
  if (index === currentIndex) return 'current'

  return 'todo'
}

function StatusTimelineStep({
  status,
  index,
}: Readonly<{ status: ReportStatus; index: number }>): React.JSX.Element {
  const { current, events } = useStatusTimelineContext('StatusTimelineSteps')
  const state = stateOf(index, REPORT_STATUSES.indexOf(current))
  const event = [...events].reverse().find((item) => item.status === status)
  const Icon = REPORT_STATUS_ICONS[status]

  return (
    <li
      data-state={state}
      aria-current={(state === 'current' && 'step') || undefined}
      className="group relative flex gap-4 pb-8 last:pb-0"
    >
      <span
        aria-hidden="true"
        className="absolute top-12 bottom-0 left-5.5 w-0.5 bg-border group-last:hidden group-data-[state=done]:bg-primary"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative z-1 grid size-11 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground',
          'group-data-[state=done]:border-primary group-data-[state=done]:bg-primary group-data-[state=done]:text-primary-foreground',
          'group-data-[state=current]:border-primary group-data-[state=current]:text-primary group-data-[state=current]:shadow-[0_0_0_4px_var(--accent)]',
        )}
      >
        <Icon className="size-5 group-data-[state=done]:hidden" weight="fill" />
        <CheckIcon
          className="hidden size-5 group-data-[state=done]:block"
          weight="bold"
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1 pt-1.5">
        <p
          className={cn(
            'text-lg leading-tight font-bold',
            state === 'todo' && 'text-muted-foreground',
          )}
        >
          {REPORT_STATUS_LABELS[status]()}
          <span className="sr-only">
            {m.timeline_state_sr({ state: stateText(state) })}
          </span>
        </p>
        {event && (
          <p className="text-sm text-muted-foreground">
            {formatTownDate(event.at, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {event?.message && <p className="text-base">{event.message}</p>}
        {state === 'current' && !event?.message && (
          <p className="text-base text-muted-foreground">
            {REPORT_STATUS_HINTS[status]()}
          </p>
        )}
      </div>
    </li>
  )
}

const STATE_TEXTS = {
  done: () => m.timeline_state_done(),
  current: () => m.timeline_state_current(),
  todo: () => m.timeline_state_todo(),
} satisfies Record<StepState, () => string>

function stateText(state: StepState): string {
  return STATE_TEXTS[state]()
}

/** The four steps, in the order the resident follows them. */
export function StatusTimelineSteps({
  className,
}: Readonly<{ className?: string }>): React.JSX.Element {
  return (
    <ol
      data-slot="status-timeline-steps"
      aria-label={m.timeline_label()}
      className={cn('flex flex-col', className)}
    >
      {REPORT_STATUSES.map((status, index) => (
        <StatusTimelineStep key={status} status={status} index={index} />
      ))}
    </ol>
  )
}
