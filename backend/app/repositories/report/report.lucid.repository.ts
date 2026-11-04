import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import {
  REPORT_KINDS,
  REPORT_PUBLIC_STATUSES,
  REPORT_STATUS,
  REPORT_STATUSES,
  left,
  right,
} from '@curupira/shared'
import type {
  Either,
  ManagementReportListItemResponse,
  Paginated,
  ReportKind,
  ReportStatus,
  StorefrontReportMapResponse,
  StorefrontReportShowByProtocolResponse,
} from '@curupira/shared'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'

import {
  ReportRepository,
  type ReportFilterCriteria,
  type ReportListCriteria,
  type ReportRead,
  type ReportStatistics,
} from './report.repository.ts'

import ReportModel from '#models/report'
import { PostgresError } from '#core/postgres-error'
import { LOCAL_TIME_ZONE, LocalDay } from '#core/local-day'
import { TransactionContext } from '#core/transaction-context'
import { Report } from '#domain/report/report.entity'
import type { ReportError } from '#domain/report/report.errors'

/** The report columns of the list and the map, with the neighborhood name joined in. */
type ListRow = {
  id: string
  protocol: string
  kind: ReportKind
  status: ReportStatus
  latitude: number
  longitude: number
  neighborhood_id: string | null
  neighborhood_name: string | null
  created_at: Date
}

/** Sort keys of the list, as the qualified column each one means. */
const SORT_COLUMNS = {
  createdAt: 'reports.created_at',
  status: 'reports.status',
  kind: 'reports.kind',
} as const

/** The base query of the list, the map and the detail (see `listing`). */
type ListingQuery = ReturnType<
  ReturnType<QueryClientContract['from']>['leftJoin']
>

const PROTOCOL_CONSTRAINT = 'reports_protocol_unique'

@inject()
export class ReportLucidRepository extends ReportRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<Report | null> {
    const client = this.transaction.client()
    const row = await ReportModel.query({ client }).where('id', id).first()
    if (!row) return null

    const [photos, events] = await Promise.all([
      client
        .from('report_photos')
        .where('report_id', id)
        .orderBy('position', 'asc'),
      client
        .from('report_status_events')
        .where('report_id', id)
        .orderBy('at', 'asc'),
    ])

