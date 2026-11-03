import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNeighborhoodUpdateUseCase from './update.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNeighborhoodUpdateValidator } from '#validators/management/neighborhoods.validator'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNeighborhoodUpdateController {
  static docs = defineDocs({
    summary: 'Update neighborhood',
    description:
      'Every field is optional: a missing field means "leave alone", not "erase". `null` on `latitude` and `longitude` erases the center (both together).',
    errors: { 409: 'NEIGHBORHOOD_ALREADY_EXISTS' },
  })

  constructor(private readonly useCase: ManagementNeighborhoodUpdateUseCase) {}

  async handle(context: HttpContext) {
    // Body and params validated separately and merged: the `:id` comes from the URL and
    // not from the payload, and a single schema would accept an `id` in the body able to
    // point at another row.
    const body = await context.request.validateUsing(
      ManagementNeighborhoodUpdateValidator,
    )
    const params = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute({ ...body, ...params })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
