import type {
  Either,
  ManagementReportListItemResponse,
  ManagementReportShowResponse,
  Paginated,
  ReportKind,
  ReportStatus,
  SortDirection,
  StorefrontReportMapResponse,
  StorefrontReportShowByProtocolResponse,
} from '@curupira/shared'

import type { Report } from '#domain/report/report.entity'
import type { ReportError } from '#domain/report/report.errors'

/** The cuts the panel list and the panel map share. */
export type ReportFilterCriteria = {
  readonly kind?: ReportKind
  readonly status?: ReportStatus
  readonly neighborhoodId?: string
  readonly from?: Date
  readonly to?: Date
}

export type ReportListCriteria = ReportFilterCriteria & {
  readonly page: number
  readonly perPage: number
  readonly search?: string
  readonly sort: 'createdAt' | 'status' | 'kind'
  readonly direction: SortDirection
}

/**
 * The report in the panel response shape, with the photos without the `url`: signing
 * belongs to the use case, through the bucket contract (`_standards/architecture.md` §2,
 * `StorageContract.withUrl`).
 */
export type ReportRead = Omit<ManagementReportShowResponse, 'photos'> & {
  readonly photos: ReadonlyArray<{ readonly id: string; readonly path: string }>
}

/** Raw counts for the dashboard; the zero-filled shape is the use case's job. */
export type ReportStatistics = {
  readonly byKind: ReadonlyArray<{ readonly key: ReportKind; readonly total: number }>
  readonly byStatus: ReadonlyArray<{ readonly key: ReportStatus; readonly total: number }>
  /** Reports created per calendar day (UTC) since `since`, only the days that have any. */
  readonly byDay: ReadonlyArray<{ readonly day: string; readonly total: number }>
}

/**
 * The report persistence, by intent (`_standards/domain.md` §5.1). The single writer of
 * `reports`, `report_photos` and `report_status_events` - the report is their aggregate.
 *
 * The public reads (`showByProtocol`, `publicMap`) are separate methods with their own
 * narrow shapes, not a filtered `detail`: what a public route may see is decided here,
 * once, by what the method selects, so a new column can never leak by being added to the
 * panel read.
 */
export abstract class ReportRepository {
  abstract findById(id: string): Promise<Report | null>
  /**
   * Saves the report with its new timeline events and, on birth, its photos. A protocol
   * already taken (the race on the `unique`) comes back as `REPORT_PROTOCOL_TAKEN`, and a
   * photo already attached elsewhere as `REPORT_PHOTO_TAKEN`.
   */
  abstract save(report: Report): Promise<Either<ReportError, void>>
  abstract delete(report: Report): Promise<void>
  /** The storage ids of the report's photos, so the binaries can be discarded with it. */
  abstract photoStorageIds(reportId: string): Promise<string[]>
  /** Any of the files is already attached to a report. */
  abstract anyPhotoTaken(storageIds: ReadonlyArray<string>): Promise<boolean>
  /** Panel read of one report: contact, description, photos and the whole timeline. */
  abstract detail(id: string): Promise<ReportRead | null>
  abstract paginate(
    criteria: ReportListCriteria,
  ): Promise<Paginated<ManagementReportListItemResponse>>
  /** Every report matching the cuts, as pins: no page, the map draws them all. */
  abstract pins(criteria: ReportFilterCriteria): Promise<ManagementReportListItemResponse[]>
  abstract statistics(since: Date): Promise<ReportStatistics>
  /**
   * The public status page: protocol, type, status, date and timeline. Never the contact,
   * the description, the photos, the coordinates or who answered.
   */
  abstract showByProtocol(protocol: string): Promise<StorefrontReportShowByProtocolResponse | null>
  /** The public map: only the public statuses, the day without the hour, no text, no contact. */
  abstract publicMap(): Promise<StorefrontReportMapResponse[]>
}
