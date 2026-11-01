/** The part of the day the truck passes: a resident reads "morning", not "07:30". */
export const COLLECTION_SHIFT = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  NIGHT: 'NIGHT',
} as const

export type CollectionShift =
  (typeof COLLECTION_SHIFT)[keyof typeof COLLECTION_SHIFT]

export const COLLECTION_SHIFTS = Object.values(COLLECTION_SHIFT)
