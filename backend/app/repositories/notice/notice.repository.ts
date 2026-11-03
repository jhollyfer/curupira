import type {
  ManagementNoticeShowResponse,
  NoticeStatus,
  Paginated,
  SortDirection,
  StorefrontNoticeShowResponse,
} from '@curupira/shared'

import type { Notice } from '#domain/notice/notice.entity'

export type NoticeListCriteria = {
  readonly page: number
  readonly perPage: number
  readonly search?: string
  readonly status?: NoticeStatus
  /** The instant the derived status is measured at; comes from the use case clock. */
  readonly now: Date
  readonly sort: 'title' | 'startsAt' | 'createdAt'
  readonly direction: SortDirection
}

/**
 * The notice persistence, by intent (`_standards/domain.md` §5.1). The single writer of
 * the `notices` table. The status is derived from dates, so the filter by status lives
 * inside the implementation: the contract says which notices it wants, not how to cut them.
 */
export abstract class NoticeRepository {
  abstract findById(id: string): Promise<Notice | null>
  abstract save(notice: Notice): Promise<void>
  abstract delete(notice: Notice): Promise<void>
  abstract paginate(
    criteria: NoticeListCriteria,
  ): Promise<Paginated<ManagementNoticeShowResponse>>
  /** What the home shows at the instant: active only, the most recent start first. */
  abstract listActive(now: Date): Promise<StorefrontNoticeShowResponse[]>
}
