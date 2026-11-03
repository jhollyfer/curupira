import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontSchedulePaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { StorefrontSchedulePaginateValidator } from '#validators/storefront/schedules.validator'

@inject()
export default class StorefrontSchedulePaginateController {
  static docs = defineDocs({
    summary: 'Collection schedule',
    description:
      'The whole week, with no page: every slot, in week order (Sunday first) and then by shift. `?neighborhoodId` cuts to one neighborhood. Public.',
  })

  constructor(private readonly useCase: StorefrontSchedulePaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StorefrontSchedulePaginateValidator,
      {
        data: context.request.qs(),
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
