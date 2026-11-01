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
import type { Paginated } from '@curupira/shared'
import { queryOptions } from '@tanstack/react-query'

import {
  allNeighborhoods,
  findNeighborhood,
  listNeighborhoods,
} from '#/data/management/neighborhoods'
import { findNotice, listNotices } from '#/data/management/notices'
import {
  findReport,
  listReports,
  mapReports,
  reportStats,
} from '#/data/management/reports'
import { listSchedules } from '#/data/management/schedules'
import { findUser, listUsers } from '#/data/management/users'
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
import { fromSource } from '../source'

/**
 * The panel's reads (`/management/*`, behind the session). Same shape as the public
 * ones: each `queryFn` writes the example body and the real route behind `fromSource`,
 * and the screens only see the options. The `api` bodies follow `backend/openapi.json`:
 * the query parameters of each listing are the ones its validator in `shared/` accepts.
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
      fromSource<Paginated<ManagementReportListItemResponse>>({
        mock: () =>
          listReports({
            page: search.page,
            perPage: search.perPage,
            search: search.search,
            sort: orderOf(search.sort),
            direction: search.direction,
            ...reportQuery(reportsFilterOf(search)),
          }),
        api: () =>
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
      }),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

type ReportSort = 'createdAt' | 'status' | 'kind'

const REPORT_SORTS: Record<string, ReportSort | undefined> = {
  createdAt: 'createdAt',
  status: 'status',
  kind: 'kind',
}

function orderOf(sort: string | undefined): ReportSort | undefined {
  return REPORT_SORTS[String(sort)]
}

/** The pins: the same filter as the table, so the two always show the same cut. */
export const managementReportsMapQueryOptions = (filter: ReportsFilter) =>
  queryOptions({
    queryKey: queryKeys.management.reports.map(filter),
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<ManagementReportListItemResponse>>({
        mock: () => mapReports(reportQuery(filter)),
        api: () =>
          request(
            '/management/reports/map'.concat(queryString(reportQuery(filter))),
            z.array(ManagementReportListItemResponse),
            { signal },
          ),
      }),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

export const managementReportStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.management.reports.stats,
    queryFn: ({ signal }) =>
      fromSource<ManagementReportStatsResponse>({
        mock: reportStats,
        api: () =>
          request('/management/reports/stats', ManagementReportStatsResponse, {
            signal,
          }),
      }),
    staleTime: STALE,
  })

export const managementReportQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.reports.detail(id),
    queryFn: ({ signal }) =>
      fromSource<ManagementReportShowResponse>({
        mock: () => findReport(id),
        api: () =>
          request(
            `/management/reports/${encodeURIComponent(id)}`,
            ManagementReportShowResponse,
            { signal },
          ),
      }),
    staleTime: STALE,
    retry: false,
  })

export const managementNoticesQueryOptions = (search: NoticesSearch) =>
  queryOptions({
    queryKey: queryKeys.management.notices.list(search),
    queryFn: ({ signal }) =>
      fromSource<Paginated<ManagementNoticeShowResponse>>({
        mock: () =>
          listNotices({
            page: search.page,
            perPage: search.perPage,
            search: search.search,
            status: search.status,
            direction: search.direction,
            sort: noticeOrderOf(search.sort),
          }),
        api: () =>
          request(
            '/management/notices'.concat(queryString(search)),
            paginatedResponse(ManagementNoticeShowResponse),
            { signal },
          ),
      }),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

type NoticeSort = 'title' | 'startsAt' | 'createdAt'

const NOTICE_SORTS: Record<string, NoticeSort | undefined> = {
  title: 'title',
  startsAt: 'startsAt',
  createdAt: 'createdAt',
}

function noticeOrderOf(sort: string | undefined): NoticeSort | undefined {
  return NOTICE_SORTS[String(sort)]
}

export const managementNoticeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.notices.detail(id),
    queryFn: ({ signal }) =>
      fromSource<ManagementNoticeShowResponse>({
        mock: () => findNotice(id),
        api: () =>
          request(
            `/management/notices/${encodeURIComponent(id)}`,
            ManagementNoticeShowResponse,
            { signal },
          ),
      }),
    staleTime: STALE,
    retry: false,
  })

