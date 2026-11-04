import {
  CalendarDotsIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  MegaphoneIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { LinkProps } from '@tanstack/react-router'

import { m } from '#/paraglide/messages'

export type NavItem = Readonly<{
  to: LinkProps['to']
  label: () => string
  icon: Icon
}>

/**
 * The resident's destinations, in the order of a visit: see the schedule, report,
 * follow. The menu sheet (phone) and the header (desktop) read the same list, so a
 * destination is never in one and missing from the other.
 */
export const NAV_ITEMS = [
  { to: '/', label: () => m.nav_home(), icon: HouseIcon },
  { to: '/schedule', label: () => m.nav_schedule(), icon: CalendarDotsIcon },
  { to: '/report', label: () => m.nav_report(), icon: WarningCircleIcon },
  { to: '/track', label: () => m.nav_track(), icon: MagnifyingGlassIcon },
  { to: '/map', label: () => m.nav_map(), icon: MapTrifoldIcon },
] as const satisfies ReadonlyArray<NavItem>

/** Reached from the home and the footer, a destination of the menu and the header, but not of the main sequence. */
export const EXTRA_ITEMS = [
  { to: '/notices', label: () => m.nav_notices(), icon: MegaphoneIcon },
] as const satisfies ReadonlyArray<NavItem>
