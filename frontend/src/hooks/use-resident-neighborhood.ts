import * as React from 'react'

import {
  readNeighborhoodId,
  writeNeighborhoodId,
} from '#/lib/neighborhood-store'

export type ResidentNeighborhood = Readonly<{
  /**
   * `undefined` while we have not looked at the device yet (server render and first
   * client render), `null` when nothing was chosen, a string when one was.
   * The three-way value is what lets a screen draw a skeleton instead of flashing the
   * "which is your neighborhood?" question at someone who already answered it.
   */
  neighborhoodId: string | null | undefined
  choose: (id: string) => void
}>

/** The neighborhood this resident picked once, kept on the device. */
export function useResidentNeighborhood(): ResidentNeighborhood {
  const [neighborhoodId, setNeighborhoodId] = React.useState<
    string | null | undefined
  >(undefined)

  React.useEffect(() => {
    setNeighborhoodId(readNeighborhoodId())
  }, [])

  return {
    neighborhoodId,
    choose: (id) => {
      writeNeighborhoodId(id)
      setNeighborhoodId(id)
    },
  }
}
