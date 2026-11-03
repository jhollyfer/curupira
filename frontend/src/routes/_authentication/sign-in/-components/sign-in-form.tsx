import { AuthenticationSessionSignInValidator } from '@curupira/shared'
import type { AuthenticationSessionSignInPayload } from '@curupira/shared'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import type * as React from 'react'

import { InputPassword } from '#/components/common/input-password'
import { MaiyuCredit } from '#/components/common/maiyu-credit'
import { SubmitButton } from '#/components/common/submit-button'
import { Field, FieldGroup } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useMutationForm } from '#/hooks/use-mutation-form'
import {
  AppField,
  AppFormRootError,
} from '#/integrations/react-hook-form/app-field'
import { useAuthenticationSignInMutation } from '#/integrations/tanstack-query/mutations/authentication'
import { m } from '#/paraglide/messages'

import {
  AuthShell,
  AuthShellContent,
  AuthShellHeader,
} from '../../-components/auth-shell'

const route = getRouteApi('/_authentication/sign-in/')

/**
 * The fields this form knows how to highlight. A key of `errors` outside this list
 * (the backend gained a field, for example) does not vanish silently: it becomes a form
 * message.
 */
const FIELDS = ['email', 'password'] as const

/**
 * The panel's sign-in. The resident never sees it (the public app is anonymous): it is
 * the door of the city hall team to `/gestao`.
 */
export function SignInForm(): React.JSX.Element {
  const router = useRouter()
  // Validated in the parent layout, which already refused any destination that is not a
  // path of this app.
  const search = route.useSearch()

  const { form, mutation, onSubmit } = useMutationForm<
    AuthenticationSessionSignInPayload,
    void,
    AuthenticationSessionSignInPayload
  >({
    validator: AuthenticationSessionSignInValidator,
    // Without this the fields are born `undefined`, and the input mounts uncontrolled
    // only to become controlled on the first keystroke.
    defaults: { email: '', password: '' },
    // The 401 arrives in `root` - the backend's channel for "the message belongs to the
    // form, not to a field": it does not reveal whether the e-mail or the password failed.
    fields: FIELDS,
    mutation: useAuthenticationSignInMutation,
    // The sign-in answers 204 and does not say who came in - whoever knows is
    // `GET /account`. Without invalidating, the cache still holds the absence of a
    // session from a second ago, and the panel guard would send back to the sign-in.
    invalidate: [queryKeys.account.profile.all],
    // Signing in creates nothing: 5xx and network become a notice with "Tentar de novo".
    retry: 'sign-in-error',
    payload: (values) => values,
    async onSuccess() {
      // `href` and not `to`: the destination came from the URL as a string, and `to` is
      // the field typed against the route tree.
      if (search.redirect) {
        await router.navigate({ href: search.redirect })
        return
      }

      await router.navigate({ to: '/gestao' })
    },
  })

  return (
    <AuthShell>
      <AuthShellContent>
        {/* `method="post"`: a click on "Entrar" before hydration becomes a native
            submit, and with GET the password would end up in the URL and the history. */}
        <form method="post" onSubmit={onSubmit} className="flex flex-col gap-6">
          <AuthShellHeader title={m.auth_sign_in_title()}>
            {m.auth_sign_in_description()}
          </AuthShellHeader>

          <FieldGroup>
            <AppField
              control={form.control}
              name="email"
              id="form-email"
              label={m.common_email()}
            >
              {({ field, control }) => (
                <Input
                  {...field}
                  {...control}
                  type="email"
                  autoComplete="email"
                  placeholder={m.auth_email_placeholder()}
                  className="h-12 bg-card text-base"
                />
              )}
            </AppField>

            <AppField
              control={form.control}
              name="password"
              id="form-password"
              label={m.common_password()}
            >
              {({ field, control }) => (
                <InputPassword
                  {...field}
                  {...control}
                  autoComplete="current-password"
                  className="h-12 bg-card text-base"
                />
              )}
            </AppField>

            <AppFormRootError form={form} />

            <Field>
              <SubmitButton
                id="form-submit"
                size="touch-lg"
                className="w-full"
                isPending={mutation.isPending}
              >
                {m.auth_submit()}
              </SubmitButton>
            </Field>
          </FieldGroup>
        </form>
        <MaiyuCredit className="justify-center text-sm text-muted-foreground" />
      </AuthShellContent>
    </AuthShell>
  )
}
