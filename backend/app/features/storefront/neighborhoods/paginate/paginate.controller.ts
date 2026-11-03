import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontNeighborhoodPaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'

@inject()
export default class StorefrontNeighborhoodPaginateController {
  static docs = defineDocs({
    summary: 'List neighborhoods',
    description:
      'Every neighborhood, by name, in the pagination envelope but on a single page: the resident picks theirs from a short list. Public.',
  })

  constructor(
    private readonly useCase: StorefrontNeighborhoodPaginateUseCase,
  ) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
