import { REPORT_PUBLIC_STATUSES, left, right } from '@curupira/shared'
import type {
  Either,
  ManagementReportListItemResponse,
  Paginated,
  ReportKind,
  ReportStatus,
  SortDirection,
  StorefrontReportMapResponse,
  StorefrontReportShowByProtocolResponse,
} from '@curupira/shared'

import {
  ReportRepository,
  type ReportFilterCriteria,
  type ReportListCriteria,
  type ReportRead,
  type ReportStatistics,
} from './report.repository.ts'

import { LocalDay } from '#core/local-day'
import { MemoryPagination } from '#core/memory-pagination'
import { Report, type ReportProps } from '#domain/report/report.entity'
import type { ReportError } from '#domain/report/report.errors'

/** The sign of the comparison by sort direction. */
const SIGN = { asc: 1, desc: -1 } satisfies Record<SortDirection, number>

/**
 * The second real implementation, for the use case unit test (`_standards/domain.md`
 * §5.3). It keeps copies: the test does not change the "database" by reference.
 */
export class ReportMemoryRepository extends ReportRepository {
  private readonly rows = new Map<string, ReportProps>()
  private readonly neighborhoods = new Map<string, string>()
  private readonly authors = new Map<string, string>()

  /** Test arrangement: the neighborhood name the join would bring. */
  withNeighborhood(id: string, name: string): this {
    this.neighborhoods.set(id, name)
    return this
  }

  /** Test arrangement: the account name the timeline join would bring. */
  withAuthor(id: string, name: string): this {
    this.authors.set(id, name)
    return this
  }

  async findById(id: string): Promise<Report | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return Report.restore(structuredClone(props))
  }

  async save(report: Report): Promise<Either<ReportError, void>> {
    const snapshot = structuredClone(report.snapshot())
    const all = [...this.rows.values()]

    // The protocol and photo `unique`s, as the database guarantees them.
    if (all.some((row) => row.id !== snapshot.id && row.protocol === snapshot.protocol))
      return left({ code: 'REPORT_PROTOCOL_TAKEN' })
    if (
      all.some(
        (row) =>
          row.id !== snapshot.id && row.photoIds.some((photo) => snapshot.photoIds.includes(photo)),
      )
    )
      return left({ code: 'REPORT_PHOTO_TAKEN' })

    this.rows.set(snapshot.id, snapshot)

    return right(undefined)
  }

  async delete(report: Report): Promise<void> {
    this.rows.delete(report.id)
  }

  async photoStorageIds(reportId: string): Promise<string[]> {
    return [...(this.rows.get(reportId)?.photoIds ?? [])]
  }

  async anyPhotoTaken(storageIds: ReadonlyArray<string>): Promise<boolean> {
    return [...this.rows.values()].some((row) =>
      row.photoIds.some((photo) => storageIds.includes(photo)),
    )
  }

  async detail(id: string): Promise<ReportRead | null> {
    const row = this.rows.get(id)
    if (!row) return null

    return {
      ...this.toListItem(row),
      description: row.description,
      contact: row.contact,
      photos: row.photoIds.map((photo) => ({ id: photo, path: `${photo}.jpg` })),
      events: row.events.map((event) => ({
        status: event.status,
        message: event.message,
        authorName: event.authorId ? (this.authors.get(event.authorId) ?? null) : null,
        at: event.at.toISOString(),
      })),
      updatedAt: row.updatedAt?.toISOString() ?? null,
    }
  }

  async paginate(
    criteria: ReportListCriteria,
  ): Promise<Paginated<ManagementReportListItemResponse>> {
    const search = criteria.search?.toLowerCase()
    const sign = SIGN[criteria.direction]
    const all = this.filtered(criteria)
      .filter(
        (row) =>
          !search ||
          row.protocol.toLowerCase().includes(search) ||
          (row.description ?? '').toLowerCase().includes(search),
      )
      .sort((a, b) => {
        if (criteria.sort === 'createdAt')
          return sign * (a.createdAt.getTime() - b.createdAt.getTime())

        return sign * String(a[criteria.sort]).localeCompare(String(b[criteria.sort]))
      })
    const page = MemoryPagination.slice(all, criteria.page, criteria.perPage)

    return { meta: page.meta, data: page.data.map((row) => this.toListItem(row)) }
  }

  async pins(criteria: ReportFilterCriteria): Promise<ManagementReportListItemResponse[]> {
    return this.filtered(criteria)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => this.toListItem(row))
  }

  async statistics(since: Date): Promise<ReportStatistics> {
    const rows = [...this.rows.values()]
    const kinds = new Map<ReportKind, number>()
    const statuses = new Map<ReportStatus, number>()
    const days = new Map<string, number>()

    for (const row of rows) {
      kinds.set(row.kind, (kinds.get(row.kind) ?? 0) + 1)
      statuses.set(row.status, (statuses.get(row.status) ?? 0) + 1)
      if (row.createdAt >= since) {
        const day = LocalDay.of(row.createdAt)
        days.set(day, (days.get(day) ?? 0) + 1)
      }
    }

    return {
      byKind: [...kinds].map(([key, total]) => ({ key, total })),
      byStatus: [...statuses].map(([key, total]) => ({ key, total })),
      byDay: [...days].map(([day, total]) => ({ day, total })),
    }
  }

  async showByProtocol(protocol: string): Promise<StorefrontReportShowByProtocolResponse | null> {
    const row = [...this.rows.values()].find((each) => each.protocol === protocol)
    if (!row) return null

    return {
      protocol: row.protocol,
      kind: row.kind,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      events: row.events.map((event) => ({
        status: event.status,
        message: event.message,
        at: event.at.toISOString(),
      })),
    }
  }

  async publicMap(): Promise<StorefrontReportMapResponse[]> {
    return [...this.rows.values()]
      .filter((row) => REPORT_PUBLIC_STATUSES.some((status) => status === row.status))
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        status: row.status,
        latitude: row.latitude,
        longitude: row.longitude,
        day: LocalDay.of(row.createdAt),
      }))
  }

  private filtered(criteria: ReportFilterCriteria): ReportProps[] {
    return [...this.rows.values()].filter(
      (row) =>
        (!criteria.kind || row.kind === criteria.kind) &&
        (!criteria.status || row.status === criteria.status) &&
        (!criteria.neighborhoodId || row.neighborhoodId === criteria.neighborhoodId) &&
        (!criteria.from || row.createdAt >= criteria.from) &&
        (!criteria.to || row.createdAt <= criteria.to),
    )
  }

  private toListItem(row: ReportProps): ManagementReportListItemResponse {
    return {
      id: row.id,
      protocol: row.protocol,
      kind: row.kind,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      neighborhoodId: row.neighborhoodId,
      neighborhoodName: row.neighborhoodId
        ? (this.neighborhoods.get(row.neighborhoodId) ?? null)
        : null,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
