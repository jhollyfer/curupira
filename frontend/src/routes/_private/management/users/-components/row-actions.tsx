import type { ManagementUserShowResponse } from '@curupira/shared'
import { PencilSimpleIcon } from '@phosphor-icons/react'
import { Link, getRouteApi } from '@tanstack/react-router'
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
import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useInvalidate } from '#/integrations/tanstack-query/invalidate'
import { useManagementUserDeleteMutation } from '#/integrations/tanstack-query/mutations/management'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { notifyError } from '#/lib/form-errors'
import { m } from '#/paraglide/messages'

const privateRoute = getRouteApi('/_private')

export function UserRowActions({
  user,
}: Readonly<{ user: ManagementUserShowResponse }>): React.JSX.Element {
  const invalidate = useInvalidate()
  const { account } = privateRoute.useRouteContext()
  const [deleteHandle] = React.useState(createConfirmHandle)

  const remove = useManagementUserDeleteMutation({
    onError: (error) => notifyError(error, { id: 'user-delete' }),
    onSuccess: () => {
      toast.success(m.panel_users_removed())
      return invalidate([queryKeys.management.users.all])
    },
  })

  return (
    <RowActions
      dialogs={
        <RowActionsConfirm
          handle={deleteHandle}
          destructive
          confirmLabel={m.common_delete()}
          onConfirm={() => remove.mutate(user.id)}
        >
          <ConfirmDialogTitle>
            {m.panel_users_delete_title({ name: user.name })}
          </ConfirmDialogTitle>
          <ConfirmDialogDescription>
            {m.panel_users_delete_description()}
          </ConfirmDialogDescription>
        </RowActionsConfirm>
      }
    >
      <DropdownMenuItem
        render={
          <Link to="/management/users/$id/edit" params={{ id: user.id }}>
            <PencilSimpleIcon aria-hidden="true" />
            {m.common_edit()}
          </Link>
        }
      />
      {/* Nobody deletes themselves: the API refuses with 403 `SELF_DELETE_FORBIDDEN`, so
          the item is not offered on the signed-in user's own row. */}
      {user.id !== account.id && (
        <React.Fragment>
          <DropdownMenuSeparator />
          <RowActionsDelete handle={deleteHandle} />
        </React.Fragment>
      )}
    </RowActions>
  )
}
