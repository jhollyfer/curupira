import type { ManagementUserShowResponse } from '@curupira/shared'
import { Link } from '@tanstack/react-router'

import type { TableColumns } from '#/components/common/table'
import { Badge } from '#/components/ui/badge'
import {
  ACTIVE_STATUS_LABELS,
  ACTIVE_STATUS_VARIANTS,
  USER_ROLE_LABELS,
} from '#/lib/labels'
import { m } from '#/paraglide/messages'

import { UserRowActions } from './row-actions'

export function userColumns(): TableColumns<ManagementUserShowResponse> {
  return [
    {
      id: 'name',
      header: () => m.panel_users_col_name(),
      meta: { sortKey: 'name' },
      cell: ({ row }) => (
        <Link
          to="/gestao/users/$id/edit"
          params={{ id: row.original.id }}
          className="font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'email',
      header: () => m.panel_users_col_email(),
      meta: { sortKey: 'email' },
      cell: ({ row }) => row.original.email,
    },
    {
      id: 'role',
      header: () => m.panel_users_col_role(),
      cell: ({ row }) => USER_ROLE_LABELS[row.original.role](),
    },
    {
      id: 'status',
      header: () => m.panel_users_col_status(),
      cell: ({ row }) => (
        <Badge variant={ACTIVE_STATUS_VARIANTS[row.original.status]}>
          {ACTIVE_STATUS_LABELS[row.original.status]()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{m.common_actions()}</span>,
      meta: { className: 'w-12 text-right' },
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <UserRowActions user={row.original} />
        </div>
      ),
    },
  ]
}
