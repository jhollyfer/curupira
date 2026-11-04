import type { ManagementNeighborhoodShowResponse } from '@curupira/shared'
import { Link } from '@tanstack/react-router'

import type { TableColumns } from '#/components/common/table'
import { Badge } from '#/components/ui/badge'
import { formatTownDate } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

import { NeighborhoodRowActions } from './row-actions'

export function neighborhoodColumns(): TableColumns<ManagementNeighborhoodShowResponse> {
  return [
    {
      id: 'name',
      header: () => m.panel_neighborhoods_col_name(),
      meta: { sortKey: 'name', card: 'title' },
      cell: ({ row }) => (
        <Link
          to="/management/neighborhoods/$id/edit"
          params={{ id: row.original.id }}
          className="font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'center',
      header: () => m.panel_neighborhoods_col_center(),
      cell: ({ row }) => {
        const { latitude, longitude } = row.original
        if (latitude === null || longitude === null)
          return (
            <Badge variant="neutral">{m.panel_neighborhoods_no_center()}</Badge>
          )

        return (
          <span className="text-sm tabular-nums">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        )
      },
    },
    {
      id: 'createdAt',
      header: () => m.panel_neighborhoods_col_created(),
      meta: { sortKey: 'createdAt', className: 'tabular-nums' },
      cell: ({ row }) =>
        formatTownDate(row.original.createdAt, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{m.common_actions()}</span>,
      meta: { className: 'w-12 text-right', card: 'actions' },
      cell: ({ row }) => <NeighborhoodRowActions neighborhood={row.original} />,
    },
  ]
}
