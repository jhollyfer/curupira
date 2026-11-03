import { ListIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { m } from '#/paraglide/messages'

import { EXTRA_ITEMS, NAV_ITEMS } from './menu'

/**
 * The navigation below `md`: a button in the header that opens a side sheet with every
 * destination, the way a website does (`sheet-pattern`, rule 6: the link sits inside
 * `SheetClose`, so choosing a destination closes the sheet). From `md` the header shows
 * the links themselves and this button is gone.
 */
export function MenuSheet(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-touch"
            aria-label={m.nav_menu_open()}
            className="md:hidden"
          >
            <ListIcon aria-hidden="true" weight="bold" />
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{m.nav_menu_title()}</SheetTitle>
          <SheetDescription>{m.nav_menu_description()}</SheetDescription>
        </SheetHeader>
        <nav aria-label={m.nav_main_label()} className="px-2 pb-4">
          <ul className="flex flex-col gap-1">
            {[...NAV_ITEMS, ...EXTRA_ITEMS].map((item) => (
              <li key={item.to}>
                <SheetClose
                  nativeButton={false}
                  role="link"
                  render={
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === '/' }}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold text-foreground outline-none hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring/60 data-[status=active]:bg-accent"
                    >
                      <item.icon aria-hidden="true" className="size-5" />
                      {item.label()}
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
