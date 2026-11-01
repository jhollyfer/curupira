import { CaretDownIcon } from '@phosphor-icons/react'
import { Link, getRouteApi, useMatches } from '@tanstack/react-router'
import * as React from 'react'

import { LocaleSwitch } from '#/components/common/locale-switch'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { buildBreadcrumbs } from '#/lib/breadcrumbs'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { initials } from '#/lib/labels'
import { m } from '#/paraglide/messages'

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
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label.concat(String(index))}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.to && (
                <BreadcrumbLink render={<Link to={crumb.to} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
              {!crumb.to && <BreadcrumbPage>{crumb.label}</BreadcrumbPage>}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
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
          <CaretDownIcon aria-hidden="true" className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60" align="end">
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
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOutHandle.open(null)}>
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
      <div className="flex min-w-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Trail />
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
        <LocaleSwitch />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
