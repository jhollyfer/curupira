import type { ManagementNeighborhoodShowResponse } from '@curupira/shared'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { toast } from 'sonner'

import {
  ConfirmDialogDescription,
  ConfirmDialogTitle,
} from '#/components/common/confirm-dialog'
import {
  RowActions,
  RowActionsConfirm,
  RowActionsDelete,
} from '#/components/common/row-actions'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/ui/dropdown-menu'
import { DEPENDENTS, queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useInvalidate } from '#/integrations/tanstack-query/invalidate'
import { useManagementNeighborhoodDeleteMutation } from '#/integrations/tanstack-query/mutations/management'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { notifyError } from '#/lib/form-errors'
import { m } from '#/paraglide/messages'

export function NeighborhoodRowActions({
  neighborhood,
}: Readonly<{
  neighborhood: ManagementNeighborhoodShowResponse
}>): React.JSX.Element {
  const invalidate = useInvalidate()
  const [deleteHandle] = React.useState(createConfirmHandle)

  // The API refuses a neighborhood that still has collections (409
  // `NEIGHBORHOOD_IN_USE`); its message names the reason and `notifyError` shows it.
  const remove = useManagementNeighborhoodDeleteMutation({
    onError: (error) => notifyError(error, { id: 'neighborhood-delete' }),
    onSuccess: () => {
      toast.success(m.panel_neighborhoods_removed())
      return invalidate([
        queryKeys.management.neighborhoods.all,
        ...DEPENDENTS.neighborhoods,
      ])
    },
  })

  return (
    <RowActions
      dialogs={
        <RowActionsConfirm
          handle={deleteHandle}
          destructive
          confirmLabel={m.common_delete()}
          onConfirm={() => remove.mutate(neighborhood.id)}
        >
          <ConfirmDialogTitle>
            {m.panel_neighborhoods_delete_title({ name: neighborhood.name })}
          </ConfirmDialogTitle>
          <ConfirmDialogDescription>
            {m.panel_neighborhoods_delete_description()}
          </ConfirmDialogDescription>
        </RowActionsConfirm>
      }
    >
      <DropdownMenuItem
        render={
          <Link
            to="/gestao/neighborhoods/$id/edit"
            params={{ id: neighborhood.id }}
          >
            <PencilSimpleIcon aria-hidden="true" />
            {m.common_edit()}
          </Link>
        }
      />
      <DropdownMenuSeparator />
      <RowActionsDelete handle={deleteHandle} />
    </RowActions>
  )
}
