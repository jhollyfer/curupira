import type { I18n } from '@adonisjs/i18n'

import HTTPException from '#exceptions/http.exception'

/** The refusals only the anonymous photo flow has; the file ones come from `FileRefusal`. */
export class ReportPhotoRefusal {
  /**
   * The id is not a pending report photo: unknown, already confirmed, or a file of another
   * flow. All three answer the same `404`, so the route cannot be used to probe which ids exist.
   */
  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(i18n.t('files.not_found'), 'REPORT_PHOTO_NOT_FOUND')
  }

  /** The bytes are not an image the decoder accepts, whatever they started with. */
  static invalidImage(i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(i18n.t('reports.photo_invalid'), 'REPORT_PHOTO_INVALID', {
      photoIds: i18n.t('reports.photo_invalid'),
    })
  }
}