    return Report.restore({
      id: row.id,
      protocol: row.protocol,
      kind: row.kind,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      neighborhoodId: row.neighborhoodId,
      description: row.description,
      contact: row.contact,
      anonymous: row.anonymous,
      photoIds: photos.map((photo: { storage_id: string }) => photo.storage_id),
      events: events.map(
        (event: {
          id: string
          status: ReportStatus
          message: string | null
          author_id: string | null
          at: Date
        }) => ({
          id: event.id,
          status: event.status,
          message: event.message,
          authorId: event.author_id,
          at: event.at,
        }),
      ),
      createdAt: row.createdAt.toJSDate(),
      updatedAt: row.updatedAt?.toJSDate() ?? null,
    })
  }

  async save(report: Report): Promise<Either<ReportError, void>> {
    const { id, events, photoIds, createdAt, updatedAt, ...columns } =
      report.snapshot()
    const client = this.transaction.client()

    try {
      await ReportModel.updateOrCreate(
        { id },
        {
          ...columns,
          createdAt: DateTime.fromJSDate(createdAt),
          updatedAt: this.dateOrNull(updatedAt),
        },
        { client },
      )

      // The timeline is append-only: only the events the table does not have yet are
      // inserted, so saving after `advance` writes one row and never rewrites history.
      const known = await client
        .from('report_status_events')
        .where('report_id', id)
        .select('id')
      const knownIds = new Set(known.map((event: { id: string }) => event.id))
      const fresh = events.filter((event) => !knownIds.has(event.id))
      if (fresh.length > 0)
        await client.table('report_status_events').multiInsert(
          fresh.map((event) => ({
            id: event.id,
            report_id: id,
            status: event.status,
            message: event.message,
            author_id: event.authorId,
            at: event.at,
            created_at: event.at,
          })),
        )

      // Photos are attached once, at birth: a report does not change its evidence.
      const attached = await client
        .from('report_photos')
        .where('report_id', id)
        .first()
      if (!attached && photoIds.length > 0)
        await client.table('report_photos').multiInsert(
          photoIds.map((storageId, position) => ({
            id: randomUUID(),
            report_id: id,
            storage_id: storageId,
            position,
            created_at: createdAt,
          })),
        )

      return right(undefined)
    } catch (error) {
      if (PostgresError.violatedConstraint(error) === PROTOCOL_CONSTRAINT)
        return left({ code: 'REPORT_PROTOCOL_TAKEN' })
      if (PostgresError.isUniqueViolation(error))
        return left({ code: 'REPORT_PHOTO_TAKEN' })

      throw error
    }
  }

  async delete(report: Report): Promise<void> {
    await ReportModel.query({ client: this.transaction.client() })
      .where('id', report.id)
      .delete()
  }

  async photoStorageIds(reportId: string): Promise<string[]> {
    const rows = await this.transaction
      .client()
      .from('report_photos')
      .where('report_id', reportId)
      .select('storage_id')

    return rows.map((row: { storage_id: string }) => row.storage_id)
  }

  async anyPhotoTaken(storageIds: ReadonlyArray<string>): Promise<boolean> {
    const row = await this.transaction
      .client()
      .from('report_photos')
      .whereIn('storage_id', [...storageIds])
      .first()

    return Boolean(row)
  }

  async detail(id: string): Promise<ReportRead | null> {
    const client = this.transaction.client()
    const row:
      | (ListRow & {
          description: string | null
          contact: string | null
          updated_at: Date | null
        })
      | null = await this.listing(client).where('reports.id', id).first()
    if (!row) return null

    const [photos, events] = await Promise.all([
      client
        .from('report_photos')
        .join('storages', 'storages.id', 'report_photos.storage_id')
        .where('report_photos.report_id', id)
        .orderBy('report_photos.position', 'asc')
        .select('storages.id as id', 'storages.path as path'),
      client
        .from('report_status_events')
        .leftJoin('users', 'users.id', 'report_status_events.author_id')
        .where('report_status_events.report_id', id)
        .orderBy('report_status_events.at', 'asc')
        .select(
          'report_status_events.status as status',
          'report_status_events.message as message',
          'report_status_events.at as at',
          'users.name as author_name',
        ),
    ])

    return {
      ...this.toListItem(row),
      description: row.description,
      contact: row.contact,
      photos: photos.map((photo: { id: string; path: string }) => ({
        id: photo.id,
        path: photo.path,
      })),
      events: events.map(
        (event: {
          status: ReportStatus
          message: string | null
          at: Date
          author_name: string | null
        }) => ({
          status: event.status,
          message: event.message,
          authorName: event.author_name,
          at: event.at.toISOString(),
        }),
      ),
      updatedAt: row.updated_at?.toISOString() ?? null,
    }
  }

  async paginate(
    criteria: ReportListCriteria,
  ): Promise<Paginated<ManagementReportListItemResponse>> {
    const query = this.filtered(
      this.listing(this.transaction.client()),
      criteria,
    )
    if (criteria.search) {
      const search = `%${criteria.search}%`

      // The `OR` goes inside a subquery: loose, it would escape the filters' `AND`.
      query.where((builder) => {
        builder
          .whereILike('reports.protocol', search)
          .orWhereILike('reports.description', search)
      })
    }

    const page = await query
      .orderBy(SORT_COLUMNS[criteria.sort], criteria.direction)
      .orderBy('reports.id', 'asc')
      .paginate(criteria.page, criteria.perPage)
    const rows: ListRow[] = page.all()

    return {
      meta: page.getMeta(),
      data: rows.map((row) => this.toListItem(row)),
    }
  }

  async pins(
    criteria: ReportFilterCriteria,
  ): Promise<ManagementReportListItemResponse[]> {
    const rows: ListRow[] = await this.filtered(
      this.listing(this.transaction.client()),
      criteria,
    ).orderBy('reports.created_at', 'desc')

    return rows.map((row) => this.toListItem(row))
  }

  async statistics(since: Date): Promise<ReportStatistics> {
    const client = this.transaction.client()
    const [byKind, byStatus, byDay, responses] = await Promise.all([
      client
        .from('reports')
        .groupBy('kind')
        .select('kind as key')
        .count('* as total'),
      client
        .from('reports')
        .groupBy('status')
        .select('status as key')
        .count('* as total'),
      client
        .from('reports')
        .where('created_at', '>=', since)
        .select(
          client.raw(
            `to_char(created_at at time zone '${LOCAL_TIME_ZONE}', 'YYYY-MM-DD') as day`,
          ),
        )
        .count('* as total')
        .groupByRaw(
          `to_char(created_at at time zone '${LOCAL_TIME_ZONE}', 'YYYY-MM-DD')`,
        ),
      // The first answer is the earliest event past `RECEIVED`; the index on
      // (report_id, at) serves the correlated subquery.
      client
        .from('reports')
        .where('created_at', '>=', since)
        .select('created_at')
        .select(
          client.raw(
            '(select min(e.at) from report_status_events e where e.report_id = reports.id and e.status <> ?) as responded_at',
            [REPORT_STATUS.RECEIVED],
          ),
        ),
    ])

    return {
      byKind: byKind
        .filter((row: { key: ReportKind }) => REPORT_KINDS.includes(row.key))
        .map((row: { key: ReportKind; total: string | number }) => ({
          key: row.key,
          total: Number(row.total),
        })),
      byStatus: byStatus
        .filter((row: { key: ReportStatus }) =>
          REPORT_STATUSES.includes(row.key),
        )
        .map((row: { key: ReportStatus; total: string | number }) => ({
          key: row.key,
          total: Number(row.total),
        })),
      byDay: byDay.map((row: { day: string; total: string | number }) => ({
        day: row.day,
        total: Number(row.total),
      })),
      responses: responses.map(
        (row: {
          created_at: Date | string
          responded_at: Date | string | null
        }) => {
          let respondedAt: Date | null = null
          if (row.responded_at !== null)
            respondedAt = new Date(row.responded_at)

          return { createdAt: new Date(row.created_at), respondedAt }
        },
      ),
    }
  }

  async showByProtocol(
    protocol: string,
  ): Promise<StorefrontReportShowByProtocolResponse | null> {
    const client = this.transaction.client()
    // The column list is the whole public surface of this read: nothing else is selected.
    const row: {
      id: string
      protocol: string
      kind: ReportKind
      status: ReportStatus
      created_at: Date
    } | null = await client
      .from('reports')
      .where('protocol', protocol)
      .select('id', 'protocol', 'kind', 'status', 'created_at')
      .first()
    if (!row) return null

    const events: Array<{
      status: ReportStatus
      message: string | null
      at: Date
    }> = await client
      .from('report_status_events')
      .where('report_id', row.id)
      .orderBy('at', 'asc')
      .select('status', 'message', 'at')

    return {
      protocol: row.protocol,
      kind: row.kind,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      events: events.map((event) => ({
        status: event.status,
        message: event.message,
        at: event.at.toISOString(),
      })),
    }
  }

  async publicMap(limit: number): Promise<StorefrontReportMapResponse[]> {
    const rows: Array<{
      id: string
      kind: ReportKind
      status: ReportStatus
      latitude: number
      longitude: number
      created_at: Date
    }> = await this.transaction
      .client()
      .from('reports')
      .whereIn('status', [...REPORT_PUBLIC_STATUSES])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .select('id', 'kind', 'status', 'latitude', 'longitude', 'created_at')

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      // The day, never the hour: with the pin, the hour would single out who was there.
      day: LocalDay.of(row.created_at),
    }))
  }

  /** The report columns plus the neighborhood name, the base of the list, the map and the detail. */
  private listing(client: QueryClientContract) {
    return client
      .from('reports')
      .leftJoin('neighborhoods', 'neighborhoods.id', 'reports.neighborhood_id')
      .select('reports.*')
      .select('neighborhoods.name as neighborhood_name')
  }

  private filtered<TQuery extends ListingQuery>(
    query: TQuery,
    criteria: ReportFilterCriteria,
  ): TQuery {
    return query
      .if(criteria.kind, (builder) =>
        builder.where('reports.kind', String(criteria.kind)),
      )
      .if(criteria.status, (builder) =>
        builder.where('reports.status', String(criteria.status)),
      )
      .if(criteria.neighborhoodId, (builder) =>
        builder.where(
          'reports.neighborhood_id',
          String(criteria.neighborhoodId),
        ),
      )
      .if(criteria.from, (builder) =>
        builder.where('reports.created_at', '>=', criteria.from ?? ''),
      )
      .if(criteria.to, (builder) =>
        builder.where('reports.created_at', '<=', criteria.to ?? ''),
      )
  }

  private toListItem(row: ListRow): ManagementReportListItemResponse {
    return {
      id: row.id,
      protocol: row.protocol,
      kind: row.kind,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      neighborhoodId: row.neighborhood_id,
      neighborhoodName: row.neighborhood_name,
      createdAt: row.created_at.toISOString(),
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
