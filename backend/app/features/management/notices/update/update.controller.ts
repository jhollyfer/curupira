import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNoticeUpdateUseCase from './update.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNoticeUpdateValidator } from '#validators/management/notices.validator'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNoticeUpdateController {
  static docs = defineDocs({
    summary: 'Update notice',
    description:
      'Every field is optional: a missing field means "leave alone". `null` on `endsAt` removes the end date.',
  })

  constructor(private readonly useCase: ManagementNoticeUpdateUseCase) {}

  async handle(context: HttpContext) {
    // Body and params validated separately and merged: the `:id` comes from the URL and
    // not from the payload, and a single schema would accept an `id` in the body able to
    // point at another row.
    const body = await context.request.validateUsing(
      ManagementNoticeUpdateValidator,
    )
    const params = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute({ ...body, ...params })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
