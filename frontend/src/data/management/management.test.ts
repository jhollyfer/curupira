import { describe, expect, it } from 'vitest'

import { HTTPError } from '#/integrations/tanstack-query/http'

import { createNeighborhood, deleteNeighborhood } from './neighborhoods'
import { paginate } from './paginate'
import {
  listReports,
  mapReports,
  reportStats,
  updateReportStatus,
} from './reports'
import { createSchedule } from './schedules'
import { store } from './store'

function refusal(run: () => unknown): HTTPError {
  try {
    run()
  } catch (error) {
    if (error instanceof HTTPError) return error
  }

  throw new Error('expected an HTTPError')
}

describe('paginate', () => {
  it('clamps page and perPage like the backend', () => {
    const page = paginate([1, 2, 3], { page: 99, perPage: 500 })

    expect(page.meta.perPage).toBe(100)
    expect(page.meta.currentPage).toBe(1)
    expect(page.data).toEqual([1, 2, 3])
  })

  it('reports the neighbours of the page', () => {
    const page = paginate([1, 2, 3, 4, 5], { page: 2, perPage: 2 })

    expect(page.data).toEqual([3, 4])
    expect(page.meta.lastPage).toBe(3)
    expect(page.meta.nextPageUrl).not.toBeNull()
    expect(page.meta.previousPageUrl).not.toBeNull()
  })
})

describe('example reports', () => {
  it('the table and the map apply the same filter', () => {
    const filter = { kind: 'BURNING' as const }
    const table = listReports({ ...filter, perPage: 100 })

    expect(mapReports(filter)).toHaveLength(table.meta.total)
    expect(table.data.every((item) => item.kind === 'BURNING')).toBe(true)
  })

  it('counts by status and kind to the total', () => {
    const stats = reportStats()
    const byStatus = Object.values(stats.byStatus).reduce((a, b) => a + b, 0)

    expect(byStatus).toBe(stats.total)
    expect(stats.lastThirtyDays.length).toBeGreaterThan(0)
  })

  it('moves forward with an author and refuses to go back with a 422 on status', () => {
    const received = listReports({ status: 'RECEIVED', perPage: 1 }).data[0]
    if (!received) throw new Error('no received report in the example data')

    const moved = updateReportStatus(received.id, {
      status: 'FORWARDED',
      message: 'Enviada',
    })
    expect(moved.status).toBe('FORWARDED')
    expect(moved.events.at(-1)?.message).toBe('Enviada')
    expect(moved.events.at(-1)?.authorName).not.toBeNull()

    const error = refusal(() =>
      updateReportStatus(received.id, { status: 'IN_REVIEW' }),
    )
    expect(error.status).toBe(422)
    expect(error.code).toBe('REPORT_STATUS_REGRESSION')
    expect(error.errors).toHaveProperty('status')
  })
})

describe('example schedule and neighborhoods', () => {
  it('a duplicated slot is a 409 pointing at the weekday field', () => {
    const existing = store.schedules[0]
    if (!existing) throw new Error('no schedule in the example data')

    const error = refusal(() =>
      createSchedule({
        neighborhoodId: existing.neighborhoodId,
        wasteType: existing.wasteType,
        weekday: existing.weekday,
        shift: existing.shift,
      }),
    )

    expect(error.status).toBe(409)
    expect(error.errors).toHaveProperty('weekday')
  })

  it('a neighborhood with collections cannot be deleted', () => {
    const used = store.schedules[0]?.neighborhoodId
    if (!used) throw new Error('no schedule in the example data')

    expect(refusal(() => deleteNeighborhood(used)).code).toBe(
      'NEIGHBORHOOD_IN_USE',
    )
  })

  it('refuses a repeated name and half a center', () => {
    expect(refusal(() => createNeighborhood({ name: 'Centro' })).status).toBe(
      409,
    )
    expect(
      refusal(() => createNeighborhood({ name: 'Novo Bairro', latitude: -4.4 }))
        .code,
    ).toBe('NEIGHBORHOOD_CENTER_INCOMPLETE')
  })
})
