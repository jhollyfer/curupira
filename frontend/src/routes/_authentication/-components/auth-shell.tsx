import type { Merge } from '@curupira/shared'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark'
import { LocaleSwitch } from '#/components/common/locale-switch'
import { ThemeToggle } from '#/components/common/theme-toggle'
import { cn } from '#/lib/cn'

/**
 * The frame of the authentication screens: the deep green band with the brand on top
 * and the form card centered. Only the frame - what goes in the card is each screen's.
 *
 * No context: there is no state to share between the parts, and a provider without a
 * reason to exist is noise. They are plain components in one file.
 */
function AuthShell({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="auth-shell"
      className={cn('stage-band flex min-h-dvh flex-col', className)}
      {...props}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BrandMark className="text-stage-foreground" />
        <div className="flex items-center gap-1.5 text-foreground">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  )
}

function AuthShellContent({
  className,
  children,
  ...props
}: React.ComponentProps<'main'>): React.JSX.Element {
  return (
    <main
      data-slot="auth-shell-content"
      className="m-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8"
      {...props}
    >
      <div
        className={cn(
          'flex flex-col gap-6 rounded-3xl bg-card p-6 text-card-foreground shadow-card-elevated md:p-8',
          className,
        )}
      >
        {children}
      </div>
    </main>
  )
}

/** The screen's title and the line that explains it. */
function AuthShellHeader({
  className,
  title,
  children,
  ...props
}: Merge<
  Omit<React.ComponentProps<'header'>, 'title'>,
  { title: React.ReactNode }
>): React.JSX.Element {
  return (
    <header
      data-slot="auth-shell-header"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    >
      <h1 className="text-3xl leading-tight font-extrabold tracking-tight">
        {title}
      </h1>
      {children && <p className="text-base text-muted-foreground">{children}</p>}
    </header>
  )
}

export { AuthShell, AuthShellContent, AuthShellHeader }
