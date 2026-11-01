import { PROTOCOL_ALPHABET, formatProtocol } from '@curupira/shared'
import type { ReportKind, ReportStatus } from '@curupira/shared'

import { townNow } from '#/lib/i18n'

import { exampleUuid } from '../ids'
import { NEIGHBORHOODS } from '../neighborhoods'

import type { StoredReport } from './store'

/**
 * EXAMPLE reports for the panel: forty-four occurrences spread over the last thirty-five
 * days (so the 30-day chart has a believable shape and a few fall outside it), every
 * kind and every status, with contact and photos on some of them - the panel is the only
 * place that sees those. Deterministic (a fixed-seed generator), so a screenshot or a
 * test sees the same data on every run.
 */
const KINDS: ReadonlyArray<ReportKind> = [
  'DUMPING',
  'BURNING',
  'DUMPING',
  'DEFORESTATION',
  'OTHER',
  'DUMPING',
  'BURNING',
]

const DESCRIPTIONS = {
  BURNING: [
    'Fogo no terreno baldio atrás da escola, fumaça forte desde cedo.',
    'Queimada na beira do ramal, perto das casas. O vento está levando para o lado da rua.',
    null,
  ],
  DUMPING: [
    'Montes de lixo e entulho jogados na esquina há mais de uma semana.',
    'Sacos de lixo abertos na margem do igarapé, cheiro forte e urubus.',
    null,
    'Colchão e restos de obra deixados na calçada.',
  ],
  DEFORESTATION: [
    'Derrubada de árvores grandes para abrir terreno no fundo do quintal vizinho.',
    null,
  ],
  OTHER: [
    'Bueiro entupido com lixo, a água não escoa quando chove.',
    'Animal morto na rua, sem recolhimento.',
  ],
} satisfies Record<ReportKind, ReadonlyArray<string | null>>

const CONTACTS: ReadonlyArray<string | null> = [
  null,
  null,
  '(97) 98123-4567',
  null,
  'moradora.umariacu@exemplo.test',
  null,
  '(97) 99211-0088',
]

const STATUS_PLAN: ReadonlyArray<ReportStatus> = [
  'RECEIVED',
  'RECEIVED',
  'IN_REVIEW',
  'FORWARDED',
  'RESOLVED',
  'IN_REVIEW',
  'RESOLVED',
  'FORWARDED',
  'RECEIVED',
  'RESOLVED',
]

const MESSAGES = {
  IN_REVIEW: 'Equipe analisou a foto e conferiu o local no mapa.',
  FORWARDED: 'Encaminhada à Secretaria de Meio Ambiente.',
  RESOLVED: 'Situação resolvida pela equipe de campo.',
} as const

const AUTHORS = ['Rosângela Pinto', 'Edvaldo Cruz', 'Marcelo Tananta'] as const

const STATUS_AFTER = {
  RECEIVED: [],
  IN_REVIEW: ['IN_REVIEW'],
  FORWARDED: ['IN_REVIEW', 'FORWARDED'],
  RESOLVED: ['IN_REVIEW', 'FORWARDED', 'RESOLVED'],
} as const satisfies Record<ReportStatus, ReadonlyArray<ReportStatus>>

function generator(seed: number): () => number {
  let state = seed

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296

    return state / 4_294_967_296
  }
}

function protocolOf(next: () => number): string {
  let symbols = ''
  for (let index = 0; index < 8; index += 1) {
    symbols += PROTOCOL_ALPHABET.charAt(Math.floor(next() * 32))
  }

  return formatProtocol(symbols)
}

export function seedReports(): Array<StoredReport> {
  const next = generator(20_260_615)
  const now = townNow()
  const reports: Array<StoredReport> = []

  for (let index = 0; index < 44; index += 1) {
    const kind = KINDS[index % KINDS.length] ?? 'OTHER'
    const neighborhood = NEIGHBORHOODS[index % NEIGHBORHOODS.length]
    const daysAgo = Math.floor(next() * 35)
    const hoursAgo = Math.floor(next() * 12)
    let status = STATUS_PLAN[index % STATUS_PLAN.length] ?? 'RECEIVED'
    // The freshest ones are the ones nobody looked at yet.
    if (daysAgo <= 1) status = 'RECEIVED'

    const received = now.minus({ days: daysAgo, hours: hoursAgo })
    const iso = (offsetHours: number): string =>
      received.plus({ hours: offsetHours }).toISO({ suppressMilliseconds: true }) ??
      ''
    const options = DESCRIPTIONS[kind]
    const description = options[index % options.length] ?? null

    const events: StoredReport['events'] = [
      { status: 'RECEIVED', message: null, authorName: null, at: iso(0) },
    ]
    for (const [step, stepStatus] of STATUS_AFTER[status].entries()) {
      events.push({
        status: stepStatus,
        message: MESSAGES[stepStatus],
        authorName: AUTHORS[(index + step) % AUTHORS.length] ?? null,
        at: iso((step + 1) * 20),
      })
    }

    let photos: StoredReport['photos'] = []
    if (index % 3 !== 2) {
      photos = [
        { id: exampleUuid('e', index * 2 + 1), url: `/examples/photo-${kind.toLowerCase()}.svg` },
      ]
    }
    if (index % 5 === 0) {
      photos = [
        ...photos,
        { id: exampleUuid('e', index * 2 + 2), url: '/examples/photo-other.svg' },
      ]
    }

    // A jitter around the neighborhood center, so pins of one neighborhood do not stack.
    const jitter = (): number => (next() - 0.5) * 0.006

    reports.push({
      id: exampleUuid('d', index + 1),
      protocol: protocolOf(next),
      kind,
      status,
      latitude: (neighborhood?.latitude ?? -4.3836) + jitter(),
      longitude: (neighborhood?.longitude ?? -70.0311) + jitter(),
      neighborhoodId: neighborhood?.id ?? null,
      createdAt: iso(0),
      description,
      contact: CONTACTS[index % CONTACTS.length] ?? null,
      photos,
      events,
      updatedAt: events.at(-1)?.at ?? null,
    })
  }

  return reports
}
