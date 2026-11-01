import { createLazyFileRoute, useRouteContext } from '@tanstack/react-router'
import type * as React from 'react'

import { LocaleSwitch } from '#/components/common/locale-switch'
import { ThemeToggle } from '#/components/common/theme-toggle'
import { Button } from '#/components/ui/button'
import { useSignOut } from '#/hooks/use-sign-out'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_private/gestao/')({
  component: PanelHome,
})

function PanelHome(): React.JSX.Element {
  const { account } = useRouteContext({ from: '/_private' })
  const signOut = useSignOut()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-end gap-2">
        <LocaleSwitch />
        <ThemeToggle />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">{m.panel_title()}</h1>
      <p className="text-lg text-muted-foreground">
        {m.panel_placeholder({ name: account.name })}
      </p>
      <Button
        size="touch"
        variant="outline"
        className="self-start"
        disabled={signOut.isPending}
        onClick={() => signOut.mutate()}
      >
        {m.panel_sign_out()}
      </Button>
    </main>
  )
}
