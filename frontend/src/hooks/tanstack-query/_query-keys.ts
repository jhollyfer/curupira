import type { StorefrontSearch } from '#/lib/list-search'
import type {
  NoticesSearch,
  ReportsFilter,
  ReportsSearch,
  UsersSearch,
} from '#/lib/management-search'

/**
 * The cache keys, in one place, with one section per API module
 * (`queryKeys.<module>.<resource>`), like the backend's validators and routes.
 *
 * `list` is a table (classic pagination, filter in the URL) and `detail` is a
 * single record. Every resource starts with the `all` prefix, and invalidating
 * by it covers list and detail at once; the module's `all` covers the whole module.
 *
 * A module with no cached read (`authentication`, `storages`) has no section:
 * a key nobody reads or invalidates is just an extra name.
 *
 * The `management` section is the panel's (`/gestao`), one entry per screen.
 */
export const queryKeys = {
  account: {
    profile: {
      all: ['account', 'profile'] as const,
    },
  },

  management: {
    all: ['management'] as const,
    reports: {
      all: ['management', 'reports'] as const,
      list: (params: ReportsSearch) =>
        ['management', 'reports', 'list', params] as const,
      map: (filter: ReportsFilter) =>
        ['management', 'reports', 'map', filter] as const,
      stats: ['management', 'reports', 'stats'] as const,
      detail: (id: string) => ['management', 'reports', 'detail', id] as const,
    },
    notices: {
      all: ['management', 'notices'] as const,
      list: (params: NoticesSearch) =>
        ['management', 'notices', 'list', params] as const,
      detail: (id: string) => ['management', 'notices', 'detail', id] as const,
    },
    neighborhoods: {
      all: ['management', 'neighborhoods'] as const,
      list: (params: StorefrontSearch) =>
        ['management', 'neighborhoods', 'list', params] as const,
      options: ['management', 'neighborhoods', 'options'] as const,
      detail: (id: string) =>
        ['management', 'neighborhoods', 'detail', id] as const,
    },
    schedules: {
      all: ['management', 'schedules'] as const,
      byNeighborhood: (neighborhoodId: string | undefined) =>
        ['management', 'schedules', neighborhoodId ?? 'none'] as const,
    },
    users: {
      all: ['management', 'users'] as const,
      list: (params: UsersSearch) =>
        ['management', 'users', 'list', params] as const,
      detail: (id: string) => ['management', 'users', 'detail', id] as const,
    },
  },

  storefront: {
    all: ['storefront'] as const,
    neighborhoods: {
      all: ['storefront', 'neighborhoods'] as const,
    },
    schedules: {
      all: ['storefront', 'schedules'] as const,
      byNeighborhood: (neighborhoodId: string | undefined) =>
        ['storefront', 'schedules', neighborhoodId ?? 'all'] as const,
    },
    notices: {
      all: ['storefront', 'notices'] as const,
      list: (params: StorefrontSearch) =>
        ['storefront', 'notices', 'list', params] as const,
    },
    reports: {
      all: ['storefront', 'reports'] as const,
      map: ['storefront', 'reports', 'map'] as const,
      byProtocol: (protocol: string) =>
        ['storefront', 'reports', 'protocol', protocol] as const,
    },
  },
}

/**
 * What else changes when a resource changes, besides itself.
 *
 * In one place because the dependency belongs to the domain, not to the screen: a
 * schedule or a neighborhood edited in the panel changes what every resident reads,
 * and a report moved forward changes the public map and the tracking page.
 */
export const DEPENDENTS = {
  neighborhoods: [
    queryKeys.storefront.all,
    queryKeys.management.schedules.all,
    queryKeys.management.reports.all,
  ],
  schedules: [queryKeys.storefront.schedules.all],
  notices: [queryKeys.storefront.notices.all],
  reports: [queryKeys.storefront.reports.all],
} as const
