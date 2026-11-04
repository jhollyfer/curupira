import { ManagementUserUpdateValidator } from '@curupira/shared'
import type { ManagementUserShowResponse } from '@curupira/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
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
import { useManagementUserUpdateMutation } from '#/integrations/tanstack-query/mutations/management'
import type { UserUpdateVariables } from '#/integrations/tanstack-query/mutations/management'
import { managementUserQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { USER_FIELDS, UserFormFields } from './form-fields'
import type { UserFormValues } from './form-fields'

const route = getRouteApi('/_private/management/users/$id/edit')

export function UserFormEdit(): React.JSX.Element {
  const { id } = route.useParams()
  const { data: user } = useSuspenseQuery(managementUserQueryOptions(id))

  const { form, onSubmit, shell } = useResourceForm<
    UserFormValues,
    ManagementUserShowResponse,
    UserUpdateVariables
  >({
    formId: 'user-update',
    validator: ManagementUserUpdateValidator,
    values: {
      name: user.name,
      email: user.email,
      password: undefined,
      role: user.role,
      status: user.status,
    },
    fields: USER_FIELDS,
    mutation: useManagementUserUpdateMutation,
    invalidate: queryKeys.management.users.all,
    backTo: '/management/users',
    success: (updated) => m.panel_users_saved({ name: updated.name }),
    retry: 'user-update-error',
    payload: (values) => ({ ...values, id }),
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>
          {m.panel_users_edit_named({ name: user.name })}
        </FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>

      <FormShellContent onSubmit={onSubmit}>
        <Card className="max-w-3xl">
          <CardContent>
            <UserFormFields form={form} idPrefix="user-update" editing />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
