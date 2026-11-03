import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementUserPaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementUserPaginateValidator } from '#validators/management/users.validator'

@inject()
export default class ManagementUserPaginateController {
  static docs = defineDocs({
    summary: 'List users',
    description:
      'Paginated listing. `?role` and `?status` are the two cuts of the screen, and `?search` filters by name and email.\n\n' +
      'The password does not come out here nor in any API response.\n\n' +
      '`?sort` accepts name, email, createdAt and `?direction` accepts asc or desc. Default: page 1, 20 per page, ordered by name ascending.',
  })

  constructor(private readonly useCase: ManagementUserPaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      ManagementUserPaginateValidator,
      {
        data: context.request.qs(),
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
