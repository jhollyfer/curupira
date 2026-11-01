import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { HTTPError } from '#/integrations/tanstack-query/http'

import {
  countQueuedReports,
  enqueueReport,
  flushQueue,
  listQueuedReports,
} from './report-queue'
import type { ReportDraft } from './report-queue'

function draft(description: string): ReportDraft {
  return {
    kind: 'DUMPING',
    latitude: -4.38,
    longitude: -70.03,
    description,
    photos: [new Blob(['x'], { type: 'image/jpeg' })],
  }
}

async function clear(): Promise<void> {
  await flushQueue(() => Promise.resolve({ protocol: 'CUR-0000-0000' }))
}

beforeEach(async () => {
  await clear()
})

describe('report queue', () => {
  it('keeps the draft with its photo', async () => {
    await enqueueReport(draft('um'))

    const [item] = await listQueuedReports()

    expect(item?.draft.description).toBe('um')
    expect(item?.draft.photos).toHaveLength(1)
  })

  it('sends oldest first and empties the queue', async () => {
    await enqueueReport(draft('primeiro'))
    await enqueueReport(draft('segundo'))
    const order: Array<string | undefined> = []

    const result = await flushQueue((item) => {
      order.push(item.description)

      return Promise.resolve({ protocol: `CUR-${order.length}` })
    })

    expect(order).toEqual(['primeiro', 'segundo'])
    expect(result.sent).toEqual(['CUR-1', 'CUR-2'])
    expect(await countQueuedReports()).toBe(0)
  })

  it('stops at a network failure and keeps the rest for later', async () => {
    await enqueueReport(draft('a'))
    await enqueueReport(draft('b'))

    const result = await flushQueue(() =>
      Promise.reject(
        new HTTPError({ message: 'x', status: 0, code: 'NETWORK_ERROR' }),
      ),
    )

    expect(result.sent).toEqual([])
    expect(result.remaining).toBe(2)
  })

  it('drops a report the server refuses for good', async () => {
    await enqueueReport(draft('ruim'))

    const result = await flushQueue(() =>
      Promise.reject(
        new HTTPError({ message: 'x', status: 422, code: 'VALIDATION_ERROR' }),
      ),
    )

    expect(result.dropped).toBe(1)
    expect(result.remaining).toBe(0)
  })

  it('shares one flush between simultaneous calls, so nothing is sent twice', async () => {
    await enqueueReport(draft('única'))
    let calls = 0
    const send = () => {
      calls += 1

      return Promise.resolve({ protocol: 'CUR-1' })
    }

    await Promise.all([flushQueue(send), flushQueue(send)])

    expect(calls).toBe(1)
  })
})
