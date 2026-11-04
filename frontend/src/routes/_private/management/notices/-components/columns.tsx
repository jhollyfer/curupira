import type { ManagementNoticeShowResponse } from '@curupira/shared'
import { Link } from '@tanstack/react-router'

import type { TableColumns } from '#/components/common/table'
import { Badge } from '#/components/ui/badge'
import { formatTownDate } from '#/lib/i18n'
import { NOTICE_STATUS_LABELS, NOTICE_STATUS_VARIANTS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { NoticeRowActions } from './row-actions'

const DATE = {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
} as const

export function noticeColumns(): TableColumns<ManagementNoticeShowResponse> {
  return [
    {
      id: 'title',
      header: () => m.panel_notices_col_title(),
      meta: { sortKey: 'title', className: 'max-w-80', card: 'title' },
      cell: ({ row }) => (
        <Link
          to="/management/notices/$id/edit"
          params={{ id: row.original.id }}
          className="block truncate font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      id: 'status',
      header: () => m.panel_notices_col_status(),
      cell: ({ row }) => (
        <Badge variant={NOTICE_STATUS_VARIANTS[row.original.status]}>
          {NOTICE_STATUS_LABELS[row.original.status]()}
        </Badge>
      ),
    },
    {
      id: 'startsAt',
      header: () => m.panel_notices_col_starts(),
      meta: { sortKey: 'startsAt', className: 'tabular-nums' },
      cell: ({ row }) => formatTownDate(row.original.startsAt, DATE),
    },
    {
      id: 'endsAt',
      header: () => m.panel_notices_col_ends(),
      meta: { className: 'tabular-nums' },
      cell: ({ row }) => {
        if (!row.original.endsAt)
          return (
            <span className="text-muted-foreground">
              {m.panel_notices_no_end()}
            </span>
          )

        return formatTownDate(row.original.endsAt, DATE)
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{m.common_actions()}</span>,
      meta: { className: 'w-12 text-right', card: 'actions' },
      cell: ({ row }) => <NoticeRowActions notice={row.original} />,
    },
  ]
}
