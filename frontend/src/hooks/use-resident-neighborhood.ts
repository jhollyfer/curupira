import * as React from 'react'

import { subscribeLocal } from '#/lib/local-store'
import {
  readNeighborhoodId,
  writeNeighborhoodId,
} from '#/lib/neighborhood-store'

export type ResidentNeighborhood = Readonly<{
  /**
   * `undefined` on the server and in the first client render, `null` when nothing was
   * chosen, a string when one was. The three-way value is what lets a screen draw a
   * skeleton instead of flashing the "which is your neighborhood?" question at someone
   * who already answered it.
   */
  neighborhoodId: string | null | undefined
  choose: (id: string) => void
}>

/** The server cannot know what this device chose. */
function serverSnapshot(): undefined {
  return undefined
}

/**
 * The neighborhood this resident picked once, kept on the device.
 *
 * `useSyncExternalStore` because `localStorage` is an external store: React uses the
 * server snapshot during hydration and swaps to the real one right after, with no
 * mismatch and no `setState` in an effect.
 */
export function useResidentNeighborhood(): ResidentNeighborhood {
  const neighborhoodId = React.useSyncExternalStore(
    subscribeLocal,
    readNeighborhoodId,
    serverSnapshot,
  )

  return { neighborhoodId, choose: writeNeighborhoodId }
}
