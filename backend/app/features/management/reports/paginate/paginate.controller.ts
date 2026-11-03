import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportPaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementReportPaginateValidator } from '#validators/management/reports.validator'

@inject()
export default class ManagementReportPaginateController {
  static docs = defineDocs({
    summary: 'List reports',
    description:
      'Paginated listing for the panel, with the neighborhood name. Cuts: `?kind`, `?status`, `?neighborhoodId`, `?from`/`?to` (ISO 8601 instants) and `?search` (protocol or description).\n\n' +
      '`?sort` accepts createdAt, status, kind. Default: the most recent first.\n\n' +
      'The contact and the description are only in the detail (`GET /management/reports/:id`).',
  })

  constructor(private readonly useCase: ManagementReportPaginateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      ManagementReportPaginateValidator,
      {
        data: context.request.qs(),
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
