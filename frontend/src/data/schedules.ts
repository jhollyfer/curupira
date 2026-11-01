import type {
  CollectionShift,
  StorefrontScheduleShowResponse,
  WasteType,
  Weekday,
} from '@curupira/shared'

import { exampleUuid } from './ids'
import { NEIGHBORHOODS } from './neighborhoods'

/**
 * EXAMPLE DATA - to be checked with the city hall.
 *
 * Three invented zones, each with all four waste types and different shifts, so the
 * calendar, the strip and the "next collection" card show every case (double days,
 * night shift, a weekday with nothing). Neighborhoods are assigned to zones by index.
 */
type Row = readonly [Weekday, WasteType, CollectionShift, string | null]

const ZONES: ReadonlyArray<ReadonlyArray<Row>> = [
  [
    ['MONDAY', 'ORGANIC', 'MORNING', 'Deixe o saco na calçada até as 6h.'],
    ['WEDNESDAY', 'ORGANIC', 'MORNING', null],
    ['FRIDAY', 'ORGANIC', 'MORNING', null],
    [
      'TUESDAY',
      'RECYCLABLE',
      'AFTERNOON',
      'Papel, plástico, metal e vidro limpos e secos.',
    ],
    [
      'THURSDAY',
      'BULKY',
      'MORNING',
      'Móveis e eletrodomésticos: coloque na frente de casa.',
    ],
    [
      'SATURDAY',
      'DEBRIS',
      'MORNING',
      'Entulho em sacos ou caçamba, sem misturar com lixo comum.',
    ],
  ],
  [
    ['TUESDAY', 'ORGANIC', 'AFTERNOON', null],
    ['THURSDAY', 'ORGANIC', 'AFTERNOON', null],
    ['SATURDAY', 'ORGANIC', 'AFTERNOON', null],
    ['WEDNESDAY', 'RECYCLABLE', 'MORNING', null],
    ['FRIDAY', 'BULKY', 'AFTERNOON', null],
    [
      'MONDAY',
      'DEBRIS',
      'NIGHT',
      'Passagem à noite: deixe o entulho na calçada.',
    ],
  ],
  [
    ['MONDAY', 'ORGANIC', 'AFTERNOON', null],
    ['WEDNESDAY', 'ORGANIC', 'AFTERNOON', null],
    ['FRIDAY', 'ORGANIC', 'AFTERNOON', null],
    [
      'SUNDAY',
      'ORGANIC',
      'NIGHT',
      'Reforço de domingo à noite, perto do porto.',
    ],
    ['THURSDAY', 'RECYCLABLE', 'MORNING', null],
    ['SATURDAY', 'BULKY', 'AFTERNOON', null],
    ['TUESDAY', 'DEBRIS', 'MORNING', null],
  ],
]

export const SCHEDULES: ReadonlyArray<StorefrontScheduleShowResponse> =
  NEIGHBORHOODS.flatMap((neighborhood, index) => {
    const rows = ZONES[index % ZONES.length] ?? []

    return rows.map(([weekday, wasteType, shift, note], rowIndex) => ({
      id: exampleUuid('b', index * 10 + rowIndex + 1),
      neighborhoodId: neighborhood.id,
      wasteType,
      weekday,
      shift,
      note,
    }))
  })

export function schedulesOf(
  neighborhoodId: string | undefined,
): ReadonlyArray<StorefrontScheduleShowResponse> {
  if (!neighborhoodId) return SCHEDULES

  return SCHEDULES.filter((item) => item.neighborhoodId === neighborhoodId)
}
