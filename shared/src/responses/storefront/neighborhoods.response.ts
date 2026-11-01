import { z } from '../../validator.js'

/** The neighborhood the resident picks once and the app remembers. */
export const StorefrontNeighborhoodShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export type StorefrontNeighborhoodShowResponse = z.infer<
  typeof StorefrontNeighborhoodShowResponse
>
