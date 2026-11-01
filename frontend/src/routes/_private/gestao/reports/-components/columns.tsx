import type { ManagementReportListItemResponse } from '@curupira/shared'
import { Link } from '@tanstack/react-router'

import { StatusBadge } from '#/components/common/status-badge'
import type { TableColumns } from '#/components/common/table'
import { formatTownDate } from '#/lib/i18n'
import { REPORT_KIND_ICONS } from '#/lib/icons'
import { REPORT_KIND_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

/**
 * The protocol is the row's real link (keyboard and middle-click work); the row click in
 * `table.tsx` is the mouse convenience on top. Kind carries icon + name, never a color
 * alone. The date is short (the hour is on the detail): the table shares the width with the map.
 */
export function reportColumns(): TableColumns<ManagementReportListItemResponse> {
  return [
    {
      id: 'protocol',
      header: () => m.panel_reports_col_protocol(),
      meta: { card: 'title' },
      cell: ({ row }) => (
        <Link
          to="/gestao/reports/$id"
          params={{ id: row.original.id }}
          className="font-mono text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {row.original.protocol}
        </Link>
      ),
    },
    {
      id: 'kind',
      header: () => m.panel_reports_col_kind(),
      meta: { sortKey: 'kind' },
      cell: ({ row }) => {
        const Icon = REPORT_KIND_ICONS[row.original.kind]

        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Icon aria-hidden="true" weight="fill" className="size-4" />
            {REPORT_KIND_LABELS[row.original.kind]()}
          </span>
        )
      },
    },
    {
      id: 'status',
      header: () => m.panel_reports_col_status(),
      meta: { sortKey: 'status' },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'neighborhood',
      header: () => m.panel_reports_col_neighborhood(),
      cell: ({ row }) =>
        row.original.neighborhoodName ?? (
          <span className="text-muted-foreground">
            {m.panel_reports_no_neighborhood()}
          </span>
        ),
    },
    {
      id: 'createdAt',
      header: () => m.panel_reports_col_received(),
      meta: {
        sortKey: 'createdAt',
        className: 'whitespace-nowrap tabular-nums',
      },
      cell: ({ row }) =>
        formatTownDate(row.original.createdAt, {
          day: '2-digit',
          month: 'short',
        }),
    },
  ]
}
