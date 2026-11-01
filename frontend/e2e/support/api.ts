import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test'

import type { Credentials } from './credentials'

/**
 * The real API the specs talk to (`E2E_DATA_SOURCE=api`). The `Origin` is the frontend's:
 * the backend refuses a write whose origin is not `SITE_URL`, in development too.
 */
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3333'

export const SITE_ORIGIN = `http://localhost:${process.env.E2E_PORT ?? '3010'}`

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
