import type {
  ManagementNoticeShowResponse,
  Paginated,
  SortDirection,
  StorefrontNoticeShowResponse,
} from '@curupira/shared'

import { NoticeRepository, type NoticeListCriteria } from './notice.repository.ts'

import { MemoryPagination } from '#core/memory-pagination'
import { Notice, type NoticeProps } from '#domain/notice/notice.entity'

/** The sign of the comparison by sort direction. */
const SIGN = { asc: 1, desc: -1 } satisfies Record<SortDirection, number>

/** The second real implementation, for the use case unit test (`_standards/domain.md` §5.3). */
export class NoticeMemoryRepository extends NoticeRepository {
  private readonly rows = new Map<string, NoticeProps>()

  async findById(id: string): Promise<Notice | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return Notice.restore(structuredClone(props))
  }

  async save(notice: Notice): Promise<void> {
    const snapshot = structuredClone(notice.snapshot())
    this.rows.set(snapshot.id, snapshot)
  }

  async delete(notice: Notice): Promise<void> {
    this.rows.delete(notice.id)
  }

  async paginate(criteria: NoticeListCriteria): Promise<Paginated<ManagementNoticeShowResponse>> {
    const search = criteria.search?.toLowerCase()
    const sign = SIGN[criteria.direction]
    const all = [...this.rows.values()]
      .filter((row) => !search || row.title.toLowerCase().includes(search))
      .filter((row) => !criteria.status || Notice.statusOf(row, criteria.now) === criteria.status)
      .sort((a, b) => sign * String(a[criteria.sort]).localeCompare(String(b[criteria.sort])))
    const page = MemoryPagination.slice(all, criteria.page, criteria.perPage)

    return {
      meta: page.meta,
      data: page.data.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        status: Notice.statusOf(row, criteria.now),
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        closedAt: row.closedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt?.toISOString() ?? null,
      })),
    }
  }

  async listActive(now: Date): Promise<StorefrontNoticeShowResponse[]> {
    return [...this.rows.values()]
      .filter((row) => Notice.statusOf(row, now) === 'ACTIVE')
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
      }))
  }
}
