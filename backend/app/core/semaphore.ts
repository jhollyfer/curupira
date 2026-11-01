/**
 * A counting semaphore for work that is expensive per call and open to anonymous callers
 * (decoding an image): without a ceiling, N simultaneous requests hold N decoded canvases
 * in memory at once, and the process dies before any rate limit matters.
 *
 * Waiters are served in arrival order, and a task that throws still gives its slot back.
 */
export class Semaphore {
  private free: number
  private readonly waiting: Array<() => void> = []

  constructor(limit: number) {
    if (limit < 1) throw new Error('Semaphore needs a limit of at least 1')

    this.free = limit
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire()

    try {
      return await task()
    } finally {
      this.release()
    }
  }

  private async acquire(): Promise<void> {
    if (this.free > 0) {
      this.free -= 1

      return
    }

    // The slot is handed over directly by `release`, so `free` is not incremented and
    // decremented in between and no newcomer can overtake the queue.
    await new Promise<void>((resolve) => this.waiting.push(resolve))
  }

  private release(): void {
    const next = this.waiting.shift()

    if (next) {
      next()

      return
    }

    this.free += 1
  }
}
