import { AccountProfileUpdateValidator } from '@curupira/shared'
import type {
  AccountProfileShowResponse,
  AccountProfileUpdatePayload,
} from '@curupira/shared'
import { getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { InputPassword } from '#/components/common/input-password'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '#/components/common/page-shell'
import { SubmitButton } from '#/components/common/submit-button'
import { Card, CardContent } from '#/components/ui/card'
import {
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useMutationForm } from '#/hooks/use-mutation-form'
import {
  AppField,
  AppFormRootError,
} from '#/integrations/react-hook-form/app-field'
import { useAccountProfileUpdateMutation } from '#/integrations/tanstack-query/mutations/management'
import { USER_ROLE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

const privateRoute = getRouteApi('/_private')

const FIELDS = [
  'name',
  'email',
  'password',
  'passwordConfirmation',
  'currentPassword',
] as const

/**
 * Edit the signed-in user's name, e-mail and password. Changing the password asks for the
 * current one (the validator's refinement points at `currentPassword`); a wrong current
 * password comes back as 422 `CURRENT_PASSWORD_INVALID` on that same field.
 *
 * The role and the status are not here: nobody promotes or deactivates themselves - that
 * is the administrator's, on the accounts screen.
 */
export function ProfileForm(): React.JSX.Element {
  const { account } = privateRoute.useRouteContext()
  const baseId = React.useId()

  const { form, mutation, onSubmit } = useMutationForm<
    AccountProfileUpdatePayload,
    AccountProfileShowResponse,
    AccountProfileUpdatePayload
  >({
    validator: AccountProfileUpdateValidator,
    values: { name: account.name, email: account.email },
    fields: FIELDS,
    mutation: useAccountProfileUpdateMutation,
    // The account feeds the header and the route context: refreshing it is what makes the
    // new name show up in the corner without a reload.
    invalidate: [queryKeys.account.profile.all, queryKeys.management.users.all],
    success: m.panel_profile_saved(),
    retry: 'profile-update-error',
    payload: (values) => values,
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader>
        <PageHeaderTitle>{m.panel_profile_title()}</PageHeaderTitle>
        <PageHeaderDescription>
          {m.panel_profile_description({
            role: USER_ROLE_LABELS[account.role](),
          })}
        </PageHeaderDescription>
      </PageHeader>

      <Card>
        <CardContent>
          <form
            method="post"
            onSubmit={onSubmit}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <AppField
                control={form.control}
                name="name"
                id={baseId.concat('-name')}
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
                id={baseId.concat('-email')}
                label={m.common_email()}
              >
                {({ field, control }) => (
                  <Input
                    {...field}
                    {...control}
                    value={field.value ?? ''}
                    type="email"
                    autoComplete="email"
                    className="h-10 text-sm"
                  />
                )}
              </AppField>
            </FieldGroup>

            <FieldSet>
              <FieldLegend>{m.panel_profile_password_legend()}</FieldLegend>
              <FieldDescription>
                {m.panel_profile_password_hint()}
              </FieldDescription>
              <FieldGroup>
                <AppField
                  control={form.control}
                  name="password"
                  id={baseId.concat('-password')}
                  label={m.panel_users_field_new_password()}
                >
                  {({ field, control }) => (
                    <InputPassword
                      {...field}
                      {...control}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      autoComplete="new-password"
                      className="h-10 text-sm"
                    />
                  )}
                </AppField>
                <AppField
                  control={form.control}
                  name="passwordConfirmation"
                  id={baseId.concat('-confirmation')}
                  label={m.panel_profile_password_confirmation()}
                >
                  {({ field, control }) => (
                    <InputPassword
                      {...field}
                      {...control}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      autoComplete="new-password"
                      className="h-10 text-sm"
                    />
                  )}
                </AppField>
                <AppField
                  control={form.control}
                  name="currentPassword"
                  id={baseId.concat('-current')}
                  label={m.panel_profile_current_password()}
                >
                  {({ field, control }) => (
                    <InputPassword
                      {...field}
                      {...control}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      autoComplete="current-password"
                      className="h-10 text-sm"
                    />
                  )}
                </AppField>
              </FieldGroup>
            </FieldSet>

            <AppFormRootError form={form} />

            <SubmitButton
              isPending={mutation.isPending}
              className="w-full self-start sm:w-auto"
            >
              {m.common_save()}
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
