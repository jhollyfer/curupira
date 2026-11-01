import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementScheduleUpdateUseCase from './update.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementScheduleUpdateValidator } from '#validators/management/schedules.validator'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementScheduleUpdateController {
  static docs = defineDocs({
    summary: 'Update collection slot',
    description:
      'Every field is optional: a missing field means "leave alone", not "erase". `null` on `note` erases it. Moving a slot onto one that already exists responds `409`.',
    errors: { 409: 'SCHEDULE_ALREADY_EXISTS' },
  })

  constructor(private readonly useCase: ManagementScheduleUpdateUseCase) {}

  async handle(context: HttpContext) {
    // Body and params validated separately and merged: the `:id` comes from the URL and
    // not from the payload, and a single schema would accept an `id` in the body able to
    // point at another row.
    const body = await context.request.validateUsing(ManagementScheduleUpdateValidator)
    const params = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute({ ...body, ...params })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
