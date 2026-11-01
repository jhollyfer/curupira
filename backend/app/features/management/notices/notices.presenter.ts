import type { ManagementNoticeShowResponse } from '@curupira/shared'

import type { Notice } from '#domain/notice/notice.entity'

/**
 * The notice in the shape of the `shared/` response (`_standards/architecture.md` §10).
 * The status is derived at `at`, never stored.
 */
export class NoticePresenter {
  static show(notice: Notice, at: Date): ManagementNoticeShowResponse {
    const { id, title, body, startsAt, endsAt, closedAt, createdAt, updatedAt } = notice.snapshot()

    return {
      id,
      title,
      body,
      status: notice.status(at),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString() ?? null,
      closedAt: closedAt?.toISOString() ?? null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt?.toISOString() ?? null,
    }
  }
}
