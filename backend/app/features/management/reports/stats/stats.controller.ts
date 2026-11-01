import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportStatsUseCase from './stats.use-case.ts'

import { defineDocs } from '#core/openapi/types'

@inject()
export default class ManagementReportStatsController {
  static docs = defineDocs({
    summary: 'Dashboard numbers',
    description:
      'Totals by kind and by status (every key present, even at zero) and the reports created per day over the last 30 days (every day present). Days follow the city time zone (America/Manaus).',
  })

  constructor(private readonly useCase: ManagementReportStatsUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
