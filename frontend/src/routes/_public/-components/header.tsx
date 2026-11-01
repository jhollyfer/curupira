import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark'
import { LocaleSwitch } from '#/components/common/locale-switch'
import { ThemeToggle } from '#/components/common/theme-toggle'
import { m } from '#/paraglide/messages'

import { EXTRA_ITEMS, NAV_ITEMS } from './menu'

/**
 * The top bar. On a phone it is only brand, language and theme (navigation lives in
 * the bottom bar, under the thumb); from `md` it also carries the destinations.
 */
export function Header(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-sticky border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <BrandMark />
        <nav aria-label={m.nav_main_label()} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {[...NAV_ITEMS, ...EXTRA_ITEMS].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === '/' }}
                  className="inline-flex min-h-11 items-center rounded-xl px-3.5 text-base font-semibold text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/60 data-[status=active]:bg-accent data-[status=active]:text-foreground motion-reduce:transition-none"
                >
                  {item.label()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
