import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNoticePaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNoticePaginateValidator } from '#validators/management/notices.validator'

@inject()
export default class ManagementNoticePaginateController {
  static docs = defineDocs({
    summary: 'List notices',
    description:
      'Paginated listing. `?status` cuts by the derived status (SCHEDULED, ACTIVE, CLOSED) and `?search` filters by title.\n\n' +
      '`?sort` accepts title, startsAt, createdAt. Default: the most recent start first.',
  })

  constructor(private readonly useCase: ManagementNoticePaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(ManagementNoticePaginateValidator, {
      data: context.request.qs(),
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
