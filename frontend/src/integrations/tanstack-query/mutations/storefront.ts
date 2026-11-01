import {
  StorefrontReportCreateResponse,
  StorefrontReportPhotoCreateResponse,
  StorefrontReportPhotoCreateValidator,
} from '@curupira/shared'
import type { StorefrontReportCreatePayload } from '@curupira/shared'
import { useMutation } from '@tanstack/react-query'

import { randomProtocol, saveSubmittedReport } from '#/data/reports'
import type { MutationProps } from '#/hooks/tanstack-query/_mutation-props'
import type { ReportDraft } from '#/lib/report-queue'
import { m } from '#/paraglide/messages'

import { HTTPError, request } from '../http'
import { fromSource } from '../source'

/**
 * Sends the photos, then the report. The browser PUTs each photo straight to the
 * storage with the presigned URL the API gave (`storefront/report-photos`): the bytes
 * never pass through the API. `photoIds` is what the report references.
 */
async function putPhoto(uploadUrl: string, photo: Blob): Promise<void> {
  let response: Response

  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': photo.type },
      body: photo,
    })
  } catch {
    throw new HTTPError({
      message: m.common_error_network(),
      status: 0,
      code: 'NETWORK_ERROR',
    })
  }

  if (!response.ok) {
    throw new HTTPError({
      message: m.report_error_upload(),
      status: 502,
      code: 'UPLOAD_FAILED',
    })
  }
}

async function sendToApi(
  draft: ReportDraft,
): Promise<StorefrontReportCreateResponse> {
  const photoIds: Array<string> = []

  for (const photo of draft.photos) {
    const metadata = StorefrontReportPhotoCreateValidator.safeParse({
      mimetype: photo.type,
      size: photo.size,
    })

    if (!metadata.success) {
      throw new HTTPError({
        message: m.report_error_photo_type(),
        status: 422,
        code: 'VALIDATION_ERROR',
      })
    }

    const slot = await request(
      '/storefront/report-photos',
      StorefrontReportPhotoCreateResponse,
      { method: 'POST', body: JSON.stringify(metadata.data) },
    )

    await putPhoto(slot.uploadUrl, photo)
    photoIds.push(slot.id)
  }

  const payload: StorefrontReportCreatePayload = {
    kind: draft.kind,
    latitude: draft.latitude,
    longitude: draft.longitude,
    description: draft.description,
    contact: draft.contact,
    photoIds,
  }

  return await request('/storefront/reports', StorefrontReportCreateResponse, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Time the example body takes, so the sending state is visible while developing. */
const MOCK_LATENCY = 700

async function sendToMock(
  draft: ReportDraft,
): Promise<StorefrontReportCreateResponse> {
  // The example body must fail like the network does, or the offline path (the
  // queue) could never be exercised without the backend.
  if (!navigator.onLine) {
    throw new HTTPError({
      message: m.common_error_network(),
      status: 0,
      code: 'NETWORK_ERROR',
    })
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY))

  const protocol = randomProtocol()
  saveSubmittedReport(protocol, draft.kind, new Date().toISOString())

  return { protocol }
}

/**
 * The one function that leaves the device with a report: used by the form and by
 * the offline queue's flush, so a queued report goes exactly the way a live one does.
 */
export function sendReport(
  draft: ReportDraft,
): Promise<StorefrontReportCreateResponse> {
  return fromSource({
    mock: () => sendToMock(draft),
    api: () => sendToApi(draft),
  })
}

export function useStorefrontReportCreateMutation(
  options?: MutationProps<StorefrontReportCreateResponse, ReportDraft>,
) {
  return useMutation<StorefrontReportCreateResponse, HTTPError, ReportDraft>({
    ...options,
    mutationFn: sendReport,
  })
}
