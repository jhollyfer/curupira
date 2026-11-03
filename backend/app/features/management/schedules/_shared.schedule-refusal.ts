import type { I18n } from '@adonisjs/i18n'

import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'
import HTTPException from '#exceptions/http.exception'
import type { CollectionScheduleError } from '#domain/collection-schedule/collection-schedule.errors'

/**
 * Each refusal of the collection slot as an HTTP response (`_standards/domain.md` §2). The
 * 409 of the repeated slot is the one of the check before saving and the one of the race
 * on the `unique`, which the repository returns as a fact.
 */
export class ScheduleRefusal extends RefusalBase {
  private static readonly TABLE = {
    SCHEDULE_ALREADY_EXISTS: (_fact, i18n) =>
      HTTPException.Conflict(
        i18n.t('schedules.already_exists'),
        'SCHEDULE_ALREADY_EXISTS',
        {
          weekday: i18n.t('schedules.slot_taken'),
        },
      ),
  } satisfies RefusalTable<CollectionScheduleError>

  static http(error: CollectionScheduleError, i18n: I18n): HTTPException {
    return ScheduleRefusal.translate(
      ScheduleRefusal.TABLE,
      error.code,
      error,
      i18n,
    )
  }

  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(
      i18n.t('schedules.not_found'),
      'SCHEDULE_NOT_FOUND',
    )
  }
}
