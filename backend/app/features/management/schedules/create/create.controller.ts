import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementScheduleCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementScheduleCreateValidator } from '#validators/management/schedules.validator'

@inject()
export default class ManagementScheduleCreateController {
  static docs = defineDocs({
    summary: 'Create collection slot',
    description:
      'Registers that a waste type is collected in a neighborhood on a weekday and shift. The same neighborhood, type, weekday and shift cannot be registered twice: it responds `409`.\n\n' +
      'An unknown `neighborhoodId` responds `422` pointing at the field.',
    errors: { 409: 'SCHEDULE_ALREADY_EXISTS' },
  })

  constructor(private readonly useCase: ManagementScheduleCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      ManagementScheduleCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
