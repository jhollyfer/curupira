import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { REPORT_PHOTO_MIMETYPES, left, right, type Either } from '@curupira/shared'

import { ReportPhotoRefusal } from '../_shared.report-photo-refusal.ts'

import type { Storage } from '#domain/storage/storage.entity'
import HTTPException from '#exceptions/http.exception'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'
import { StorageContract } from '#services/storage/storage.contract'
import { FileRefusal } from '#features/storages/files/_shared.file-refusal'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

/** Verifies, sanitizes and confirms a report photo. */
@inject()
export default class StorefrontReportPhotoCompleteUseCase {
  constructor(
    private readonly bucket: StorageContract,
    private readonly storages: StorageRepository,
    private readonly sanitizer: PhotoSanitizerContract,
    private readonly i18n: I18n,
  ) {}

  /**
   * Deletes what was uploaded wrong, binary and row: a `PENDING` whose object is gone can
   * never be confirmed and would sit forever on an id someone might try to attach.
   */
  private async discard(storage: Storage): Promise<void> {
    try {
      await this.bucket.discard(storage.snapshot().path)
      await this.storages.delete(storage)
    } catch (error) {
      logger.error({ err: error }, '[storefront/report-photos > complete][discard][error]')
    }
  }

  async execute({ id }: Payload): Promise<Response> {
    try {
      const storage = await this.storages.findById(id)
      if (!storage) return left(ReportPhotoRefusal.notFound(this.i18n))

      const file = storage.snapshot()
      // Only a pending image of this flow is touched. An already confirmed file is left exactly
      // as it is: re-encoding someone else's file because its uuid was sent here would be an
      // anonymous write over it. Confirmed means the answer to a retry is simply "done".
      if (storage.isUploaded()) return right(null)
      if (!REPORT_PHOTO_MIMETYPES.some((mimetype) => mimetype === file.mimetype))
        return left(ReportPhotoRefusal.notFound(this.i18n))

      const metadata = await this.bucket.metadata(file.path)
      const head = await this.bucket.head(file.path)
      const completed = storage.complete({ contentLength: metadata.contentLength, head }, new Date())
      if (completed.isLeft()) {
        await this.discard(storage)

        return left(FileRefusal.http(completed.value, this.i18n))
      }

      // Strip BEFORE saving `UPLOADED`: the row only becomes attachable once the object in the
      // bucket is the sanitized one, so there is no window where a report could show a photo
      // that still carries the sender's coordinates.
      const original = await this.bucket.read(file.path)
      const clean = await this.sanitizer.strip(file.mimetype, original)
      if (!clean) {
        await this.discard(storage)

        return left(ReportPhotoRefusal.invalidImage(this.i18n))
      }

      await this.bucket.overwrite(file.path, clean, file.mimetype)
      await this.storages.save(storage)

      return right(null)
    } catch (error) {
      logger.error({ err: error }, '[storefront/report-photos > complete][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'STOREFRONT_REPORT_PHOTO_COMPLETE_ERROR'),
      )
    }
  }
}
