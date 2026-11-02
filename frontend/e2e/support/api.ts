import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test'

import type { Credentials } from './credentials'
import { apiUrl, baseUrl } from './env'

/**
 * The real API the specs talk to (`E2E_API_URL`). The `Origin` is the frontend's
 * (`E2E_BASE_URL`): the backend refuses a write whose origin is not in `CORS_ORIGINS`, in
 * development too.
 */
export const API_URL = apiUrl()

export const SITE_ORIGIN = new URL(baseUrl()).origin

/**
 * An API client with its own cookie jar. Signing in here (and not through the screen)
 * keeps the suite under the sign-in limiter: five attempts per minute per IP, then ten
 * minutes blocked.
 */
export async function apiClient(
  playwright: PlaywrightWorkerArgs['playwright'],
  credentials?: Credentials,
): Promise<APIRequestContext> {
  const client = await playwright.request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Origin: SITE_ORIGIN },
  })

  if (credentials) {
    const response = await client.post('/authentication/sign-in', {
      data: credentials,
    })
    if (!response.ok()) {
      throw new Error(
        `sign-in of ${credentials.email} answered ${response.status()}`,
      )
    }
  }

  return client
}
