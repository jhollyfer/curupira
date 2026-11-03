import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontReportShowByProtocolUseCase from './show-by-protocol.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { StorefrontReportShowByProtocolValidator } from '#validators/storefront/reports.validator'

@inject()
export default class StorefrontReportShowByProtocolController {
  static docs = defineDocs({
    summary: 'Follow a report by protocol',
    description:
      'The status page of a report, with no session: protocol, type, status, creation date and the timeline (status, the answer text and the instant of each step).\n\n' +
      '**Never** the contact, the description, the photos, the coordinates or who answered. The protocol is normalized (case, spaces, hyphens, look-alike letters). An unknown or malformed protocol responds the same `404`. Public, throttled per IP.',
    errors: { 404: 'REPORT_NOT_FOUND' },
  })

  constructor(
    private readonly useCase: StorefrontReportShowByProtocolUseCase,
  ) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StorefrontReportShowByProtocolValidator,
      {
        data: context.params,
      },
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
