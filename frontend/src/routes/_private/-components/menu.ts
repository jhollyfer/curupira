import type { UserRole } from '@curupira/shared'
import {
  CalendarDotsIcon,
  GaugeIcon,
  IdentificationCardIcon,
  MapPinAreaIcon,
  MegaphoneIcon,
  SirenIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import { linkOptions } from '@tanstack/react-router'

import { can } from '#/lib/capabilities'
import { m } from '#/paraglide/messages'

/**
 * The sidebar, as data: each item names the capability that shows it, so the menu and the
 * area guards read the same table (`lib/capabilities.ts`) and a link is never offered to
 * a screen that would bounce the user back.
 *
 * `linkOptions` keeps `to` checked against the generated route tree; the labels are
 * getters so they are read at render time, in the language of the URL.
 */
const OPERATION = linkOptions([
  {
    to: '/gestao',
    capability: 'overview' as const,
    get label() {
      return m.panel_menu_overview()
    },
    icon: GaugeIcon,
  },
  {
    to: '/gestao/reports',
    capability: 'reports' as const,
    get label() {
      return m.panel_menu_reports()
    },
    icon: SirenIcon,
  },
  {
    to: '/gestao/notices',
    capability: 'notices' as const,
    get label() {
      return m.panel_menu_notices()
    },
    icon: MegaphoneIcon,
  },
])

const REGISTRY = linkOptions([
  {
    to: '/gestao/schedules',
    capability: 'schedules' as const,
    get label() {
      return m.panel_menu_schedules()
    },
    icon: CalendarDotsIcon,
  },
  {
    to: '/gestao/neighborhoods',
    capability: 'neighborhoods' as const,
    get label() {
      return m.panel_menu_neighborhoods()
    },
    icon: MapPinAreaIcon,
  },
  {
    to: '/gestao/users',
    capability: 'users' as const,
    get label() {
      return m.panel_menu_users()
    },
    icon: UsersIcon,
  },
])

const ACCOUNT = linkOptions([
  {
    to: '/gestao/account/profile',
    capability: 'profile' as const,
    get label() {
      return m.panel_menu_profile()
    },
    icon: IdentificationCardIcon,
  },
])

export type MenuItem =
  | (typeof OPERATION)[number]
  | (typeof REGISTRY)[number]
  | (typeof ACCOUNT)[number]

export type MenuGroup = {
  label: string
  items: ReadonlyArray<MenuItem>
}

const GROUPS: ReadonlyArray<MenuGroup> = [
  {
    get label() {
      return m.panel_menu_group_operation()
    },
    items: OPERATION,
  },
  {
    get label() {
      return m.panel_menu_group_registry()
    },
    items: REGISTRY,
  },
  {
    get label() {
      return m.panel_menu_group_account()
    },
    items: ACCOUNT,
  },
]

/** The groups with the items this role may open; a group left empty disappears. */
export function menuFor(role: UserRole): ReadonlyArray<MenuGroup> {
  return GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => can(role, item.capability)),
  })).filter((group) => group.items.length > 0)
}
