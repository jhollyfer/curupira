import {
  REPORT_KIND,
  REPORT_STATUS,
  type ManagementReportShowResponse,
  type ManagementReportStatsResponse,
  type ReportKind,
  type ReportStatus,
} from '@curupira/shared'

import { LocalDay } from '#core/local-day'
import type {
  ReportRead,
  ReportStatistics,
} from '#repositories/report/report.repository'
import type { StorageContract } from '#services/storage/storage.contract'

/** How many days the dashboard series covers, today included. */
export const STATS_DAYS = 30

/**
 * The report in the shape of the `shared/` response (`_standards/architecture.md` §10).
 * The repository returns it without the photo `url` (no service inside it); the single
 * place that signs it is here, through the bucket contract.
 */
export class ReportPresenter {
  static async show(
    read: ReportRead,
    bucket: StorageContract,
  ): Promise<ManagementReportShowResponse> {
    return {
      ...read,
      photos: await Promise.all(
        read.photos.map(async (photo) => ({
          id: photo.id,
          url: await bucket.signedUrl(photo.path),
        })),
      ),
    }
  }

  /**
   * The raw counts as the dashboard reads them: every kind and status present even at
   * zero (a missing key would read as "unknown" on the chart), and every one of the last
   * 30 days present, so the series has no holes to interpolate.
   */
  static stats(
    raw: ReportStatistics,
    now: Date,
  ): ManagementReportStatsResponse {
    const byKind: Record<ReportKind, number> = {
      [REPORT_KIND.BURNING]: 0,
      [REPORT_KIND.DUMPING]: 0,
      [REPORT_KIND.DEFORESTATION]: 0,
      [REPORT_KIND.OTHER]: 0,
    }
    const byStatus: Record<ReportStatus, number> = {
      [REPORT_STATUS.RECEIVED]: 0,
      [REPORT_STATUS.IN_REVIEW]: 0,
      [REPORT_STATUS.FORWARDED]: 0,
      [REPORT_STATUS.RESOLVED]: 0,
    }
    for (const row of raw.byKind) byKind[row.key] = row.total
    for (const row of raw.byStatus) byStatus[row.key] = row.total
    const perDay = new Map(raw.byDay.map((row) => [row.day, row.total]))

    return {
      total: raw.byKind.reduce((sum, row) => sum + row.total, 0),
      byKind,
      byStatus,
      lastThirtyDays: LocalDay.lastDays(now, STATS_DAYS).map((day) => ({
        day,
        total: perDay.get(day) ?? 0,
      })),
    }
  }
}
