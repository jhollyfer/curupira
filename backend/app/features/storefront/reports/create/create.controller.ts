import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontReportCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { StorefrontReportCreateValidator } from '#validators/storefront/reports.validator'

@inject()
export default class StorefrontReportCreateController {
  static docs = defineDocs({
    summary: 'File a report',
    description:
      'Files an environmental report. **Anonymous**: no session, and the report is anonymous unless `contact` is sent (the server derives that, the client does not declare it).\n\n' +
      'The response is only the `protocol` (`CUR-XXXX-XXXX`), the one key to follow the report on `GET /storefront/reports/:protocol`. The location comes from `latitude`/`longitude`; the neighborhood is matched to the nearest one with a center, when there is one.\n\n' +
      '`photoIds` are photos confirmed by `POST /storefront/report-photos/:id/complete`, from 1 to 3, each used by a single report. Public, throttled per IP.',
    errors: { 422: ['STORAGE_NOT_FOUND', 'REPORT_PHOTO_TAKEN'] },
  })

  constructor(private readonly useCase: StorefrontReportCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StorefrontReportCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
