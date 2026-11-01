import type { Merge } from '@curupira/shared'
import { TrashIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import {
  ConfirmDialog,
  ConfirmDialogCancel,
  ConfirmDialogConfirm,
  ConfirmDialogFooter,
  ConfirmDialogHeader,
} from '#/components/common/confirm-dialog'
import { DropdownMenuItem } from '#/components/ui/dropdown-menu'
import type { ConfirmHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'

type RowActionsItemProps = Readonly<{
  /** The handle of the alert this item opens (`createConfirmHandle`). */
  handle: ConfirmHandle
}>

type MenuConfirmProps = Readonly<
  Merge<
    RowActionsItemProps,
    {
      slot: string
      icon: React.ReactNode
      label: string
      destructive?: boolean
    }
  >
>

/**
 * A menu item that asks for confirmation.
 *
 * The item only opens the alert: `handle.open(null)` on click, and the menu closes like
 * any item. The alert is `RowActionsConfirm`, a sibling of the menu.
 */
function MenuConfirm({
  slot,
  icon,
  label,
  destructive = false,
  handle,
}: MenuConfirmProps): React.JSX.Element {
  let variant: 'destructive' | 'default' = 'default'
  if (destructive) variant = 'destructive'

  return (
    <DropdownMenuItem
      data-slot={slot}
      variant={variant}
      onClick={() => handle.open(null)}
    >
      {icon}
      {label}
    </DropdownMenuItem>
  )
}

type RowActionsConfirmProps = Readonly<{
  handle: ConfirmHandle
  /** The row's mutation, already with the id: `() => remove.mutate(row.id)`. */
  onConfirm: () => void
  /** The text of the button that confirms. */
  confirmLabel: string
  /** An irreversible action paints the confirm button red. */
  destructive?: boolean
  /**
   * `ConfirmDialogTitle` and `ConfirmDialogDescription`.
   *
   * The text stays with the screen because it is the screen's: some listings state the concrete
   * effect ("sai da vitrine na hora") and others the generic sentence. Fixing it here
   * would force the generic one on all of them.
   */
  children: React.ReactNode
}>

/** A menu item's alert, for `RowActions`' `dialogs`. */
export function RowActionsConfirm({
  handle,
  onConfirm,
  confirmLabel,
  destructive = false,
  children,
}: RowActionsConfirmProps): React.JSX.Element {
  return (
    <ConfirmDialog
      handle={handle}
      destructive={destructive}
      onConfirm={onConfirm}
    >
      <ConfirmDialogHeader>{children}</ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>{confirmLabel}</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}

type RowActionsDeleteProps = Readonly<
  Merge<
    RowActionsItemProps,
    {
      /** The item's text. "Excluir" by default. */
      label?: string
    }
  >
>

/**
 * Delete the row for good. The panel's resources have no trash: a delete is final, so
 * the item only opens the confirmation (`RowActionsConfirm`), it never deletes by itself.
 */
export function RowActionsDelete({
  label = m.common_delete(),
  ...props
}: RowActionsDeleteProps): React.JSX.Element {
  return (
    <MenuConfirm
      slot="row-actions-delete"
      icon={<TrashIcon />}
      label={label}
      destructive
      {...props}
    />
  )
}
