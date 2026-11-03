import {
  REPORT_STATUS,
  REPORT_STATUSES,
  left,
  right,
  type Either,
  type ReportKind,
  type ReportStatus,
} from '@curupira/shared'

import type { ReportError } from './report.errors.ts'

/** One line of the timeline the resident follows. */
export type ReportStatusEventProps = {
  readonly id: string
  readonly status: ReportStatus
  readonly message: string | null
  /** Who moved the status; `null` for the first event (the resident) and for a removed account. */
  readonly authorId: string | null
  readonly at: Date
}

export type ReportProps = {
  readonly id: string
  readonly protocol: string
  readonly kind: ReportKind
  status: ReportStatus
  readonly latitude: number
  readonly longitude: number
  neighborhoodId: string | null
  readonly description: string | null
  /** Never leaves through a public route; only the panel reads it. */
  readonly contact: string | null
  /** Derived from the absence of `contact`: the resident does not declare it. */
  readonly anonymous: boolean
  readonly photoIds: ReadonlyArray<string>
  events: ReportStatusEventProps[]
  readonly createdAt: Date
  updatedAt: Date | null
}

/**
 * The environmental report (`_standards/domain.md` §1). Born `RECEIVED` with its first
 * timeline event; the status only advances, and every advance leaves an event, so the
 * timeline the resident reads by protocol is the record itself and not a summary of it.
 */
export class Report {
  private constructor(private readonly props: ReportProps) {}

  /** Birth. Ids, protocol and clock come from outside: the domain does no I/O. */
  static receive(input: {
    readonly id: string
    readonly eventId: string
    readonly protocol: string
    readonly kind: ReportKind
    readonly latitude: number
    readonly longitude: number
    readonly neighborhoodId: string | null
    readonly description?: string | null
    readonly contact?: string | null
    readonly photoIds: ReadonlyArray<string>
    readonly now: Date
  }): Report {
    const contact = input.contact ?? null

    return new Report({
      id: input.id,
      protocol: input.protocol,
      kind: input.kind,
      status: REPORT_STATUS.RECEIVED,
      latitude: input.latitude,
      longitude: input.longitude,
      neighborhoodId: input.neighborhoodId,
      description: input.description ?? null,
      contact,
      anonymous: contact === null,
      photoIds: [...input.photoIds],
      events: [
        {
          id: input.eventId,
          status: REPORT_STATUS.RECEIVED,
          message: null,
          authorId: null,
          at: input.now,
        },
      ],
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  static restore(props: ReportProps): Report {
    return new Report({
      ...props,
      events: props.events.map((event) => ({ ...event })),
    })
  }

  /** Moves the status forward (skipping steps is allowed: a report can go straight to forwarded). */
  advance(
    input: {
      readonly eventId: string
      readonly status: ReportStatus
      readonly message?: string | null
      readonly authorId: string
    },
    now: Date,
  ): Either<ReportError, Report> {
    if (
      REPORT_STATUSES.indexOf(input.status) <=
      REPORT_STATUSES.indexOf(this.props.status)
    )
      return left({ code: 'REPORT_STATUS_REGRESSION' })

    this.props.status = input.status
    this.props.events.push({
      id: input.eventId,
      status: input.status,
      message: input.message ?? null,
      authorId: input.authorId,
      at: now,
    })
    this.props.updatedAt = now

    return right(this)
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<ReportProps> {
    return {
      ...this.props,
      events: this.props.events.map((event) => ({ ...event })),
    }
  }
}
