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

import { NEIGHBORHOODS } from '#/data/neighborhoods'
import { exampleNotices } from '#/data/notices'
import { exampleMapReports, findReportByProtocol } from '#/data/reports'
import { schedulesOf } from '#/data/schedules'
import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { townNow } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

import { HTTPError, request } from '../http'
import { fromSource } from '../source'

/**
 * The public app, without a session. Each `queryFn` has two bodies behind
 * `fromSource` (see `source.ts`): the example data, and the real route with the
 * response schema from `@curupira/shared`. The routes below follow the shared module
 * names (`storefront/<resource>`); they are the assumption to confirm against the
 * backend's OpenAPI when `VITE_DATA_SOURCE=api` is first turned on.
 *
 * Neighborhoods and schedules change rarely and must work with no signal, so they
 * stay fresh for a long time here and the service worker keeps a copy
 * (`vite.config.ts`, `storefront` cache).
 */
const HOUR = 60 * 60 * 1000

export const storefrontNeighborhoodsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.neighborhoods.all,
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<StorefrontNeighborhoodShowResponse>>({
        mock: () => NEIGHBORHOODS,
        api: async () => {
          const page = await request(
            '/storefront/neighborhoods?perPage=100',
            paginatedResponse(StorefrontNeighborhoodShowResponse),
            { signal },
          )

          return page.data
        },
      }),
    staleTime: 6 * HOUR,
  })

export const storefrontSchedulesQueryOptions = (
  neighborhoodId: string | undefined,
) =>
  queryOptions({
    queryKey: queryKeys.storefront.schedules.byNeighborhood(neighborhoodId),
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<StorefrontScheduleShowResponse>>({
        mock: () => schedulesOf(neighborhoodId),
        api: () => {
          const query = new URLSearchParams()
          if (neighborhoodId) query.set('neighborhoodId', neighborhoodId)

          return request(
            `/storefront/schedules?${query.toString()}`,
            z.array(StorefrontScheduleShowResponse),
            { signal },
          )
        },
      }),
    staleTime: 6 * HOUR,
  })

export const storefrontNoticesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.notices.list({}),
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<StorefrontNoticeShowResponse>>({
        mock: () => exampleNotices(townNow()),
        api: async () => {
          const page = await request(
            '/storefront/notices?perPage=20',
            paginatedResponse(StorefrontNoticeShowResponse),
            { signal },
          )

          return page.data
        },
      }),
    staleTime: 10 * 60 * 1000,
  })

/** Pins of the public map. Never carries a protocol, a description or a contact. */
export const storefrontReportsMapQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.storefront.reports.map,
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<StorefrontReportMapResponse>>({
        mock: () => exampleMapReports(townNow()),
        api: () =>
          request('/storefront/reports/map', z.array(StorefrontReportMapResponse), {
            signal,
          }),
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
      fromSource<StorefrontReportShowByProtocolResponse>({
        mock: () => {
          const found = findReportByProtocol(normalized, townNow())
          if (found) return found

          throw new HTTPError({
            message: m.track_not_found_title(),
            status: 404,
            code: 'REPORT_NOT_FOUND',
          })
        },
        api: () =>
          request(
            `/storefront/reports/${encodeURIComponent(normalized)}`,
            StorefrontReportShowByProtocolResponse,
            { signal },
          ),
      }),
    staleTime: 60 * 1000,
    // A wrong code does not become right on the second try.
    retry: false,
  })
}
