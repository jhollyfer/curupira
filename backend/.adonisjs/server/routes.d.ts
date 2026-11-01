import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health-check': { paramsTuple?: []; params?: {} }
    'documentation.openapi': { paramsTuple?: []; params?: {} }
    'documentation.reference': { paramsTuple?: []; params?: {} }
    'storefront.neighborhoods': { paramsTuple?: []; params?: {} }
    'storefront.schedules': { paramsTuple?: []; params?: {} }
    'storefront.notices': { paramsTuple?: []; params?: {} }
    'storefront.reportPhotos.create': { paramsTuple?: []; params?: {} }
    'storefront.reportPhotos.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.reports.create': { paramsTuple?: []; params?: {} }
    'storefront.reports.map': { paramsTuple?: []; params?: {} }
    'storefront.reports.showByProtocol': { paramsTuple: [ParamValue]; params: {'protocol': ParamValue} }
    'authentication.sign_in': { paramsTuple?: []; params?: {} }
    'authentication.sign_out': { paramsTuple?: []; params?: {} }
    'authentication.refresh': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'storages.paginate': { paramsTuple?: []; params?: {} }
    'storages.create': { paramsTuple?: []; params?: {} }
    'storages.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.paginate': { paramsTuple?: []; params?: {} }
    'management.reports.map': { paramsTuple?: []; params?: {} }
    'management.reports.stats': { paramsTuple?: []; params?: {} }
    'management.reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.updateStatus': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.paginate': { paramsTuple?: []; params?: {} }
    'management.notices.create': { paramsTuple?: []; params?: {} }
    'management.notices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.close': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.paginate': { paramsTuple?: []; params?: {} }
    'management.schedules.create': { paramsTuple?: []; params?: {} }
    'management.schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.paginate': { paramsTuple?: []; params?: {} }
    'management.neighborhoods.create': { paramsTuple?: []; params?: {} }
    'management.neighborhoods.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.paginate': { paramsTuple?: []; params?: {} }
    'management.users.create': { paramsTuple?: []; params?: {} }
    'management.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health-check': { paramsTuple?: []; params?: {} }
    'documentation.openapi': { paramsTuple?: []; params?: {} }
    'documentation.reference': { paramsTuple?: []; params?: {} }
    'storefront.neighborhoods': { paramsTuple?: []; params?: {} }
    'storefront.schedules': { paramsTuple?: []; params?: {} }
    'storefront.notices': { paramsTuple?: []; params?: {} }
    'storefront.reports.map': { paramsTuple?: []; params?: {} }
    'storefront.reports.showByProtocol': { paramsTuple: [ParamValue]; params: {'protocol': ParamValue} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'storages.paginate': { paramsTuple?: []; params?: {} }
    'storages.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.paginate': { paramsTuple?: []; params?: {} }
    'management.reports.map': { paramsTuple?: []; params?: {} }
    'management.reports.stats': { paramsTuple?: []; params?: {} }
    'management.reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.paginate': { paramsTuple?: []; params?: {} }
    'management.notices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.paginate': { paramsTuple?: []; params?: {} }
    'management.schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.paginate': { paramsTuple?: []; params?: {} }
    'management.neighborhoods.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.paginate': { paramsTuple?: []; params?: {} }
    'management.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'health-check': { paramsTuple?: []; params?: {} }
    'documentation.openapi': { paramsTuple?: []; params?: {} }
    'documentation.reference': { paramsTuple?: []; params?: {} }
    'storefront.neighborhoods': { paramsTuple?: []; params?: {} }
    'storefront.schedules': { paramsTuple?: []; params?: {} }
    'storefront.notices': { paramsTuple?: []; params?: {} }
    'storefront.reports.map': { paramsTuple?: []; params?: {} }
    'storefront.reports.showByProtocol': { paramsTuple: [ParamValue]; params: {'protocol': ParamValue} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'storages.paginate': { paramsTuple?: []; params?: {} }
    'storages.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.paginate': { paramsTuple?: []; params?: {} }
    'management.reports.map': { paramsTuple?: []; params?: {} }
    'management.reports.stats': { paramsTuple?: []; params?: {} }
    'management.reports.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.paginate': { paramsTuple?: []; params?: {} }
    'management.notices.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.paginate': { paramsTuple?: []; params?: {} }
    'management.schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.paginate': { paramsTuple?: []; params?: {} }
    'management.neighborhoods.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.paginate': { paramsTuple?: []; params?: {} }
    'management.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'storefront.reportPhotos.create': { paramsTuple?: []; params?: {} }
    'storefront.reportPhotos.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.reports.create': { paramsTuple?: []; params?: {} }
    'authentication.sign_in': { paramsTuple?: []; params?: {} }
    'authentication.sign_out': { paramsTuple?: []; params?: {} }
    'authentication.refresh': { paramsTuple?: []; params?: {} }
    'storages.create': { paramsTuple?: []; params?: {} }
    'storages.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.create': { paramsTuple?: []; params?: {} }
    'management.schedules.create': { paramsTuple?: []; params?: {} }
    'management.neighborhoods.create': { paramsTuple?: []; params?: {} }
    'management.users.create': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile.update': { paramsTuple?: []; params?: {} }
    'management.notices.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'storages.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.reports.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.schedules.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.neighborhoods.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.users.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'management.reports.updateStatus': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'management.notices.close': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}