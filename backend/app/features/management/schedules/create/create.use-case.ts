import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'

import { left, right, type Either, type ManagementScheduleShowResponse } from '@curupira/shared'

import { ScheduleRefusal } from '../_shared.schedule-refusal.ts'

import { NeighborhoodRefusal } from '#features/management/neighborhoods/_shared.neighborhood-refusal'
import { CollectionSchedule } from '#domain/collection-schedule/collection-schedule.entity'
import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import type { ManagementScheduleCreatePayload } from '#validators/management/schedules.validator'

type Payload = ManagementScheduleCreatePayload
type Response = Either<HTTPException, ManagementScheduleShowResponse>

/** Registers the slot: the neighborhood must exist, and the slot must be new. */
@inject()
export default class ManagementScheduleCreateUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (!(await this.neighborhoods.findById(payload.neighborhoodId)))
        return left(NeighborhoodRefusal.unknown('neighborhoodId', this.i18n))

      if (await this.schedules.existsSlot(payload))
        return left(ScheduleRefusal.http({ code: 'SCHEDULE_ALREADY_EXISTS' }, this.i18n))

      const schedule = CollectionSchedule.create({ id: randomUUID(), ...payload, now: new Date() })
      const saved = await this.schedules.save(schedule)
      if (saved.isLeft()) return left(ScheduleRefusal.http(saved.value, this.i18n))

      const detail = await this.schedules.detail(schedule.id)
      if (!detail) return left(ScheduleRefusal.notFound(this.i18n))

      return right(detail)
    } catch (error) {
      logger.error({ err: error }, '[management/schedules > create][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_SCHEDULE_CREATE_ERROR',
        ),
      )
    }
  }
}
