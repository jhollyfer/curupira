import { SignOutIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi, useMatchRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark'
import {
  Sidebar as Root,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar'
import { managementReportStatsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { menuFor } from './menu'
import type { MenuItem } from './menu'
import {
  SignOutConfirm,
  SignOutConfirmFooter,
  SignOutConfirmHeader,
} from './sign-out-confirm'

const privateRoute = getRouteApi('/_private')

/**
 * The active item is the longest path that matches, not every prefix: `/management` is a
 * prefix of every other item, so a plain `fuzzy` match would light the overview up on
 * every screen.
 */
function useActiveTo(items: ReadonlyArray<MenuItem>): string | undefined {
  const matchRoute = useMatchRoute()
  let active: string | undefined

  for (const item of items) {
    if (!matchRoute({ to: item.to, fuzzy: true })) continue
    if (active && active.length >= item.to.length) continue

    active = item.to
  }

  return active
}

function NavigationItem({
  item,
  isActive,
  badge,
}: Readonly<{
  item: MenuItem
  isActive: boolean
  badge?: number
}>): React.JSX.Element {
  const { icon: Icon, label, to } = item
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        render={<Link to={to} />}
        // The drawer is a phone surface: rows are 44px there, the dense 32px is the
        // desktop rail's.
        className="max-md:h-11 max-md:text-base pointer-coarse:group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:sr-only"
        onClick={() => setOpenMobile(false)}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </SidebarMenuButton>
      {Boolean(badge) && (
        <SidebarMenuBadge className="bg-primary text-primary-foreground peer-data-active/menu-button:text-primary-foreground">
          <span aria-hidden="true">{badge}</span>
          <span className="sr-only">
            {m.panel_menu_untreated_count({ count: badge ?? 0 })}
          </span>
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

export function Sidebar(): React.JSX.Element {
  const { account } = privateRoute.useRouteContext()
  const menu = menuFor(account.role)
  const active = useActiveTo(menu.flatMap((group) => group.items))
  const { data: stats } = useQuery(managementReportStatsQueryOptions())
  // What is waiting for a first look: the number the operator opens the panel to find.
  const untreated = stats?.byStatus.RECEIVED
  const badges: Partial<Record<string, number>> = {
    '/management/reports': untreated,
  }

  // `role="navigation"` on the container, not on an inner `<nav>`: the brand and the
  // sign-out button sit in the header and footer, and axe's `region` rule wants every
  // piece of the sidebar inside a landmark.
  return (
    <Root
      collapsible="icon"
      variant="sidebar"
      role="navigation"
      aria-label={m.panel_title()}
    >
      <SidebarHeader className="h-14 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Collapsed to icons (the 1024px case) the rail is 48px wide: the wordmark
                spilled out of it and printed over the breadcrumb. */}
            <BrandMark
              to="/management"
              className="group-data-[collapsible=icon]:[&>span]:hidden"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menu.map((group) => (
          <SidebarGroup key={group.label}>
            {/* Hidden outright in the icon rail: the primitive only fades it (`opacity-0`) and
                pulls it up with `-mt-8`, which parks the invisible label over the previous
                group's last item and swallows its clicks (Avisos, Contas). */}
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavigationItem
                  key={item.to}
                  item={item}
                  isActive={active === item.to}
                  badge={badges[item.to]}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* `tooltip`: collapsed, only the icon is left, and an exit icon with no label
                is the button nobody risks clicking. It opens the confirmation instead of
                signing out, so a stray click on a shared computer does not end the session. */}
            <SignOutConfirm
              render={
                <SidebarMenuButton
                  tooltip={m.panel_sign_out()}
                  className="max-md:h-11 max-md:text-base pointer-coarse:group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:sr-only"
                >
                  <SignOutIcon aria-hidden="true" />
                  <span>{m.panel_sign_out()}</span>
                </SidebarMenuButton>
              }
            >
              <SignOutConfirmHeader />
              <SignOutConfirmFooter />
            </SignOutConfirm>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Root>
  )
}
