import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNoticeCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNoticeCreateValidator } from '#validators/management/notices.validator'

@inject()
export default class ManagementNoticeCreateController {
  static docs = defineDocs({
    summary: 'Create notice',
    description:
      'Publishes a notice on the home between `startsAt` and the optional `endsAt`. A start in the future schedules it.\n\n' +
      '`endsAt` must be after `startsAt`: otherwise `422`.',
  })

  constructor(private readonly useCase: ManagementNoticeCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      ManagementNoticeCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
