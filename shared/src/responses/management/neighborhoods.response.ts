import { z } from '../../validator.js'

export const ManagementNeighborhoodShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type ManagementNeighborhoodShowResponse = z.infer<
  typeof ManagementNeighborhoodShowResponse
>
