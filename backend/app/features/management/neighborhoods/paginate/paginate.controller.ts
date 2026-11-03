import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNeighborhoodPaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNeighborhoodPaginateValidator } from '#validators/management/neighborhoods.validator'

@inject()
export default class ManagementNeighborhoodPaginateController {
  static docs = defineDocs({
    summary: 'List neighborhoods',
    description:
      'Paginated listing. `?search` filters by name.\n\n' +
      '`?sort` accepts name, createdAt and `?direction` accepts asc or desc. Default: page 1, 20 per page, ordered by name ascending.',
  })

  constructor(
    private readonly useCase: ManagementNeighborhoodPaginateUseCase,
  ) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      ManagementNeighborhoodPaginateValidator,
      {
        data: context.request.qs(),
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
