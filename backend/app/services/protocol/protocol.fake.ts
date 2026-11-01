import { formatProtocol } from '@curupira/shared'

import { ProtocolContract } from '#services/protocol/protocol.contract'

/** A scripted generator for the unit test: hands out the given symbols in order, then counts up. */
export class ProtocolFake extends ProtocolContract {
  private readonly queue: string[]
  private counter = 0

  constructor(...symbols: string[]) {
    super()
    this.queue = [...symbols]
  }

  next(): string {
    const queued = this.queue.shift()
    if (queued) return formatProtocol(queued)

    this.counter += 1

    return formatProtocol(String(this.counter).padStart(8, '0'))
  }
}
