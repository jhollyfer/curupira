import { randomUUID } from 'node:crypto'

import { REPORT_KIND, WASTE_TYPE, WEEKDAY, COLLECTION_SHIFT } from '@curupira/shared'

import { CollectionSchedule } from '#domain/collection-schedule/collection-schedule.entity'
import { Neighborhood } from '#domain/neighborhood/neighborhood.entity'
import { Notice } from '#domain/notice/notice.entity'
import { Report } from '#domain/report/report.entity'
import type { CollectionScheduleMemoryRepository } from '#repositories/collection-schedule/collection-schedule.memory.repository'
import type { NeighborhoodMemoryRepository } from '#repositories/neighborhood/neighborhood.memory.repository'
import type { NoticeMemoryRepository } from '#repositories/notice/notice.memory.repository'
import type { ReportMemoryRepository } from '#repositories/report/report.memory.repository'

/** The clock every domain fixture is born at. */
export const NOW = new Date('2026-10-29T12:00:00.000Z')

/** Saves a neighborhood in the in-memory repository and returns its id. */
export async function seedNeighborhood(
  neighborhoods: NeighborhoodMemoryRepository,
  name = 'Centro',
  center?: { readonly latitude: number; readonly longitude: number },
): Promise<string> {
  const created = Neighborhood.create({ id: randomUUID(), name, ...center, now: NOW })
  if (created.isLeft()) throw new Error('invalid arrangement')
  await neighborhoods.save(created.value)

  return created.value.id
}

/** Saves a collection slot in the in-memory repository and returns its id. */
export async function seedSchedule(
  schedules: CollectionScheduleMemoryRepository,
  neighborhoodId: string,
  overrides: Partial<Parameters<typeof CollectionSchedule.create>[0]> = {},
): Promise<string> {
  const schedule = CollectionSchedule.create({
    id: randomUUID(),
    neighborhoodId,
    wasteType: WASTE_TYPE.ORGANIC,
    weekday: WEEKDAY.MONDAY,
    shift: COLLECTION_SHIFT.MORNING,
    now: NOW,
    ...overrides,
  })
  await schedules.save(schedule)

  return schedule.id
}

/** Saves a notice in the in-memory repository and returns its id. */
export async function seedNotice(
  notices: NoticeMemoryRepository,
  overrides: Partial<Parameters<typeof Notice.create>[0]> = {},
): Promise<string> {
  const created = Notice.create({
    id: randomUUID(),
    title: 'Coleta no feriado',
    body: 'Passa à tarde.',
    startsAt: new Date(NOW.getTime() - 24 * 60 * 60 * 1000),
    now: NOW,
    ...overrides,
  })
  if (created.isLeft()) throw new Error('invalid arrangement')
  await notices.save(created.value)

  return created.value.id
}

/** Saves a received report in the in-memory repository and returns it. */
export async function seedReport(
  reports: ReportMemoryRepository,
  overrides: Partial<Parameters<typeof Report.receive>[0]> = {},
): Promise<Report> {
  const report = Report.receive({
    id: randomUUID(),
    eventId: randomUUID(),
    protocol: 'CUR-2ABC-3DEF',
    kind: REPORT_KIND.DUMPING,
    latitude: -4.3769,
    longitude: -70.0314,
    neighborhoodId: null,
    photoIds: [],
    now: NOW,
    ...overrides,
  })
  await reports.save(report)

  return report
}
