import type { ReportKind } from '@curupira/shared'
import * as React from 'react'

import { cn } from '#/lib/cn'
import { REPORT_KIND_ICONS } from '#/lib/icons'
import { REPORT_KIND_HINTS, REPORT_KIND_LABELS } from '#/lib/labels'

import { useReportKindPickerContext } from './report-kind-picker-context'

/** The group's name, announced before the options. Visible, never a placeholder. */
export function ReportKindPickerLegend({
  className,
  ...props
}: React.ComponentProps<'legend'>): React.JSX.Element {
  return (
    <legend
      data-slot="report-kind-picker-legend"
      className={cn('mb-3 text-base font-semibold', className)}
      {...props}
    />
  )
}

type ReportKindPickerOptionProps = Readonly<{
  kind: ReportKind
}>

/** Burning is the only kind that gets the alert color: it is the urgent one. */
const ICON_TONES = {
  BURNING: 'bg-alert text-white',
  DUMPING: 'bg-primary text-primary-foreground',
  DEFORESTATION: 'bg-primary text-primary-foreground',
  OTHER: 'bg-secondary text-secondary-foreground',
} satisfies Record<ReportKind, string>

export function ReportKindPickerOption({
  kind,
}: ReportKindPickerOptionProps): React.JSX.Element {
  const { name, value, onValueChange, invalid } =
    useReportKindPickerContext('ReportKindPickerOption')
  const Icon = REPORT_KIND_ICONS[kind]

  return (
    <label
      data-slot="report-kind-picker-option"
      className={cn(
        'group relative flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow',
        'has-checked:shadow-[0_0_0_3px_var(--primary)] has-focus-visible:shadow-[0_0_0_4px_var(--ring)]',
        'hover:shadow-card-hover motion-reduce:transition-none',
        invalid && 'shadow-[0_0_0_2px_var(--destructive)]',
      )}
    >
      <input
        type="radio"
        name={name}
        value={kind}
        checked={value === kind}
        onChange={() => onValueChange(kind)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-xl',
          ICON_TONES[kind],
        )}
      >
        <Icon className="size-7" weight="fill" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-lg leading-tight font-bold">
          {REPORT_KIND_LABELS[kind]()}
        </span>
        <span className="text-sm text-muted-foreground">
          {REPORT_KIND_HINTS[kind]()}
        </span>
      </span>
    </label>
  )
}
