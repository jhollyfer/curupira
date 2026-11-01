import { CaretDownIcon } from '@phosphor-icons/react'
import { Link, getRouteApi, useMatches } from '@tanstack/react-router'
import * as React from 'react'

import {
  LOCALE_NATIVE_NAMES,
  LocaleSwitch,
} from '#/components/common/locale-switch'
import { useTheme } from '#/components/common/theme-provider'
import { ThemeToggle } from '#/components/common/theme-toggle'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { buildBreadcrumbs } from '#/lib/breadcrumbs'
import { cn } from '#/lib/cn'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { initials } from '#/lib/labels'
import { THEMES } from '#/lib/theme'
import type { Theme } from '#/lib/theme'
import { m } from '#/paraglide/messages'
import { getLocale, isLocale, locales, setLocale } from '#/paraglide/runtime'

import {
  SignOutConfirm,
  SignOutConfirmFooter,
  SignOutConfirmHeader,
} from './sign-out-confirm'

const route = getRouteApi('/_private')

function Trail(): React.JSX.Element {
  const matches = useMatches()
  const crumbs = buildBreadcrumbs(matches)

  return (
    <Breadcrumb className="min-w-0">
      {/* A phone has room for the screen's own name only: the parents are one tap away
          in the drawer, and a wrapped trail would grow the 56px header. */}
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label.concat(String(index))}>
            {index > 0 && <BreadcrumbSeparator className="max-sm:hidden" />}
            <BreadcrumbItem
              className={cn('min-w-0', {
                'max-sm:hidden': index < crumbs.length - 1,
              })}
            >
              {crumb.to && (
                <BreadcrumbLink
                  render={<Link to={crumb.to} />}
                  className="max-md:inline-flex max-md:min-h-11 max-md:items-center pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
              {!crumb.to && (
                <BreadcrumbPage className="truncate">
                  {crumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const THEME_LABELS = {
  light: () => m.panel_theme_light(),
  dark: () => m.panel_theme_dark(),
  system: () => m.panel_theme_system(),
} satisfies Record<Theme, () => string>

/**
 * Language and theme as radio groups inside the account menu. Only the phone shows them
 * (`md:hidden`): at 360px the header cannot carry the language button, the theme button and
 * the account without squeezing the screen's name out, so they fold into the one menu that
 * is already there. From `md` the two buttons are back in the header.
 */
function Preferences(): React.JSX.Element {
  const { theme, setTheme } = useTheme('AccountMenu')
  const locale = getLocale()

  return (
    <div className="md:hidden">
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>{m.panel_account_theme()}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: string) => {
            const next = THEMES.find((item) => item === value)
            if (next) setTheme(next)
          }}
        >
          {THEMES.map((item) => (
            <DropdownMenuRadioItem key={item} value={item} className="min-h-11">
              {THEME_LABELS[item]()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>{m.locale_switch_label()}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value: string) => {
            if (isLocale(value)) void setLocale(value)
          }}
        >
          {locales.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              lang={item}
              className="min-h-11"
            >
              {LOCALE_NATIVE_NAMES[item]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
    </div>
  )
}

function AccountMenu(): React.JSX.Element {
  const { account } = route.useRouteContext()
  const [signOutHandle] = React.useState(createConfirmHandle)

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted motion-reduce:transition-none">
          <Avatar className="size-8">
            <AvatarFallback
              aria-hidden="true"
              className="bg-primary text-xs font-semibold text-primary-foreground"
            >
              {initials(account.name)}
            </AvatarFallback>
          </Avatar>
          {/* The accessible name contains the visible one (WCAG 2.5.3). */}
          <span className="sr-only">{m.panel_account_label()}</span>
          <span className="sr-only text-sm leading-none font-semibold lg:not-sr-only">
            {account.name}
          </span>
          <CaretDownIcon
            aria-hidden="true"
            className="size-3 text-muted-foreground"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="panel-touch w-60" align="end">
          {/* The group is required by Base UI's `GroupLabel`; without it opening the menu
              throws and the layout's boundary shows the error page. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate font-medium">{account.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {account.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link to="/gestao/account/profile">{m.panel_my_profile()}</Link>
            }
            className="min-h-11"
          />
          <Preferences />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-11"
            onClick={() => signOutHandle.open(null)}
          >
            {m.panel_sign_out()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* A sibling of the menu, not inside its content: the content unmounts on close and
          would take the confirmation with it. */}
      <SignOutConfirm handle={signOutHandle}>
        <SignOutConfirmHeader />
        <SignOutConfirmFooter />
      </SignOutConfirm>
    </React.Fragment>
  )
}

export function Header(): React.JSX.Element {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex min-w-0 items-center gap-2 px-3 md:px-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Trail />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 px-3 md:px-4">
        <div className="flex items-center gap-2 max-md:hidden">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
        <AccountMenu />
      </div>
    </header>
  )
}
