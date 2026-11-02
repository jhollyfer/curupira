import {
  StorefrontNeighborhoodShowResponse,
  StorefrontNoticeShowResponse,
  StorefrontReportMapResponse,
  StorefrontReportShowByProtocolResponse,
  StorefrontScheduleShowResponse,
  normalizeProtocol,
  paginatedResponse,
  z,
} from '@curupira/shared'
import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '#/hooks/tanstack-query/_query-keys'

import { request } from '../http'

/**
 * The public app, without a session. Each `queryFn` calls the real route and parses the
 * body with the response schema from `@curupira/shared`. The routes below follow the shared
 * module names (`storefront/<resource>`) and the backend's OpenAPI.
 *
 * Neighborhoods and schedules change rarely and must work with no signal, so they
 * stay fresh for a long time here and the service worker keeps a copy
 * (`vite.config.ts`, `storefront` cache).
 */
const HOUR = 60 * 60 * 1000

export const storefrontNeighborhoodsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.neighborhoods.all,
    queryFn: async ({ signal }) => {
      const page = await request(
        '/storefront/neighborhoods?perPage=100',
        paginatedResponse(StorefrontNeighborhoodShowResponse),
        { signal },
      )

      return page.data
    },
    staleTime: 6 * HOUR,
  })

export const storefrontSchedulesQueryOptions = (
  neighborhoodId: string | undefined,
) =>
  queryOptions({
    queryKey: queryKeys.storefront.schedules.byNeighborhood(neighborhoodId),
    queryFn: async ({ signal }) => {
      // Paginated like every listing (`backend/openapi.json`); 100 is the cap and a
      // neighborhood has at most 84 collections (4 types x 7 days x 3 shifts). With
      // no neighborhood chosen the public calendar still shows the first 100.
      const query = new URLSearchParams({ perPage: '100' })
      if (neighborhoodId) query.set('neighborhoodId', neighborhoodId)

      const page = await request(
        `/storefront/schedules?${query.toString()}`,
        paginatedResponse(StorefrontScheduleShowResponse),
        { signal },
      )

      return page.data
    },
    staleTime: 6 * HOUR,
  })

export const storefrontNoticesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.notices.list({}),
    queryFn: async ({ signal }) => {
      const page = await request(
        '/storefront/notices?perPage=20',
        paginatedResponse(StorefrontNoticeShowResponse),
        { signal },
      )

      return page.data
    },
    staleTime: 10 * 60 * 1000,
  })

/** Pins of the public map. Never carries a protocol, a description or a contact. */
export const storefrontReportsMapQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.reports.map,
    queryFn: ({ signal }) =>
      request('/storefront/reports/map', z.array(StorefrontReportMapResponse), {
        signal,
      }),
    staleTime: 5 * 60 * 1000,
  })

/**
 * The status page by protocol. The protocol is normalized here (case, spaces and
 * look-alike letters) with the same function the backend validator applies, so what a
 * resident typed on a phone becomes the key of the cache and of the request.
 * An unknown code is a `404` in both bodies.
 */
export const storefrontReportByProtocolQueryOptions = (protocol: string) => {
  const normalized = normalizeProtocol(protocol)

  return queryOptions({
    queryKey: queryKeys.storefront.reports.byProtocol(normalized),
    queryFn: ({ signal }) =>
      request(
        `/storefront/reports/${encodeURIComponent(normalized)}`,
        StorefrontReportShowByProtocolResponse,
        { signal },
      ),
    staleTime: 60 * 1000,
    // A wrong code does not become right on the second try.
    retry: false,
  })
}
