import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNeighborhoodCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementNeighborhoodCreateValidator } from '#validators/management/neighborhoods.validator'

@inject()
export default class ManagementNeighborhoodCreateController {
  static docs = defineDocs({
    summary: 'Create neighborhood',
    description:
      'Registers a neighborhood. The `slug` comes from the name.\n\n' +
      'The center (`latitude` and `longitude`) is optional, but both or none: it is what lets a report with no neighborhood picked be matched to the nearest one.',
    errors: { 409: 'NEIGHBORHOOD_ALREADY_EXISTS' },
  })

  constructor(private readonly useCase: ManagementNeighborhoodCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(ManagementNeighborhoodCreateValidator)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
