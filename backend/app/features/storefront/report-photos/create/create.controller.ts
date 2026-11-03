import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontReportPhotoCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { StorefrontReportPhotoCreateValidator } from '#validators/storefront/report-photos.validator'

@inject()
export default class StorefrontReportPhotoCreateController {
  static docs = defineDocs({
    summary: 'Open a report photo upload',
    description:
      'Opens the upload of one photo for a report and returns where to `PUT` it. **Does not receive bytes**: the photo goes straight to the bucket by a signed URL that expires in 15 minutes.\n\n' +
      'Only `image/jpeg`, `image/png` and `image/webp`, up to the configured ceiling, refused **before** any signature. Then call `POST /storefront/report-photos/:id/complete`. Public, throttled per IP.',
  })

  constructor(private readonly useCase: StorefrontReportPhotoCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(
      StorefrontReportPhotoCreateValidator,
    )
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
