import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { m } from '#/paraglide/messages'

import { NAV_ITEMS } from './menu'

/**
 * The phone's navigation: five destinations at thumb height, icon above a short name
 * (the name is always there - an icon alone is a riddle). `pb-[env(safe-area-inset-bottom)]`
 * keeps it above the iPhone home bar. Hidden from `md`, where the header has the links.
 */
export function BottomNav(): React.JSX.Element {
  return (
    <nav
      aria-label={m.nav_main_label()}
      className="fixed inset-x-0 bottom-0 z-sticky border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden supports-[backdrop-filter]:bg-background/85"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === '/' }}
              className="group flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/60 data-[status=active]:text-primary"
            >
              <span className="grid h-7 w-14 place-items-center rounded-full transition-colors group-data-[status=active]:bg-accent motion-reduce:transition-none">
                <item.icon className="size-6" weight="regular" />
              </span>
              {item.label()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
