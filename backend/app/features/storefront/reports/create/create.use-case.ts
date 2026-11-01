import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'

import { left, right, type Either, type StorefrontReportCreateResponse } from '@curupira/shared'

import { ReportRefusal } from '#features/management/reports/_shared.report-refusal'
import { FileRefusal } from '#features/storages/files/_shared.file-refusal'
import { Report } from '#domain/report/report.entity'
import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { ReportRepository } from '#repositories/report/report.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { ProtocolContract } from '#services/protocol/protocol.contract'
import type { StorefrontReportCreatePayload } from '#validators/storefront/reports.validator'

/** How many protocol draws before giving up; with 2^40 codes, one is the realistic number. */
const MAX_ATTEMPTS = 5

type Payload = StorefrontReportCreatePayload
type Response = Either<HTTPException, StorefrontReportCreateResponse>

/**
 * Receives an anonymous report. The reply is only the protocol: no id, no echo of what was
 * sent, so the route reveals nothing about the stored record.
 */
@inject()
export default class StorefrontReportCreateUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly storages: StorageRepository,
    private readonly protocols: ProtocolContract,
    private readonly unitOfWork: UnitOfWork,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // Photos are checked before any write: a foreign key to a missing or half-uploaded file
      // would be a 500, and the resident should get a 422 pointing at the field.
      if (!(await this.storages.areAttachable(payload.photoIds)))
        return left(FileRefusal.attachmentNotFound('photoIds', this.i18n))
      if (await this.reports.anyPhotoTaken(payload.photoIds))
        return left(ReportRefusal.http({ code: 'REPORT_PHOTO_TAKEN' }, this.i18n))

      const neighborhoodId = await this.neighborhoods.nearestTo(payload)
      const now = new Date()

      // The protocol is drawn, and uniqueness is the database's: on the (astronomically rare)
      // collision the report is saved again with a new draw, each try in its own transaction
      // because a failed unique insert poisons the one it ran in.
      let refusal: HTTPException | null = null
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const report = Report.receive({
          id: randomUUID(),
          eventId: randomUUID(),
          protocol: this.protocols.next(),
          kind: payload.kind,
          latitude: payload.latitude,
          longitude: payload.longitude,
          neighborhoodId,
          description: payload.description,
          contact: payload.contact,
          photoIds: payload.photoIds,
          now,
        })

        const written = await this.unitOfWork.run(() => this.reports.save(report))
        if (written.isRight()) return right({ protocol: report.snapshot().protocol })

        refusal = ReportRefusal.http(written.value, this.i18n)
        if (written.value.code !== 'REPORT_PROTOCOL_TAKEN') break
      }

      return left(refusal ?? ReportRefusal.http({ code: 'REPORT_PROTOCOL_TAKEN' }, this.i18n))
    } catch (error) {
      logger.error({ err: error }, '[storefront/reports > create][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'STOREFRONT_REPORT_CREATE_ERROR'),
      )
    }
  }
}
