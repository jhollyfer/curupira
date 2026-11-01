import { ACTIVE_STATUSES, USER_ROLES } from '@curupira/shared'
import type { ManagementUserUpdatePayload } from '@curupira/shared'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { InputPassword } from '#/components/common/input-password'
import { OptionSelectControl } from '#/components/common/option-select'
import { FieldDescription, FieldGroup } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { AppField } from '#/integrations/react-hook-form/app-field'
import { ACTIVE_STATUS_LABELS, USER_ROLE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

/**
 * The form's values are the *update* shape (every field optional) for both create and
 * edit, so one component renders both. The create form validates with the stricter
 * `ManagementUserCreateValidator` - assignable here because its output is a subset - and
 * that is what makes name, e-mail, password and role required there.
 */
export type UserFormValues = ManagementUserUpdatePayload

export const USER_FIELDS = [
  'name',
  'email',
  'password',
  'role',
  'status',
] as const

type UserFormFieldsProps = Readonly<{
  form: UseFormReturn<UserFormValues>
  idPrefix: string
  /** Editing: the password is optional ("new password") and the status is editable. */
  editing?: boolean
}>

export function UserFormFields({
  form,
  idPrefix,
  editing = false,
}: UserFormFieldsProps): React.JSX.Element {
  let passwordLabel = m.panel_users_field_password()
  if (editing) passwordLabel = m.panel_users_field_new_password()

  return (
    <FieldGroup>
      <AppField
        control={form.control}
        name="name"
        id={idPrefix.concat('-name')}
        label={m.panel_users_field_name()}
      >
        {({ field, control }) => (
          <Input
            {...field}
            {...control}
            value={field.value ?? ''}
            autoComplete="name"
            maxLength={120}
            className="h-10 text-sm"
          />
        )}
      </AppField>

      <AppField
        control={form.control}
        name="email"
        id={idPrefix.concat('-email')}
        label={m.common_email()}
      >
        {({ field, control }) => (
          <Input
            {...field}
            {...control}
            value={field.value ?? ''}
            type="email"
            autoComplete="off"
            className="h-10 text-sm"
          />
        )}
      </AppField>

      <AppField
        control={form.control}
        name="password"
        id={idPrefix.concat('-password')}
        label={passwordLabel}
      >
        {({ field, control }) => (
          <>
            <InputPassword
              {...field}
              {...control}
              value={field.value ?? ''}
              // Blank means "keep the current one" on edit: the field must be absent, not
              // an empty string the validator would refuse as too short.
              onChange={(event) =>
                field.onChange(event.target.value || undefined)
              }
              autoComplete="new-password"
              className="h-10 text-sm"
            />
            <FieldDescription>
              {m.panel_users_field_password_hint()}
              {editing && ` ${m.panel_users_field_password_keep()}`}
            </FieldDescription>
          </>
        )}
      </AppField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AppField
          control={form.control}
          name="role"
          id={idPrefix.concat('-role')}
          label={m.panel_users_field_role()}
        >
          {({ field, control }) => (
            <OptionSelectControl
              {...control}
              value={field.value}
              options={USER_ROLES.map((role) => ({
                value: role,
                label: USER_ROLE_LABELS[role](),
              }))}
              onValueChange={(value) =>
                field.onChange(USER_ROLES.find((role) => role === value))
              }
            />
          )}
        </AppField>

        {editing && (
          <AppField
            control={form.control}
            name="status"
            id={idPrefix.concat('-status')}
            label={m.panel_users_field_status()}
          >
            {({ field, control }) => (
              <OptionSelectControl
                {...control}
                value={field.value}
                options={ACTIVE_STATUSES.map((status) => ({
                  value: status,
                  label: ACTIVE_STATUS_LABELS[status](),
                }))}
                onValueChange={(value) =>
                  field.onChange(
                    ACTIVE_STATUSES.find((status) => status === value),
                  )
                }
              />
            )}
          </AppField>
        )}
      </div>
    </FieldGroup>
  )
}
