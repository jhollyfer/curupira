import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  STORAGE_EXTENSIONS,
  left,
  right,
  type Either,
  type StorefrontReportPhotoCreateResponse,
} from '@curupira/shared'

import { Storage } from '#domain/storage/storage.entity'
import HTTPException from '#exceptions/http.exception'
import { StorageRepository } from '#repositories/storage/storage.repository'
import {
  MultipartContract,
  PART_SIZE,
} from '#services/multipart/multipart.contract'
import { StorageContract } from '#services/storage/storage.contract'
import type { StorefrontReportPhotoCreatePayload } from '#validators/storefront/report-photos.validator'

/**
 * The signed `PUT` lives 3 minutes. The URL needs no login and stays a valid way to write the
 * object until it expires, including after `complete` re-encoded it: a long window would let
 * its holder swap the sanitized photo for one that still carries the sender's EXIF. A few
 * MB fit in three minutes on a phone connection, and the client simply asks for another
 * URL (a new `POST /storefront/report-photos`) when the wait was longer.
 */
const UPLOAD_URL_SECONDS = 3 * 60

type Payload = StorefrontReportPhotoCreatePayload
type Response = Either<HTTPException, StorefrontReportPhotoCreateResponse>

/**
 * Opens a single-part upload. A phone photo is a few MB, so there is no multipart (no
 * `UploadId`, no `ETag` collection): one signed `PUT` with the declared size pinned.
 *
 * The abandoned `PENDING` rows this route can create are swept by `node ace storages:prune`.
 */
@inject()
export default class StorefrontReportPhotoCreateUseCase {
  constructor(
    private readonly bucket: StorageContract,
    private readonly multipart: MultipartContract,
    private readonly storages: StorageRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const key = this.bucket.reportPhotoKey(payload.mimetype)
      const uploadUrl = await this.multipart.signSingle(
        key,
        payload.mimetype,
        payload.size,
        UPLOAD_URL_SECONDS,
      )

      // Born `PENDING`: it cannot be attached to a report until `complete` verified and
      // sanitized the object. The label is generated, never a third-party name.
      const storage = Storage.open({
        id: randomUUID(),
        key,
        originalName: `report-photo.${STORAGE_EXTENSIONS[payload.mimetype]}`,
        mimetype: payload.mimetype,
        size: payload.size,
        uploadId: null,
        partSize: PART_SIZE,
        now: new Date(),
      })
      await this.storages.save(storage)

      return right({ id: storage.id, uploadUrl })
    } catch (error) {
      logger.error({ err: error }, '[storefront/report-photos > create][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_REPORT_PHOTO_CREATE_ERROR',
        ),
      )
    }
  }
}
