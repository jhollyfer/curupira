import {
  WallIcon,
  CheckCircleIcon,
  CouchIcon,
  DotsThreeCircleIcon,
  FireIcon,
  HourglassMediumIcon,
  LeafIcon,
  PaperPlaneTiltIcon,
  RecycleIcon,
  TrashIcon,
  TreeIcon,
  TrayArrowDownIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { ReportKind, ReportStatus, WasteType } from '@curupira/shared'

/**
 * The icon of each domain value: the second cue beside the color, so no meaning
 * depends on color alone (WCAG 1.4.1). One family, Phosphor, and one place.
 */

export const WASTE_TYPE_ICONS = {
  ORGANIC: LeafIcon,
  RECYCLABLE: RecycleIcon,
  BULKY: CouchIcon,
  DEBRIS: WallIcon,
} satisfies Record<WasteType, Icon>

export const REPORT_KIND_ICONS = {
  BURNING: FireIcon,
  DUMPING: TrashIcon,
  DEFORESTATION: TreeIcon,
  OTHER: DotsThreeCircleIcon,
} satisfies Record<ReportKind, Icon>

export const REPORT_STATUS_ICONS = {
  RECEIVED: TrayArrowDownIcon,
  IN_REVIEW: HourglassMediumIcon,
  FORWARDED: PaperPlaneTiltIcon,
  RESOLVED: CheckCircleIcon,
} satisfies Record<ReportStatus, Icon>
