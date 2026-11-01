import type {
  ActiveStatus,
  CollectionShift,
  NoticeStatus,
  ReportKind,
  ReportStatus,
  UserRole,
  WasteType,
  Weekday,
} from '@curupira/shared'
import type { VariantProps } from 'class-variance-authority'
import { Info } from 'luxon'

import type { badgeVariants } from '#/components/ui/badge'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

/**
 * The labels (in the screen's language, read on each call) and the badge variant of
 * each domain enum. Enum values are identifiers (`ORGANIC`), not interface text:
 * the words live here, as functions that call `m.*()` at render time, so the language
 * of the URL is the one that answers.
 *
 * A lookup object and not an `if` scattered across screens. `satisfies Record<Enum, …>`
 * is the net: a new enum value in `@curupira/shared` without a label here does not
 * compile. The enums enter as **types** only (see `list-search.ts` on chunk cycles).
 */

export const WASTE_TYPE_LABELS = {
  ORGANIC: () => m.label_waste_type_organic(),
  RECYCLABLE: () => m.label_waste_type_recyclable(),
  BULKY: () => m.label_waste_type_bulky(),
  DEBRIS: () => m.label_waste_type_debris(),
} satisfies Record<WasteType, () => string>

/** What goes in each collection, in a sentence a resident recognizes. */
export const WASTE_TYPE_HINTS = {
  ORGANIC: () => m.label_waste_type_organic_hint(),
  RECYCLABLE: () => m.label_waste_type_recyclable_hint(),
  BULKY: () => m.label_waste_type_bulky_hint(),
  DEBRIS: () => m.label_waste_type_debris_hint(),
} satisfies Record<WasteType, () => string>

/**
 * The fixed CSS class of each waste type's colored dot (`.waste-*` in `styles.css`,
 * fed by the `--waste-*` tokens). One place, so no screen picks its own color.
 */
export const WASTE_TYPE_CLASSES = {
  ORGANIC: 'waste-organic',
  RECYCLABLE: 'waste-recyclable',
  BULKY: 'waste-bulky',
  DEBRIS: 'waste-debris',
} satisfies Record<WasteType, string>

export const REPORT_KIND_LABELS = {
  BURNING: () => m.label_report_kind_burning(),
  DUMPING: () => m.label_report_kind_dumping(),
  DEFORESTATION: () => m.label_report_kind_deforestation(),
  OTHER: () => m.label_report_kind_other(),
} satisfies Record<ReportKind, () => string>

export const REPORT_KIND_HINTS = {
  BURNING: () => m.label_report_kind_burning_hint(),
  DUMPING: () => m.label_report_kind_dumping_hint(),
  DEFORESTATION: () => m.label_report_kind_deforestation_hint(),
  OTHER: () => m.label_report_kind_other_hint(),
} satisfies Record<ReportKind, () => string>

export const REPORT_STATUS_LABELS = {
  RECEIVED: () => m.label_report_status_received(),
  IN_REVIEW: () => m.label_report_status_in_review(),
  FORWARDED: () => m.label_report_status_forwarded(),
  RESOLVED: () => m.label_report_status_resolved(),
} satisfies Record<ReportStatus, () => string>

/** What the status means for the person who sent the report. */
export const REPORT_STATUS_HINTS = {
  RECEIVED: () => m.label_report_status_received_hint(),
  IN_REVIEW: () => m.label_report_status_in_review_hint(),
  FORWARDED: () => m.label_report_status_forwarded_hint(),
  RESOLVED: () => m.label_report_status_resolved_hint(),
} satisfies Record<ReportStatus, () => string>

export const REPORT_STATUS_VARIANTS = {
  RECEIVED: 'neutral',
  IN_REVIEW: 'warning',
  FORWARDED: 'info',
  RESOLVED: 'success',
} satisfies Record<ReportStatus, BadgeVariant>

export const COLLECTION_SHIFT_LABELS = {
  MORNING: () => m.label_collection_shift_morning(),
  AFTERNOON: () => m.label_collection_shift_afternoon(),
  NIGHT: () => m.label_collection_shift_night(),
} satisfies Record<CollectionShift, () => string>

export const NOTICE_STATUS_LABELS = {
  SCHEDULED: () => m.label_notice_status_scheduled(),
  ACTIVE: () => m.label_notice_status_active(),
  CLOSED: () => m.label_notice_status_closed(),
} satisfies Record<NoticeStatus, () => string>

export const NOTICE_STATUS_VARIANTS = {
  SCHEDULED: 'info',
  ACTIVE: 'success',
  CLOSED: 'neutral',
} satisfies Record<NoticeStatus, BadgeVariant>

export const ACTIVE_STATUS_LABELS = {
  ACTIVE: () => m.label_active_status_active(),
  INACTIVE: () => m.label_active_status_inactive(),
} satisfies Record<ActiveStatus, () => string>

export const ACTIVE_STATUS_VARIANTS = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
} satisfies Record<ActiveStatus, BadgeVariant>

export const USER_ROLE_LABELS = {
  ADMINISTRATOR: () => m.label_user_role_administrator(),
  OPERATOR: () => m.label_user_role_operator(),
} satisfies Record<UserRole, () => string>

/**
 * Weekday names come from Luxon's `Info` in the screen's language, not from message
 * keys: the public calendar already reads them that way, and fourteen keys per language
 * would only restate what the platform's calendar data knows. Luxon's list starts on
 * Monday, hence the index map.
 */
const LUXON_WEEKDAY_INDEX = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} satisfies Record<Weekday, number>

export function weekdayLabel(
  weekday: Weekday,
  length: 'long' | 'short' = 'long',
): string {
  return (
    Info.weekdays(length, { locale: getLocale() })[
      LUXON_WEEKDAY_INDEX[weekday]
    ] ?? ''
  )
}

/**
 * A name's initials for an avatar without a picture: first letter of the first and of the
 * last name. A one-word name gives one initial - repeating it would read "MM" for "Marcelo".
 */
export function initials(name: string | undefined | null): string {
  if (!name?.trim()) return ''

  const parts = name.trim().split(/\s+/)
  const first = parts.at(0)?.at(0) ?? ''
  if (parts.length === 1) return first.toUpperCase()

  return first.concat(parts.at(-1)?.at(0) ?? '').toUpperCase()
}
