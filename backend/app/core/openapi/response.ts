import {
  AccountProfileShowResponse,
  ManagementNeighborhoodShowResponse,
  ManagementNoticeShowResponse,
  ManagementReportListItemResponse,
  ManagementReportShowResponse,
  ManagementReportStatsResponse,
  ManagementScheduleShowResponse,
  ManagementUserShowResponse,
  StoragesFileShowResponse,
  StorefrontNeighborhoodShowResponse,
  StorefrontNoticeShowResponse,
  StorefrontReportCreateResponse,
  StorefrontReportMapResponse,
  StorefrontReportPhotoCreateResponse,
  StorefrontReportShowByProtocolResponse,
  StorefrontScheduleShowResponse,
  z,
} from '@curupira/shared'

import type { FeatureResponse } from '#core/openapi/types'

/**
 * The registry of which response schema answers for each API action
 * (`_standards/openapi.md`, "response-registry"). The registry only points: the
 * schema lives in `shared/src/responses/`, the same one the presenter types and the
 * frontend reads, and `core/` does not import `models/`.
 *
 * The key is the resource directory in `app/features` (`management/neighborhoods`),
 * and holds for all its actions; the key with the action (`management/reports/show`)
 * wins when the action returns another shape. A listing gets the pagination
 * envelope on its own.
 */
export const RESPONSES: Record<string, FeatureResponse> = {
  'account/profile': AccountProfileShowResponse,
  'management/neighborhoods': ManagementNeighborhoodShowResponse,
  'management/notices': ManagementNoticeShowResponse,
  'management/reports': ManagementReportListItemResponse,
  'management/reports/show': ManagementReportShowResponse,
  'management/reports/update-status': ManagementReportShowResponse,
  'management/reports/map': z.array(ManagementReportListItemResponse),
  'management/reports/stats': ManagementReportStatsResponse,
  'management/schedules': ManagementScheduleShowResponse,
  'management/users': ManagementUserShowResponse,
  'storages/files': StoragesFileShowResponse,
  'storefront/neighborhoods': StorefrontNeighborhoodShowResponse,
  'storefront/notices': StorefrontNoticeShowResponse,
  'storefront/report-photos': StorefrontReportPhotoCreateResponse,
  'storefront/reports/create': StorefrontReportCreateResponse,
  'storefront/reports/map': z.array(StorefrontReportMapResponse),
  'storefront/reports/show-by-protocol': StorefrontReportShowByProtocolResponse,
  'storefront/schedules': StorefrontScheduleShowResponse,
}
