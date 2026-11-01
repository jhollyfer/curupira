import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { Button } from '#/components/ui/button'
import { MOCK_ACCOUNTS, MOCK_PASSWORD } from '#/data/management/session'
import { MOCK_LOGIN_AVAILABLE } from '#/integrations/tanstack-query/mock-session'
import { USER_ROLE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

type MockAccountsProps = Readonly<{
  form: UseFormReturn<{ email: string; password: string }>
}>

/**
 * Example accounts for the sign-in form - **development with the example data only**.
 * `MOCK_LOGIN_AVAILABLE` folds `import.meta.env.DEV`, which the build replaces, so in a
 * production bundle this renders nothing and the accounts are dropped as dead code.
 *
 * It fills the form instead of signing in directly, so the real submit path (validator,
 * mutation, redirect) is the one exercised.
 */
export function MockAccounts({
  form,
}: MockAccountsProps): React.JSX.Element | null {
  // `import.meta.env.DEV` is read right here, and not only through `MOCK_LOGIN_AVAILABLE`:
  // the bundler cannot see through an imported constant, so the accounts and the example
  // password stayed in the production bundle behind a guard that never opened.
  if (!import.meta.env.DEV || !MOCK_LOGIN_AVAILABLE) return null

  return (
    <section
      aria-labelledby="mock-accounts-title"
      className="flex flex-col gap-2 rounded-md border border-dashed p-3 text-sm"
    >
      <h2 id="mock-accounts-title" className="font-semibold">
        {m.auth_mock_title()}
      </h2>
      <p className="text-muted-foreground">{m.auth_mock_description()}</p>
      <ul className="flex flex-wrap gap-2">
        {MOCK_ACCOUNTS.map((account) => (
          <li key={account.id}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue('email', account.email, { shouldValidate: true })
                form.setValue('password', MOCK_PASSWORD, {
                  shouldValidate: true,
                })
              }}
            >
              {USER_ROLE_LABELS[account.role]()}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
