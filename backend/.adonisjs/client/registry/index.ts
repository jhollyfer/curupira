/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'health-check': {
    methods: ["GET","HEAD"],
    pattern: '/health-check',
    tokens: [[0,"health-check"]],
    types: placeholder as Registry['health-check']['types'],
  },
  'documentation.openapi': {
    methods: ["GET","HEAD"],
    pattern: '/openapi.json',
    tokens: [[0,"openapi.json"]],
    types: placeholder as Registry['documentation.openapi']['types'],
  },
  'documentation.reference': {
    methods: ["GET","HEAD"],
    pattern: '/documentation',
    tokens: [[0,"documentation"]],
    types: placeholder as Registry['documentation.reference']['types'],
  },
  'storefront.neighborhoods': {
    methods: ["GET","HEAD"],
    pattern: '/storefront/neighborhoods',
    tokens: [[0,"storefront"],[0,"neighborhoods"]],
    types: placeholder as Registry['storefront.neighborhoods']['types'],
  },
  'storefront.schedules': {
    methods: ["GET","HEAD"],
    pattern: '/storefront/schedules',
    tokens: [[0,"storefront"],[0,"schedules"]],
    types: placeholder as Registry['storefront.schedules']['types'],
  },
  'storefront.notices': {
    methods: ["GET","HEAD"],
    pattern: '/storefront/notices',
    tokens: [[0,"storefront"],[0,"notices"]],
    types: placeholder as Registry['storefront.notices']['types'],
  },
  'storefront.reportPhotos.create': {
    methods: ["POST"],
    pattern: '/storefront/report-photos',
    tokens: [[0,"storefront"],[0,"report-photos"]],
    types: placeholder as Registry['storefront.reportPhotos.create']['types'],
  },
  'storefront.reportPhotos.complete': {
    methods: ["POST"],
    pattern: '/storefront/report-photos/:id/complete',
    tokens: [[0,"storefront"],[0,"report-photos"],[1,"id"],[0,"complete"]],
    types: placeholder as Registry['storefront.reportPhotos.complete']['types'],
  },
  'storefront.reports.create': {
    methods: ["POST"],
    pattern: '/storefront/reports',
    tokens: [[0,"storefront"],[0,"reports"]],
    types: placeholder as Registry['storefront.reports.create']['types'],
  },
  'storefront.reports.map': {
    methods: ["GET","HEAD"],
    pattern: '/storefront/reports/map',
    tokens: [[0,"storefront"],[0,"reports"],[0,"map"]],
    types: placeholder as Registry['storefront.reports.map']['types'],
  },
  'storefront.reports.showByProtocol': {
    methods: ["GET","HEAD"],
    pattern: '/storefront/reports/:protocol',
    tokens: [[0,"storefront"],[0,"reports"],[1,"protocol"]],
    types: placeholder as Registry['storefront.reports.showByProtocol']['types'],
  },
  'authentication.sign_in': {
    methods: ["POST"],
    pattern: '/authentication/sign-in',
    tokens: [[0,"authentication"],[0,"sign-in"]],
    types: placeholder as Registry['authentication.sign_in']['types'],
  },
  'authentication.sign_out': {
    methods: ["POST"],
    pattern: '/authentication/sign-out',
    tokens: [[0,"authentication"],[0,"sign-out"]],
    types: placeholder as Registry['authentication.sign_out']['types'],
  },
  'authentication.refresh': {
    methods: ["POST"],
    pattern: '/authentication/refresh',
    tokens: [[0,"authentication"],[0,"refresh"]],
    types: placeholder as Registry['authentication.refresh']['types'],
  },
  'profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/account',
    tokens: [[0,"account"]],
    types: placeholder as Registry['profile.show']['types'],
  },
  'profile.update': {
    methods: ["PUT"],
    pattern: '/account',
    tokens: [[0,"account"]],
    types: placeholder as Registry['profile.update']['types'],
  },
  'storages.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/storages',
    tokens: [[0,"storages"]],
    types: placeholder as Registry['storages.paginate']['types'],
  },
  'storages.create': {
    methods: ["POST"],
    pattern: '/storages',
    tokens: [[0,"storages"]],
    types: placeholder as Registry['storages.create']['types'],
  },
  'storages.complete': {
    methods: ["POST"],
    pattern: '/storages/:id/complete',
    tokens: [[0,"storages"],[1,"id"],[0,"complete"]],
    types: placeholder as Registry['storages.complete']['types'],
  },
  'storages.parts': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id/parts',
    tokens: [[0,"storages"],[1,"id"],[0,"parts"]],
    types: placeholder as Registry['storages.parts']['types'],
  },
  'storages.show': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id',
    tokens: [[0,"storages"],[1,"id"]],
    types: placeholder as Registry['storages.show']['types'],
  },
  'storages.delete': {
    methods: ["DELETE"],
    pattern: '/storages/:id',
    tokens: [[0,"storages"],[1,"id"]],
    types: placeholder as Registry['storages.delete']['types'],
  },
  'storages.download': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id/download',
    tokens: [[0,"storages"],[1,"id"],[0,"download"]],
    types: placeholder as Registry['storages.download']['types'],
  },
  'management.reports.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/management/reports',
    tokens: [[0,"management"],[0,"reports"]],
    types: placeholder as Registry['management.reports.paginate']['types'],
  },
  'management.reports.map': {
    methods: ["GET","HEAD"],
    pattern: '/management/reports/map',
    tokens: [[0,"management"],[0,"reports"],[0,"map"]],
    types: placeholder as Registry['management.reports.map']['types'],
  },
  'management.reports.stats': {
    methods: ["GET","HEAD"],
    pattern: '/management/reports/stats',
    tokens: [[0,"management"],[0,"reports"],[0,"stats"]],
    types: placeholder as Registry['management.reports.stats']['types'],
  },
  'management.reports.show': {
    methods: ["GET","HEAD"],
    pattern: '/management/reports/:id',
    tokens: [[0,"management"],[0,"reports"],[1,"id"]],
    types: placeholder as Registry['management.reports.show']['types'],
  },
  'management.reports.updateStatus': {
    methods: ["PATCH"],
    pattern: '/management/reports/:id/status',
    tokens: [[0,"management"],[0,"reports"],[1,"id"],[0,"status"]],
    types: placeholder as Registry['management.reports.updateStatus']['types'],
  },
  'management.reports.delete': {
    methods: ["DELETE"],
    pattern: '/management/reports/:id',
    tokens: [[0,"management"],[0,"reports"],[1,"id"]],
    types: placeholder as Registry['management.reports.delete']['types'],
  },
  'management.notices.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/management/notices',
    tokens: [[0,"management"],[0,"notices"]],
    types: placeholder as Registry['management.notices.paginate']['types'],
  },
  'management.notices.create': {
    methods: ["POST"],
    pattern: '/management/notices',
    tokens: [[0,"management"],[0,"notices"]],
    types: placeholder as Registry['management.notices.create']['types'],
  },
  'management.notices.show': {
    methods: ["GET","HEAD"],
    pattern: '/management/notices/:id',
    tokens: [[0,"management"],[0,"notices"],[1,"id"]],
    types: placeholder as Registry['management.notices.show']['types'],
  },
  'management.notices.update': {
    methods: ["PUT"],
    pattern: '/management/notices/:id',
    tokens: [[0,"management"],[0,"notices"],[1,"id"]],
    types: placeholder as Registry['management.notices.update']['types'],
  },
  'management.notices.close': {
    methods: ["PATCH"],
    pattern: '/management/notices/:id/close',
    tokens: [[0,"management"],[0,"notices"],[1,"id"],[0,"close"]],
    types: placeholder as Registry['management.notices.close']['types'],
  },
  'management.notices.delete': {
    methods: ["DELETE"],
    pattern: '/management/notices/:id',
    tokens: [[0,"management"],[0,"notices"],[1,"id"]],
    types: placeholder as Registry['management.notices.delete']['types'],
  },
  'management.schedules.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/management/schedules',
    tokens: [[0,"management"],[0,"schedules"]],
    types: placeholder as Registry['management.schedules.paginate']['types'],
  },
  'management.schedules.create': {
    methods: ["POST"],
    pattern: '/management/schedules',
    tokens: [[0,"management"],[0,"schedules"]],
    types: placeholder as Registry['management.schedules.create']['types'],
  },
  'management.schedules.show': {
    methods: ["GET","HEAD"],
    pattern: '/management/schedules/:id',
    tokens: [[0,"management"],[0,"schedules"],[1,"id"]],
    types: placeholder as Registry['management.schedules.show']['types'],
  },
  'management.schedules.update': {
    methods: ["PUT"],
    pattern: '/management/schedules/:id',
    tokens: [[0,"management"],[0,"schedules"],[1,"id"]],
    types: placeholder as Registry['management.schedules.update']['types'],
  },
  'management.schedules.delete': {
    methods: ["DELETE"],
    pattern: '/management/schedules/:id',
    tokens: [[0,"management"],[0,"schedules"],[1,"id"]],
    types: placeholder as Registry['management.schedules.delete']['types'],
  },
  'management.neighborhoods.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/management/neighborhoods',
    tokens: [[0,"management"],[0,"neighborhoods"]],
    types: placeholder as Registry['management.neighborhoods.paginate']['types'],
  },
  'management.neighborhoods.create': {
    methods: ["POST"],
    pattern: '/management/neighborhoods',
    tokens: [[0,"management"],[0,"neighborhoods"]],
    types: placeholder as Registry['management.neighborhoods.create']['types'],
  },
  'management.neighborhoods.show': {
    methods: ["GET","HEAD"],
    pattern: '/management/neighborhoods/:id',
    tokens: [[0,"management"],[0,"neighborhoods"],[1,"id"]],
    types: placeholder as Registry['management.neighborhoods.show']['types'],
  },
  'management.neighborhoods.update': {
    methods: ["PUT"],
    pattern: '/management/neighborhoods/:id',
    tokens: [[0,"management"],[0,"neighborhoods"],[1,"id"]],
    types: placeholder as Registry['management.neighborhoods.update']['types'],
  },
  'management.neighborhoods.delete': {
    methods: ["DELETE"],
    pattern: '/management/neighborhoods/:id',
    tokens: [[0,"management"],[0,"neighborhoods"],[1,"id"]],
    types: placeholder as Registry['management.neighborhoods.delete']['types'],
  },
  'management.users.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/management/users',
    tokens: [[0,"management"],[0,"users"]],
    types: placeholder as Registry['management.users.paginate']['types'],
  },
  'management.users.create': {
    methods: ["POST"],
    pattern: '/management/users',
    tokens: [[0,"management"],[0,"users"]],
    types: placeholder as Registry['management.users.create']['types'],
  },
  'management.users.show': {
    methods: ["GET","HEAD"],
    pattern: '/management/users/:id',
    tokens: [[0,"management"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['management.users.show']['types'],
  },
  'management.users.update': {
    methods: ["PUT"],
    pattern: '/management/users/:id',
    tokens: [[0,"management"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['management.users.update']['types'],
  },
  'management.users.delete': {
    methods: ["DELETE"],
    pattern: '/management/users/:id',
    tokens: [[0,"management"],[0,"users"],[1,"id"]],
    types: placeholder as Registry['management.users.delete']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
