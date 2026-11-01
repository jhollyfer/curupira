import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementSchedulePaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementSchedulePaginateValidator } from '#validators/management/schedules.validator'

@inject()
export default class ManagementSchedulePaginateController {
  static docs = defineDocs({
    summary: 'List collection slots',
    description:
      'Paginated listing, by neighborhood name. `?neighborhoodId` cuts to one neighborhood. Default: page 1, 20 per page.',
  })

  constructor(private readonly useCase: ManagementSchedulePaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(ManagementSchedulePaginateValidator, {
      data: context.request.qs(),
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
