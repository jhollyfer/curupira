import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportMapUseCase from './map.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementReportMapValidator } from '#validators/management/reports.validator'

@inject()
export default class ManagementReportMapController {
  static docs = defineDocs({
    summary: 'Reports as map pins',
    description:
      'Every report matching the cuts (`?kind`, `?status`, `?neighborhoodId`, `?from`, `?to`), with no pagination: the map draws them all. Each item carries the coordinates and the protocol.',
  })

  constructor(private readonly useCase: ManagementReportMapUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(ManagementReportMapValidator, {
      data: context.request.qs(),
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