export const managementNeighborhoodsQueryOptions = (search: StorefrontSearch) =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.list(search),
    queryFn: ({ signal }) =>
      fromSource<Paginated<ManagementNeighborhoodShowResponse>>({
        mock: () =>
          listNeighborhoods({
            page: search.page,
            perPage: search.perPage,
            search: search.search,
            direction: search.direction,
            sort: neighborhoodOrderOf(search.sort),
          }),
        api: () =>
          request(
            '/management/neighborhoods'.concat(queryString(search)),
            paginatedResponse(ManagementNeighborhoodShowResponse),
            { signal },
          ),
      }),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

function neighborhoodOrderOf(
  sort: string | undefined,
): 'name' | 'createdAt' | undefined {
  if (sort === 'name' || sort === 'createdAt') return sort

  return undefined
}

/** Every neighborhood, for the selects and filters: a list of options, not a table. */
export const managementNeighborhoodOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.options,
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<ManagementNeighborhoodShowResponse>>({
        mock: allNeighborhoods,
        api: async () => {
          const page = await request(
            '/management/neighborhoods?perPage=100&sort=name&direction=asc',
            paginatedResponse(ManagementNeighborhoodShowResponse),
            { signal },
          )

          return page.data
        },
      }),
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
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<NeighborhoodChoice>>({
        mock: () => allNeighborhoods().map(({ id, name }) => ({ id, name })),
        api: async () => {
          const page = await request(
            '/storefront/neighborhoods?perPage=100',
            paginatedResponse(StorefrontNeighborhoodShowResponse),
            { signal },
          )

          return page.data.map(({ id, name }) => ({ id, name }))
        },
      }),
    staleTime: 5 * 60 * 1000,
  })

export const managementNeighborhoodQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.neighborhoods.detail(id),
    queryFn: ({ signal }) =>
      fromSource<ManagementNeighborhoodShowResponse>({
        mock: () => findNeighborhood(id),
        api: () =>
          request(
            `/management/neighborhoods/${encodeURIComponent(id)}`,
            ManagementNeighborhoodShowResponse,
            { signal },
          ),
      }),
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
    queryFn: ({ signal }) =>
      fromSource<ReadonlyArray<ManagementScheduleShowResponse>>({
        mock: () => listSchedules({ neighborhoodId, perPage: 100 }).data,
        api: async () => {
          const page = await request(
            '/management/schedules'.concat(
              queryString({ neighborhoodId, perPage: 100 }),
            ),
            paginatedResponse(ManagementScheduleShowResponse),
            { signal },
          )

          return page.data
        },
      }),
    enabled: Boolean(neighborhoodId),
    staleTime: STALE,
  })

export const managementUsersQueryOptions = (search: UsersSearch) =>
  queryOptions({
    queryKey: queryKeys.management.users.list(search),
    queryFn: ({ signal }) =>
      fromSource<Paginated<ManagementUserShowResponse>>({
        mock: () =>
          listUsers({
            page: search.page,
            perPage: search.perPage,
            search: search.search,
            role: search.role,
            status: search.status,
            direction: search.direction,
            sort: userOrderOf(search.sort),
          }),
        api: () =>
          request(
            '/management/users'.concat(queryString(search)),
            paginatedResponse(ManagementUserShowResponse),
            { signal },
          ),
      }),
    staleTime: STALE,
    placeholderData: (previous) => previous,
  })

function userOrderOf(
  sort: string | undefined,
): 'name' | 'email' | 'createdAt' | undefined {
  if (sort === 'name' || sort === 'email' || sort === 'createdAt') return sort

  return undefined
}

export const managementUserQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.management.users.detail(id),
    queryFn: ({ signal }) =>
      fromSource<ManagementUserShowResponse>({
        mock: () => findUser(id),
        api: () =>
          request(
            `/management/users/${encodeURIComponent(id)}`,
            ManagementUserShowResponse,
            { signal },
          ),
      }),
    staleTime: STALE,
    retry: false,
  })
