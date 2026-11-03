import {
  NOTICE_STATUS,
  left,
  right,
  type Either,
  type NoticeStatus,
} from '@curupira/shared'

import type { NoticeError } from './notice.errors.ts'

export type NoticeProps = {
  readonly id: string
  title: string
  body: string
  startsAt: Date
  endsAt: Date | null
  closedAt: Date | null
  readonly createdAt: Date
  updatedAt: Date | null
}

type NoticeChanges = {
  readonly title?: string
  readonly body?: string
  readonly startsAt?: Date
  readonly endsAt?: Date | null
}

/**
 * A notice from the city hall, shown on the home between two dates (`_standards/domain.md`
 * §1). The status is derived from the dates and from `closedAt`, never stored: a stored
 * status would need a job to flip it at the right minute, and would be wrong until it ran.
 */
export class Notice {
  private constructor(private readonly props: NoticeProps) {}

  static create(input: {
    readonly id: string
    readonly title: string
    readonly body: string
    readonly startsAt: Date
    readonly endsAt?: Date | null
    readonly now: Date
  }): Either<NoticeError, Notice> {
    const endsAt = input.endsAt ?? null
    if (endsAt !== null && endsAt <= input.startsAt)
      return left({ code: 'NOTICE_INVALID_PERIOD' })

    return right(
      new Notice({
        id: input.id,
        title: input.title,
        body: input.body,
        startsAt: input.startsAt,
        endsAt,
        closedAt: null,
        createdAt: input.now,
        updatedAt: input.now,
      }),
    )
  }

  static restore(props: NoticeProps): Notice {
    return new Notice({ ...props })
  }

  update(changes: NoticeChanges, now: Date): Either<NoticeError, Notice> {
    const startsAt = changes.startsAt ?? this.props.startsAt
    const endsAt = Notice.keep(changes.endsAt, this.props.endsAt)
    if (endsAt !== null && endsAt <= startsAt)
      return left({ code: 'NOTICE_INVALID_PERIOD' })

    if (changes.title !== undefined) this.props.title = changes.title
    if (changes.body !== undefined) this.props.body = changes.body
    this.props.startsAt = startsAt
    this.props.endsAt = endsAt
    this.props.updatedAt = now

    return right(this)
  }

  /** Ends the showing now, by hand. Closing twice is a conflict: the first time already did it. */
  close(now: Date): Either<NoticeError, Notice> {
    if (this.props.closedAt !== null)
      return left({ code: 'NOTICE_ALREADY_CLOSED' })

    this.props.closedAt = now
    this.props.updatedAt = now

    return right(this)
  }

  /** An absent change keeps the current value; `null` is a change (erase). */
  private static keep(
    change: Date | null | undefined,
    current: Date | null,
  ): Date | null {
    if (change === undefined) return current

    return change
  }

  status(at: Date): NoticeStatus {
    return Notice.statusOf(this.props, at)
  }

  /** The same rule for a row read without hydrating the entity. */
  static statusOf(
    notice: Pick<NoticeProps, 'startsAt' | 'endsAt' | 'closedAt'>,
    at: Date,
  ): NoticeStatus {
    if (notice.closedAt !== null) return NOTICE_STATUS.CLOSED
    if (notice.endsAt !== null && notice.endsAt <= at)
      return NOTICE_STATUS.CLOSED
    if (notice.startsAt > at) return NOTICE_STATUS.SCHEDULED

    return NOTICE_STATUS.ACTIVE
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<NoticeProps> {
    return { ...this.props }
  }
}
