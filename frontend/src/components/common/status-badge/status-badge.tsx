import type { ReportStatus } from '@curupira/shared'
import type * as React from 'react'

import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/cn'
import { REPORT_STATUS_ICONS } from '#/lib/icons'
import { REPORT_STATUS_LABELS, REPORT_STATUS_VARIANTS } from '#/lib/labels'

type StatusBadgeProps = Readonly<{
  status: ReportStatus
  className?: string
}>

/**
 * A report status as a badge: color from the scale, plus icon and name, so the status
 * never depends on color. Sized for reading on a phone (the `Badge` default is 10px,
 * made for dense tables) - the panel reuses it as is.
 */
export function StatusBadge({
  status,
  className,
}: StatusBadgeProps): React.JSX.Element {
  const Icon = REPORT_STATUS_ICONS[status]

  return (
    <Badge
      variant={REPORT_STATUS_VARIANTS[status]}
      className={cn('h-7 gap-1.5 px-3 text-sm font-semibold', className)}
    >
      <Icon aria-hidden="true" weight="fill" className="size-4!" />
      {REPORT_STATUS_LABELS[status]()}
    </Badge>
  )
}
