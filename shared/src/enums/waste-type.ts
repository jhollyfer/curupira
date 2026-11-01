/**
 * What the collection truck picks up. The fixed color of each type lives in the
 * frontend tokens (`--waste-*`) and is the same on every screen.
 */
export const WASTE_TYPE = {
  ORGANIC: 'ORGANIC',
  RECYCLABLE: 'RECYCLABLE',
  BULKY: 'BULKY',
  DEBRIS: 'DEBRIS',
} as const

export type WasteType = (typeof WASTE_TYPE)[keyof typeof WASTE_TYPE]

export const WASTE_TYPES = Object.values(WASTE_TYPE)
