import type { I18n } from '@adonisjs/i18n'

import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'
import HTTPException from '#exceptions/http.exception'
import type { NeighborhoodError } from '#domain/neighborhood/neighborhood.errors'

/**
 * Each refusal of the neighborhood as an HTTP response (`_standards/domain.md` §2). The
 * 409 of the repeated name is the one of the check before saving and the one of the race
 * on the `unique`, which the repository returns as a fact.
 */
export class NeighborhoodRefusal extends RefusalBase {
  private static readonly TABLE = {
    NEIGHBORHOOD_ALREADY_EXISTS: (_fact, i18n) =>
      HTTPException.Conflict(
        i18n.t('neighborhoods.already_exists'),
        'NEIGHBORHOOD_ALREADY_EXISTS',
        { name: i18n.t('neighborhoods.name_taken') },
      ),
    NEIGHBORHOOD_CENTER_INCOMPLETE: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('neighborhoods.center_incomplete'),
        'NEIGHBORHOOD_CENTER_INCOMPLETE',
        { latitude: i18n.t('neighborhoods.center_incomplete_field') },
      ),
    NEIGHBORHOOD_IN_USE: (_fact, i18n) =>
      HTTPException.Conflict(
        i18n.t('neighborhoods.in_use'),
        'NEIGHBORHOOD_IN_USE',
      ),
  } satisfies RefusalTable<NeighborhoodError>

  static http(error: NeighborhoodError, i18n: I18n): HTTPException {
    return NeighborhoodRefusal.translate(
      NeighborhoodRefusal.TABLE,
      error.code,
      error,
      i18n,
    )
  }

  /** A neighborhood id that does not exist, wherever it arrives (path or payload). */
  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(
      i18n.t('neighborhoods.not_found'),
      'NEIGHBORHOOD_NOT_FOUND',
    )
  }

  /** The same fact when it came in a payload: a 422 pointing at the field, never a 404. */
  static unknown(field: string, i18n: I18n): HTTPException {
    return HTTPException.UnprocessableEntity(
      i18n.t('neighborhoods.not_found'),
      'NEIGHBORHOOD_NOT_FOUND',
      { [field]: i18n.t('neighborhoods.not_found') },
    )
  }
}
