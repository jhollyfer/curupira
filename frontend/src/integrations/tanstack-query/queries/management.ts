import {
  ManagementNeighborhoodShowResponse,
  ManagementNoticeShowResponse,
  ManagementReportListItemResponse,
  ManagementReportShowResponse,
  ManagementReportStatsResponse,
  ManagementScheduleShowResponse,
  ManagementUserShowResponse,
  StorefrontNeighborhoodShowResponse,
  paginatedResponse,
  z,
} from '@curupira/shared'
import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { queryString } from '#/lib/list-search'
import type { StorefrontSearch } from '#/lib/list-search'
import { reportPeriod, reportsFilterOf } from '#/lib/management-search'
import type {
  NoticesSearch,
  ReportsFilter,
  ReportsSearch,
  UsersSearch,
} from '#/lib/management-search'

import { request } from '../http'

/**
 * The panel's reads (`/management/*`, behind the session). Same shape as the public
 * ones: each `queryFn` calls the real route and the screens only see the options. The
 * routes follow `backend/openapi.json`: the query parameters of each listing are the ones
 * its validator in `shared/` accepts.
 *
 * Staleness is short on purpose: several people work the same queue, and the cost of
 * showing a report as "Recebida" after a colleague already moved it is a wasted click
 * that ends in a 422. Mutations invalidate on top of that.
 */
const STALE = 30 * 1000

/** What the API takes for the period: instants, not the URL's plain days. */
function reportQuery(filter: ReportsFilter) {
  const { from: _from, to: _to, ...rest } = filter

  return { ...rest, ...reportPeriod(filter) }
}

export const managementReportsQueryOptions = (search: ReportsSearch) =>
  queryOptions({
    queryKey: queryKeys.management.reports.list(search),
    queryFn: ({ signal }) =>
      request(
        '/management/reports'.concat(
          queryString({
            page: search.page,
            perPage: search.perPage,
            search: search.search,
            sort: search.sort,
            direction: search.direction,
            ...reportQuery(reportsFilterOf(search)),
          }),
        ),
        paginatedResponse(ManagementReportListItemResponse),
        { signal },
      ),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

/** The pins: the same filter as the table, so the two always show the same cut. */
export const managementReportsMapQueryOptions = (filter: ReportsFilter) =>
  queryOptions({
    queryKey: queryKeys.management.reports.map(filter),
    queryFn: ({ signal }) =>
      request(
        '/management/reports/map'.concat(queryString(reportQuery(filter))),
        z.array(ManagementReportListItemResponse),
        { signal },
      ),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

export const managementReportStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.management.reports.stats,
    queryFn: ({ signal }) =>
      request('/management/reports/stats', ManagementReportStatsResponse, {
        signal,
      }),
    staleTime: STALE,
  })

export const managementReportQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.reports.detail(id),
    queryFn: ({ signal }) =>
      request(
        `/management/reports/${encodeURIComponent(id)}`,
        ManagementReportShowResponse,
        { signal },
      ),
    staleTime: STALE,
    retry: false,
  })

export const managementNoticesQueryOptions = (search: NoticesSearch) =>
  queryOptions({
    queryKey: queryKeys.management.notices.list(search),
    queryFn: ({ signal }) =>
      request(
        '/management/notices'.concat(queryString(search)),
        paginatedResponse(ManagementNoticeShowResponse),
        { signal },
      ),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

export const managementNoticeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.notices.detail(id),
    queryFn: ({ signal }) =>
      request(
        `/management/notices/${encodeURIComponent(id)}`,
        ManagementNoticeShowResponse,
        { signal },
      ),
    staleTime: STALE,
    retry: false,
  })

export const managementNeighborhoodsQueryOptions = (search: StorefrontSearch) =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.list(search),
    queryFn: ({ signal }) =>
      request(
        '/management/neighborhoods'.concat(queryString(search)),
        paginatedResponse(ManagementNeighborhoodShowResponse),
        { signal },
      ),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

/** Every neighborhood, for the selects and filters: a list of options, not a table. */
export const managementNeighborhoodOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.options,
    queryFn: async ({ signal }) => {
      const page = await request(
        '/management/neighborhoods?perPage=100&sort=name&direction=asc',
        paginatedResponse(ManagementNeighborhoodShowResponse),
        { signal },
      )

      return page.data
    },
    staleTime: 5 * 60 * 1000,
  })

/** What a neighborhood select needs, and nothing the administrator-only record carries. */
export type NeighborhoodChoice = Readonly<{ id: string; name: string }>

/**
 * The neighborhoods for the report filter, readable by BOTH roles.
 *
 * `/management/neighborhoods` is administrator-only, and the report screen is the
 * operator's desk too: reading the options from there answered 403 and the whole
 * screen fell into the 500 page. The public list is the same data (id and name) and
 * needs no role, so the api body reads it. The administrator-only options below stay
 * for the schedule grid, which only the administrator can open.
 */
export const managementNeighborhoodChoicesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.choices,
    queryFn: async ({ signal }) => {
      const page = await request(
        '/storefront/neighborhoods?perPage=100',
        paginatedResponse(StorefrontNeighborhoodShowResponse),
        { signal },
      )

      return page.data.map(({ id, name }) => ({ id, name }))
    },
    staleTime: 5 * 60 * 1000,
  })

export const managementNeighborhoodQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.detail(id),
    queryFn: ({ signal }) =>
      request(
        `/management/neighborhoods/${encodeURIComponent(id)}`,
        ManagementNeighborhoodShowResponse,
        { signal },
      ),
    staleTime: STALE,
    retry: false,
  })

/**
 * Every collection of one neighborhood. One neighborhood has at most 4 types x 7 days x
 * 3 shifts = 84 entries, under the 100 cap, so the grid reads a single page and never
 * has to explain pagination.
 */
export const managementSchedulesQueryOptions = (
  neighborhoodId: string | undefined,
) =>
  queryOptions({
    queryKey: queryKeys.management.schedules.byNeighborhood(neighborhoodId),
    queryFn: async ({ signal }) => {
      const page = await request(
        '/management/schedules'.concat(
          queryString({ neighborhoodId, perPage: 100 }),
        ),
        paginatedResponse(ManagementScheduleShowResponse),
        { signal },
      )

      return page.data
    },
    enabled: Boolean(neighborhoodId),
    staleTime: STALE,
  })

export const managementUsersQueryOptions = (search: UsersSearch) =>
  queryOptions({
    queryKey: queryKeys.management.users.list(search),
    queryFn: ({ signal }) =>
      request(
        '/management/users'.concat(queryString(search)),
        paginatedResponse(ManagementUserShowResponse),
        { signal },
      ),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

export const managementUserQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.users.detail(id),
    queryFn: ({ signal }) =>
      request(
        `/management/users/${encodeURIComponent(id)}`,
        ManagementUserShowResponse,
        { signal },
      ),
    staleTime: STALE,
    retry: false,
  })
