import type {
  ManagementNeighborhoodShowResponse,
  ManagementNoticeShowResponse,
  ManagementReportShowResponse,
  ManagementScheduleShowResponse,
  ManagementUserShowResponse,
} from '@curupira/shared'

import { NEIGHBORHOODS } from '../neighborhoods'
import { SCHEDULES } from '../schedules'

import { seedNotices } from './seed-notices'
import { seedReports } from './seed-reports'
import { SEEDED_AT, seedUsers } from './seed-users'

/**
 * The in-memory database of the panel's example data. One object, and not one variable
 * per module, because the resources reference each other (a schedule names its
 * neighborhood, a report names its neighborhood, deleting a neighborhood checks the
 * schedule) and two modules importing each other would be a cycle. Everything lives
 * here and the per-resource modules only read and write it.
 *
 * It is plain module state: it resets on reload and, in SSR, is shared by the process.
 * That is fine for `VITE_DATA_SOURCE=mock`, which exists to build screens, and is why
 * none of this is reachable when the source is `api`.
 *
 * Names are NOT stored on schedules and reports: they are looked up when a row is
 * presented, so renaming a neighborhood changes every row that mentions it, as the
 * API's join does.
 */
export type StoredSchedule = Omit<
  ManagementScheduleShowResponse,
  'neighborhoodName'
>

export type StoredReport = Omit<
  ManagementReportShowResponse,
  'neighborhoodName'
>

type Store = {
  neighborhoods: Array<ManagementNeighborhoodShowResponse>
  schedules: Array<StoredSchedule>
  notices: Array<ManagementNoticeShowResponse>
  users: Array<ManagementUserShowResponse>
  reports: Array<StoredReport>
}

export const store: Store = {
  neighborhoods: NEIGHBORHOODS.map((item) => ({
    ...item,
    createdAt: SEEDED_AT,
    updatedAt: null,
  })),
  schedules: SCHEDULES.map((item) => ({
    ...item,
    createdAt: SEEDED_AT,
    updatedAt: null,
  })),
  notices: seedNotices(),
  users: seedUsers(),
  reports: seedReports(),
}

export function neighborhoodName(id: string | null): string | null {
  if (!id) return null

  return store.neighborhoods.find((item) => item.id === id)?.name ?? null
}
