/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  healthCheck: typeof routes['health-check']
  documentation: {
    openapi: typeof routes['documentation.openapi']
    reference: typeof routes['documentation.reference']
  }
  storefront: {
    neighborhoods: typeof routes['storefront.neighborhoods']
    schedules: typeof routes['storefront.schedules']
    notices: typeof routes['storefront.notices']
    reportPhotos: {
      create: typeof routes['storefront.reportPhotos.create']
      complete: typeof routes['storefront.reportPhotos.complete']
    }
    reports: {
      create: typeof routes['storefront.reports.create']
      map: typeof routes['storefront.reports.map']
      showByProtocol: typeof routes['storefront.reports.showByProtocol']
    }
  }
  authentication: {
    signIn: typeof routes['authentication.sign_in']
    signOut: typeof routes['authentication.sign_out']
    refresh: typeof routes['authentication.refresh']
  }
  profile: {
    show: typeof routes['profile.show']
    update: typeof routes['profile.update']
  }
  storages: {
    paginate: typeof routes['storages.paginate']
    create: typeof routes['storages.create']
    complete: typeof routes['storages.complete']
    parts: typeof routes['storages.parts']
    show: typeof routes['storages.show']
    delete: typeof routes['storages.delete']
    download: typeof routes['storages.download']
  }
  management: {
    reports: {
      paginate: typeof routes['management.reports.paginate']
      map: typeof routes['management.reports.map']
      stats: typeof routes['management.reports.stats']
      show: typeof routes['management.reports.show']
      updateStatus: typeof routes['management.reports.updateStatus']
      delete: typeof routes['management.reports.delete']
    }
    notices: {
      paginate: typeof routes['management.notices.paginate']
      create: typeof routes['management.notices.create']
      show: typeof routes['management.notices.show']
      update: typeof routes['management.notices.update']
      close: typeof routes['management.notices.close']
      delete: typeof routes['management.notices.delete']
    }
    schedules: {
      paginate: typeof routes['management.schedules.paginate']
      create: typeof routes['management.schedules.create']
      show: typeof routes['management.schedules.show']
      update: typeof routes['management.schedules.update']
      delete: typeof routes['management.schedules.delete']
    }
    neighborhoods: {
      paginate: typeof routes['management.neighborhoods.paginate']
      create: typeof routes['management.neighborhoods.create']
      show: typeof routes['management.neighborhoods.show']
      update: typeof routes['management.neighborhoods.update']
      delete: typeof routes['management.neighborhoods.delete']
    }
    users: {
      paginate: typeof routes['management.users.paginate']
      create: typeof routes['management.users.create']
      show: typeof routes['management.users.show']
      update: typeof routes['management.users.update']
      delete: typeof routes['management.users.delete']
    }
  }
}
