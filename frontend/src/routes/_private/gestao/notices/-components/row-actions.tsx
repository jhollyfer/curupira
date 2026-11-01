import type { ManagementNoticeShowResponse } from '@curupira/shared'
import { PencilSimpleIcon, ProhibitIcon } from '@phosphor-icons/react'
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
import {
  useManagementNoticeCloseMutation,
  useManagementNoticeDeleteMutation,
} from '#/integrations/tanstack-query/mutations/management'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { notifyError } from '#/lib/form-errors'
import { m } from '#/paraglide/messages'

/**
 * Edit, close and delete. Closing is not deleting: it ends the notice *now* and keeps it
 * in the list as CLOSED, which is what a manager wants when the information expired;
 * delete is for a notice published by mistake. Both confirm, and both invalidate the
 * public notices too (`DEPENDENTS.notices`), so the home stops showing it at once.
 */
export function NoticeRowActions({
  notice,
}: Readonly<{ notice: ManagementNoticeShowResponse }>): React.JSX.Element {
  const invalidate = useInvalidate()
  const [closeHandle] = React.useState(createConfirmHandle)
  const [deleteHandle] = React.useState(createConfirmHandle)

  function refresh(): Promise<void> {
    return invalidate([
      queryKeys.management.notices.all,
      ...DEPENDENTS.notices,
    ])
  }

  const close = useManagementNoticeCloseMutation({
    onError: (error) => notifyError(error, { id: 'notice-close' }),
    onSuccess: () => {
      toast.success(m.panel_notices_closed())
      return refresh()
    },
  })

  const remove = useManagementNoticeDeleteMutation({
    onError: (error) => notifyError(error, { id: 'notice-delete' }),
    onSuccess: () => {
      toast.success(m.panel_notices_removed())
      return refresh()
    },
  })

  return (
    <RowActions
      dialogs={
        <React.Fragment>
          <RowActionsConfirm
            handle={closeHandle}
            confirmLabel={m.panel_notices_close()}
            onConfirm={() => close.mutate(notice.id)}
          >
            <ConfirmDialogTitle>
              {m.panel_notices_close_title({ title: notice.title })}
            </ConfirmDialogTitle>
            <ConfirmDialogDescription>
              {m.panel_notices_close_description()}
            </ConfirmDialogDescription>
          </RowActionsConfirm>
          <RowActionsConfirm
            handle={deleteHandle}
            destructive
            confirmLabel={m.common_delete()}
            onConfirm={() => remove.mutate(notice.id)}
          >
            <ConfirmDialogTitle>
              {m.panel_notices_delete_title({ title: notice.title })}
            </ConfirmDialogTitle>
            <ConfirmDialogDescription>
              {m.panel_notices_delete_description()}
            </ConfirmDialogDescription>
          </RowActionsConfirm>
        </React.Fragment>
      }
    >
      <DropdownMenuItem
        render={
          <Link to="/gestao/notices/$id/edit" params={{ id: notice.id }}>
            <PencilSimpleIcon aria-hidden="true" />
            {m.common_edit()}
          </Link>
        }
      />
      {notice.status !== 'CLOSED' && (
        <DropdownMenuItem onClick={() => closeHandle.open(null)}>
          <ProhibitIcon aria-hidden="true" />
          {m.panel_notices_close()}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <RowActionsDelete handle={deleteHandle} />
    </RowActions>
  )
}
