import { ManagementUserCreateValidator } from '@curupira/shared'
import type {
  ManagementUserCreatePayload,
  ManagementUserShowResponse,
} from '@curupira/shared'
import type * as React from 'react'

import {
  FormShell,
  FormShellActions,
  FormShellBack,
  FormShellContent,
  FormShellDiscard,
  FormShellHeader,
  FormShellSubmit,
  FormShellTitle,
} from '#/components/common/form-shell'
import { Card, CardContent } from '#/components/ui/card'
import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useResourceForm } from '#/hooks/use-resource-form'
import { useManagementUserCreateMutation } from '#/integrations/tanstack-query/mutations/management'
import { m } from '#/paraglide/messages'

import { USER_FIELDS, UserFormFields } from './form-fields'
import type { UserFormValues } from './form-fields'

export function UserFormCreate(): React.JSX.Element {
  const { form, onSubmit, shell } = useResourceForm<
    UserFormValues,
    ManagementUserShowResponse,
    ManagementUserCreatePayload
  >({
    formId: 'user-create',
    validator: ManagementUserCreateValidator,
    defaults: { name: '', email: '', password: undefined, role: 'OPERATOR' },
    fields: USER_FIELDS,
    mutation: useManagementUserCreateMutation,
    invalidate: queryKeys.management.users.all,
    backTo: '/management/users',
    success: (created) => m.panel_users_saved({ name: created.name }),
    // The use case refuses a repeated e-mail with 409 before inserting, so resending
    // after a 5xx cannot create a second account.
    retry: 'user-create-error',
    // The form shares the update shape (everything optional) so one fields component
    // serves both screens; by the time this runs the create validator already made the
    // four required, and the fallbacks are unreachable.
    payload: ({ name, email, password, role }) => ({
      name: name ?? '',
      email: email ?? '',
      password: password ?? '',
      role: role ?? 'OPERATOR',
    }),
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>{m.panel_users_new()}</FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>

      <FormShellContent onSubmit={onSubmit}>
        <Card className="max-w-3xl">
          <CardContent>
            <UserFormFields form={form} idPrefix="user-create" />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
