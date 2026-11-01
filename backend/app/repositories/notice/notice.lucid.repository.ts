import { inject } from '@adonisjs/core'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'
import { NOTICE_STATUS } from '@curupira/shared'
import type {
  ManagementNoticeShowResponse,
  NoticeStatus,
  Paginated,
  StorefrontNoticeShowResponse,
} from '@curupira/shared'

import { NoticeRepository, type NoticeListCriteria } from './notice.repository.ts'

import NoticeModel from '#models/notice'
import { TransactionContext } from '#core/transaction-context'
import { Notice } from '#domain/notice/notice.entity'

type NoticeQuery = ModelQueryBuilderContract<typeof NoticeModel, NoticeModel>

@inject()
export class NoticeLucidRepository extends NoticeRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<Notice | null> {
    const row = await this.query().where('id', id).first()
    if (!row) return null

    return this.toEntity(row)
  }

  async save(notice: Notice): Promise<void> {
    const { id, startsAt, endsAt, closedAt, createdAt, updatedAt, ...columns } = notice.snapshot()

    await NoticeModel.updateOrCreate(
      { id },
      {
        ...columns,
        startsAt: DateTime.fromJSDate(startsAt),
        endsAt: this.dateOrNull(endsAt),
        closedAt: this.dateOrNull(closedAt),
        createdAt: DateTime.fromJSDate(createdAt),
        updatedAt: this.dateOrNull(updatedAt),
      },
      { client: this.transaction.client() },
    )
  }

  async delete(notice: Notice): Promise<void> {
    await this.query().where('id', notice.id).delete()
  }

  async paginate(criteria: NoticeListCriteria): Promise<Paginated<ManagementNoticeShowResponse>> {
    const query = this.query()
    if (criteria.search) query.whereILike('title', `%${criteria.search}%`)
    if (criteria.status) this.byStatus(query, criteria.status, criteria.now)

    const page = await query
      .orderBy(criteria.sort, criteria.direction)
      .paginate(criteria.page, criteria.perPage)

    return {
      meta: page.getMeta(),
      data: page.all().map((row) => this.toResponse(row, criteria.now)),
    }
  }

  async listActive(now: Date): Promise<StorefrontNoticeShowResponse[]> {
    const query = this.query()
    this.byStatus(query, NOTICE_STATUS.ACTIVE, now)
    const rows = await query.orderBy('startsAt', 'desc')

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      startsAt: row.startsAt.toISO() ?? '',
      endsAt: row.endsAt?.toISO() ?? null,
    }))
  }

  /** The same three-way rule as `Notice.statusOf`, expressed as SQL. */
  private byStatus(query: NoticeQuery, status: NoticeStatus, now: Date): void {
    const at = DateTime.fromJSDate(now).toSQL()
    const cuts = {
      [NOTICE_STATUS.SCHEDULED]: () => query.whereNull('closedAt').where('startsAt', '>', at),
      [NOTICE_STATUS.ACTIVE]: () =>
        query
          .whereNull('closedAt')
          .where('startsAt', '<=', at)
          .where((builder) => {
            builder.whereNull('endsAt').orWhere('endsAt', '>', at)
          }),
      [NOTICE_STATUS.CLOSED]: () =>
        query.where((builder) => {
          builder.whereNotNull('closedAt').orWhere((ended) => {
            ended.whereNotNull('endsAt').where('endsAt', '<=', at)
          })
        }),
    } satisfies Record<NoticeStatus, () => unknown>

    cuts[status]()
  }

  private query() {
    return NoticeModel.query({ client: this.transaction.client() })
  }

  private toEntity(row: NoticeModel): Notice {
    return Notice.restore({
      id: row.id,
      title: row.title,
      body: row.body,
      startsAt: row.startsAt.toJSDate(),
      endsAt: row.endsAt?.toJSDate() ?? null,
      closedAt: row.closedAt?.toJSDate() ?? null,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: row.updatedAt?.toJSDate() ?? null,
    })
  }

  private toResponse(row: NoticeModel, now: Date): ManagementNoticeShowResponse {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      status: Notice.statusOf(
        {
          startsAt: row.startsAt.toJSDate(),
          endsAt: row.endsAt?.toJSDate() ?? null,
          closedAt: row.closedAt?.toJSDate() ?? null,
        },
        now,
      ),
      startsAt: row.startsAt.toISO() ?? '',
      endsAt: row.endsAt?.toISO() ?? null,
      closedAt: row.closedAt?.toISO() ?? null,
      createdAt: row.createdAt.toISO() ?? '',
      updatedAt: row.updatedAt?.toISO() ?? null,
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
