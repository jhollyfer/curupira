import {
  PROTOCOL_ALPHABET,
  REPORT_PUBLIC_STATUSES,
  formatProtocol,
  z,
} from '@curupira/shared'
import type {
  ReportKind,
  ReportStatus,
  StorefrontReportMapResponse,
  StorefrontReportShowByProtocolResponse,
} from '@curupira/shared'
import type { DateTime } from 'luxon'

import { readLocal, writeLocal } from '#/lib/local-store'

import { exampleUuid } from './ids'

/**
 * EXAMPLE DATA. About fifteen occurrences around -4.3836, -70.0311 with plausible
 * spots (river bank, port, edges of the urban area), spread over the kinds and
 * statuses so the public map has every pin. Dates are relative to "now", so the
 * map always reads "recent".
 *
 * Also keeps the reports this browser "sends" while `VITE_DATA_SOURCE=mock`, so a
 * protocol that comes back from the form can be followed on the tracking screen.
 */

type Seed = readonly [ReportKind, ReportStatus, number, number, number]

const SEEDS: ReadonlyArray<Seed> = [
  ['BURNING', 'IN_REVIEW', -4.3902, -70.0451, 2],
  ['BURNING', 'FORWARDED', -4.3721, -70.0188, 5],
  ['BURNING', 'RESOLVED', -4.4003, -70.0289, 21],
  ['DUMPING', 'RESOLVED', -4.3861, -70.0334, 12],
  ['DUMPING', 'IN_REVIEW', -4.3799, -70.0276, 1],
  ['DUMPING', 'FORWARDED', -4.3944, -70.0397, 6],
  ['DUMPING', 'RESOLVED', -4.3768, -70.0233, 30],
  ['DUMPING', 'IN_REVIEW', -4.3825, -69.9931, 3],
  ['DEFORESTATION', 'FORWARDED', -4.4081, -70.0512, 9],
  ['DEFORESTATION', 'IN_REVIEW', -4.3689, -70.0471, 4],
  ['DEFORESTATION', 'RESOLVED', -4.4162, -70.0215, 40],
  ['OTHER', 'IN_REVIEW', -4.3852, -70.0366, 2],
  ['OTHER', 'RESOLVED', -4.3917, -70.0258, 17],
  ['BURNING', 'IN_REVIEW', -4.3778, -69.9985, 0],
  ['DUMPING', 'FORWARDED', -4.3898, -70.0301, 7],
]

export function exampleMapReports(
  now: DateTime,
): Array<StorefrontReportMapResponse> {
  return SEEDS.filter(([, status]) =>
    REPORT_PUBLIC_STATUSES.some((item) => item === status),
  ).map(([kind, status, latitude, longitude, daysAgo], index) => ({
    id: exampleUuid('d', index + 1),
    kind,
    status,
    latitude,
    longitude,
    day: now.minus({ days: daysAgo }).toFormat('yyyy-LL-dd'),
  }))
}

/** Protocols anyone can try on the tracking screen (also shown as a hint there). */
export const EXAMPLE_PROTOCOLS = [
  'CUR-7K3M-9QX2',
  'CUR-4H8N-2WTB',
  'CUR-9D5P-X6RA',
] as const

type Followed = Readonly<{
  kind: ReportKind
  status: ReportStatus
  /** Days ago the report was received. */
  receivedDaysAgo: number
  events: ReadonlyArray<
    readonly [ReportStatus, string | null, number]
  >
}>

const FOLLOWED: Record<string, Followed | undefined> = {
  'CUR-7K3M-9QX2': {
    kind: 'DUMPING',
    status: 'RESOLVED',
    receivedDaysAgo: 12,
    events: [
      ['RECEIVED', null, 12],
      ['IN_REVIEW', 'Equipe da limpeza urbana analisou a foto.', 11],
      ['FORWARDED', 'Encaminhada à Secretaria de Meio Ambiente.', 9],
      ['RESOLVED', 'Entulho removido e local limpo.', 5],
    ],
  },
  'CUR-4H8N-2WTB': {
    kind: 'BURNING',
    status: 'FORWARDED',
    receivedDaysAgo: 5,
    events: [
      ['RECEIVED', null, 5],
      ['IN_REVIEW', 'Local conferido no mapa.', 5],
      ['FORWARDED', 'Encaminhada ao Corpo de Bombeiros.', 4],
    ],
  },
  'CUR-9D5P-X6RA': {
    kind: 'DEFORESTATION',
    status: 'IN_REVIEW',
    receivedDaysAgo: 2,
    events: [
      ['RECEIVED', null, 2],
      ['IN_REVIEW', null, 1],
    ],
  },
}

const SUBMITTED_THEME = 'submitted-reports'

const submittedSchema = z.array(
  z.object({
    protocol: z.string(),
    kind: z.enum(['BURNING', 'DUMPING', 'DEFORESTATION', 'OTHER']),
    createdAt: z.string(),
  }),
)

/** A protocol in the real format: 8 symbols drawn from the shared alphabet. */
export function randomProtocol(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const symbols = Array.from(
    bytes,
    (byte) => PROTOCOL_ALPHABET[byte % PROTOCOL_ALPHABET.length],
  ).join('')

  return formatProtocol(symbols)
}

export function saveSubmittedReport(
  protocol: string,
  kind: ReportKind,
  createdAt: string,
): void {
  const current = readLocal({
    theme: SUBMITTED_THEME,
    schema: submittedSchema,
    fallback: [],
  })

  writeLocal(SUBMITTED_THEME, [...current, { protocol, kind, createdAt }])
}

export function findReportByProtocol(
  protocol: string,
  now: DateTime,
): StorefrontReportShowByProtocolResponse | null {
  const at = (daysAgo: number): string =>
    now.minus({ days: daysAgo }).toISO({ suppressMilliseconds: true }) ?? ''

  const followed = FOLLOWED[protocol]
  if (followed) {
    return {
      protocol,
      kind: followed.kind,
      status: followed.status,
      createdAt: at(followed.receivedDaysAgo),
      events: followed.events.map(([status, message, daysAgo]) => ({
        status,
        message,
        at: at(daysAgo),
      })),
    }
  }

  const mine = readLocal({
    theme: SUBMITTED_THEME,
    schema: submittedSchema,
    fallback: [],
  }).find((item) => item.protocol === protocol)

  if (!mine) return null

  return {
    protocol,
    kind: mine.kind,
    status: 'RECEIVED',
    createdAt: mine.createdAt,
    events: [{ status: 'RECEIVED', message: null, at: mine.createdAt }],
  }
}
