import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type ManagementScheduleShowResponse,
  type Merge,
} from '@curupira/shared'

import { ScheduleRefusal } from '../_shared.schedule-refusal.ts'

import { NeighborhoodRefusal } from '#features/management/neighborhoods/_shared.neighborhood-refusal'
import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import type { IdentifierPayload } from '#core/validator'
import type { ManagementScheduleUpdatePayload } from '#validators/management/schedules.validator'

type Payload = Merge<ManagementScheduleUpdatePayload, IdentifierPayload>
type Response = Either<HTTPException, ManagementScheduleShowResponse>

/** Edits the slot. A missing field means "leave alone". */
@inject()
export default class ManagementScheduleUpdateUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, ...changes }: Payload): Promise<Response> {
    try {
      const schedule = await this.schedules.findById(id)
      if (!schedule) return left(ScheduleRefusal.notFound(this.i18n))

      if (changes.neighborhoodId && !(await this.neighborhoods.findById(changes.neighborhoodId)))
        return left(NeighborhoodRefusal.unknown('neighborhoodId', this.i18n))

      const current = schedule.snapshot()
      const slot = {
        neighborhoodId: changes.neighborhoodId ?? current.neighborhoodId,
        wasteType: changes.wasteType ?? current.wasteType,
        weekday: changes.weekday ?? current.weekday,
        shift: changes.shift ?? current.shift,
      }
      if (await this.schedules.existsSlot(slot, id))
        return left(ScheduleRefusal.http({ code: 'SCHEDULE_ALREADY_EXISTS' }, this.i18n))

      schedule.update(changes, new Date())
      const saved = await this.schedules.save(schedule)
      if (saved.isLeft()) return left(ScheduleRefusal.http(saved.value, this.i18n))

      const detail = await this.schedules.detail(id)
      if (!detail) return left(ScheduleRefusal.notFound(this.i18n))

      return right(detail)
    } catch (error) {
      logger.error({ err: error }, '[management/schedules > update][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_SCHEDULE_UPDATE_ERROR',
        ),
      )
    }
  }
}
