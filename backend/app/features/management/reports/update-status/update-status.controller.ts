import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportUpdateStatusUseCase from './update-status.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementReportUpdateStatusValidator } from '#validators/management/reports.validator'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementReportUpdateStatusController {
  static docs = defineDocs({
    summary: 'Move a report forward',
    description:
      'Advances the status (RECEIVED, IN_REVIEW, FORWARDED, RESOLVED) and writes a timeline event with the author and the optional `message`, which the resident reads on the protocol page.\n\n' +
      'The status only moves forward - to a later one, skipping steps if needed. Going back or repeating responds `422`.',
    errors: { 422: 'REPORT_STATUS_REGRESSION' },
  })

  constructor(private readonly useCase: ManagementReportUpdateStatusUseCase) {}

  async handle(context: HttpContext) {
    // Body and params validated separately and merged: the `:id` comes from the URL and
    // not from the payload, and a single schema would accept an `id` in the body able to
    // point at another row.
    const body = await context.request.validateUsing(
      ManagementReportUpdateStatusValidator,
    )
    const params = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute({
      ...body,
      ...params,
      actor: context.actor,
    })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
