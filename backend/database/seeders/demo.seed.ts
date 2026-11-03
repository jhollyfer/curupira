import { randomUUID } from 'node:crypto'

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import {
  ACTIVE_STATUS,
  COLLECTION_SHIFT,
  REPORT_KIND,
  REPORT_STATUS,
  REPORT_STATUSES,
  UPLOAD_STATUS,
  USER_ROLE,
  USER_ROLES,
  WASTE_TYPE,
  WEEKDAY,
  formatProtocol,
  type CollectionShift,
  type ReportKind,
  type ReportStatus,
  type WasteType,
  type Weekday,
} from '@curupira/shared'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'

import CollectionSchedule from '#models/collection-schedule'
import Neighborhood from '#models/neighborhood'
import Notice from '#models/notice'
import Report from '#models/report'
import ReportPhoto from '#models/report-photo'
import ReportStatusEvent from '#models/report-status-event'
import Storage from '#models/storage'
import User from '#models/user'
import env from '#start/env'
import NeighborhoodSeeder from '#database/seeders/neighborhood.seed'

/**
 * A demonstration of the whole product: a sample collection schedule, about fifteen
 * reports in every status with their timelines and photos, and a few notices.
 *
 * **EXAMPLE DATA ONLY.** The schedule is invented (the real one comes from the city hall,
 * in the panel), the reports are fictional, their protocols start with `SEED` so they are
 * recognizable, and the photos are `storages` rows marked `seed/` **with no file in the
 * bucket**: their signed URLs lead nowhere, which is enough for every screen except
 * actually opening the image.
 *
 * Switched on by `SEED_DEMO_PASSWORD` having a value, in any environment
 * (_standards/backend.md §6.2, "Seed ligado pela chave"): empty skips it with one log line
 * and the rest of `node ace db:seed` runs. It also creates one account per role
 * (`<role>@example.com`, e.g. `administrator@example.com`) sharing that password, so every
 * profile of the panel can be signed into; the e2e reads the same addresses.
 * Idempotent: the protocols are fixed, so running again reasserts instead of duplicating.
 */
type Slot = readonly [Weekday, CollectionShift, WasteType]

/** The sample week: organic three times, recyclable once, bulky on demand day. */
const WEEK: ReadonlyArray<Slot> = [
  [WEEKDAY.MONDAY, COLLECTION_SHIFT.MORNING, WASTE_TYPE.ORGANIC],
  [WEEKDAY.WEDNESDAY, COLLECTION_SHIFT.MORNING, WASTE_TYPE.ORGANIC],
  [WEEKDAY.FRIDAY, COLLECTION_SHIFT.AFTERNOON, WASTE_TYPE.ORGANIC],
  [WEEKDAY.TUESDAY, COLLECTION_SHIFT.AFTERNOON, WASTE_TYPE.RECYCLABLE],
  [WEEKDAY.SATURDAY, COLLECTION_SHIFT.MORNING, WASTE_TYPE.BULKY],
]

/** Approximate center of the urban area: the demo pins start here until a neighborhood has its own point. */
const CITY_CENTER = { latitude: -4.3769, longitude: -70.0314 } as const

type SeedReport = {
  readonly kind: ReportKind
  readonly status: ReportStatus
  readonly neighborhood: string
  readonly dLat: number
  readonly dLon: number
  readonly daysAgo: number
  readonly description: string
  readonly contact: string | null
}

const REPORTS: ReadonlyArray<SeedReport> = [
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.RECEIVED,
    neighborhood: 'Centro',
    dLat: 0.002,
    dLon: -0.003,
    daysAgo: 0,
    description: 'Entulho jogado na calçada da feira.',
    contact: null,
  },
  {
    kind: REPORT_KIND.BURNING,
    status: REPORT_STATUS.IN_REVIEW,
    neighborhood: 'Cohabam',
    dLat: -0.003,
    dLon: 0.002,
    daysAgo: 1,
    description: 'Queimada em terreno baldio perto da escola.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DEFORESTATION,
    status: REPORT_STATUS.FORWARDED,
    neighborhood: 'Umarizal',
    dLat: 0.004,
    dLon: 0.001,
    daysAgo: 3,
    description: 'Árvores grandes derrubadas na margem do igarapé.',
    contact: '(97) 90000-0001',
  },
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.RESOLVED,
    neighborhood: 'Castanhal',
    dLat: -0.001,
    dLon: -0.002,
    daysAgo: 9,
    description: 'Lixo acumulado no porto, mau cheiro forte.',
    contact: null,
  },
  {
    kind: REPORT_KIND.OTHER,
    status: REPORT_STATUS.RECEIVED,
    neighborhood: 'Cidade Nova',
    dLat: 0.001,
    dLon: 0.003,
    daysAgo: 0,
    description: 'Esgoto a céu aberto na rua principal.',
    contact: '(97) 90000-0002',
  },
  {
    kind: REPORT_KIND.BURNING,
    status: REPORT_STATUS.RESOLVED,
    neighborhood: 'Bom Jardim',
    dLat: -0.002,
    dLon: 0.001,
    daysAgo: 14,
    description: 'Fumaça de queima de lixo toda tarde.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.IN_REVIEW,
    neighborhood: 'Alzenir Magalhães',
    dLat: 0.003,
    dLon: -0.001,
    daysAgo: 2,
    description: 'Sofá e colchões deixados na esquina.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DEFORESTATION,
    status: REPORT_STATUS.RECEIVED,
    neighborhood: 'Eduardo Braga',
    dLat: -0.004,
    dLon: -0.003,
    daysAgo: 1,
    description: 'Desmatamento para abrir roçado perto das casas.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.FORWARDED,
    neighborhood: 'Coimbra',
    dLat: 0.002,
    dLon: 0.002,
    daysAgo: 5,
    description: 'Descarte de lixo hospitalar em saco aberto.',
    contact: '(97) 90000-0003',
  },
  {
    kind: REPORT_KIND.BURNING,
    status: REPORT_STATUS.IN_REVIEW,
    neighborhood: 'Colônia I',
    dLat: -0.001,
    dLon: 0.004,
    daysAgo: 4,
    description: 'Queimada grande no ramal, perto das plantações.',
    contact: null,
  },
  {
    kind: REPORT_KIND.OTHER,
    status: REPORT_STATUS.RESOLVED,
    neighborhood: 'Javarizinho',
    dLat: 0.001,
    dLon: -0.004,
    daysAgo: 20,
    description: 'Animal morto na estrada há dias.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.RECEIVED,
    neighborhood: 'Monte da Redenção',
    dLat: -0.002,
    dLon: -0.001,
    daysAgo: 0,
    description: 'Lixo fora do horário da coleta, sacos rasgados.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DEFORESTATION,
    status: REPORT_STATUS.RESOLVED,
    neighborhood: 'Centro',
    dLat: -0.003,
    dLon: 0.001,
    daysAgo: 30,
    description: 'Corte de árvore na praça sem autorização.',
    contact: null,
  },
  {
    kind: REPORT_KIND.BURNING,
    status: REPORT_STATUS.FORWARDED,
    neighborhood: 'Cohabam',
    dLat: 0.002,
    dLon: -0.002,
    daysAgo: 6,
    description: 'Queima de fios para tirar o cobre.',
    contact: null,
  },
  {
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.IN_REVIEW,
    neighborhood: 'Umarizal',
    dLat: -0.001,
    dLon: -0.002,
    daysAgo: 7,
    description: 'Lixo jogado no rio perto do porto das canoas.',
    contact: null,
  },
]

/** What the team wrote to the resident at each step; `null` for the first (the resident's own). */
const STEP_MESSAGES: Record<ReportStatus, string | null> = {
  [REPORT_STATUS.RECEIVED]: null,
  [REPORT_STATUS.IN_REVIEW]:
    'Recebemos a denúncia e a equipe está analisando o local.',
  [REPORT_STATUS.FORWARDED]: 'Encaminhamos o caso ao órgão responsável.',
  [REPORT_STATUS.RESOLVED]: 'Problema resolvido. Obrigado por avisar.',
}

export default class extends BaseSeeder {
  override async run() {
    const password = env.get('SEED_DEMO_PASSWORD')

    if (!password) {
      logger.info(
        'SEED_DEMO_PASSWORD is empty: the demonstration seed was skipped.',
      )
      return
    }

    await this.accounts(password)
    // Through the container, not `new` (_standards/backend.md §2.1).
    const neighborhoods = await app.container.make(NeighborhoodSeeder, [
      this.client,
    ])
    await neighborhoods.run()

    await this.schedules()
    await this.notices()
    await this.reports()
  }

  /** One account per role, the same password, an address the seeder itself derives. */
  private async accounts(password: string) {
    for (const role of USER_ROLES) {
      const email = `${role.toLowerCase()}@example.com`

      await User.updateOrCreate(
        { email },
        {
          name: `Demonstração ${role.toLowerCase()}`,
          email,
          password,
          role,
          status: ACTIVE_STATUS.ACTIVE,
        },
      )
    }
  }

  private async schedules() {
    const all = await Neighborhood.all()
    for (const neighborhood of all) {
      for (const [weekday, shift, wasteType] of WEEK) {
        await CollectionSchedule.updateOrCreate(
          { neighborhoodId: neighborhood.id, wasteType, weekday, shift },
          { note: 'Horário de exemplo, a confirmar com a prefeitura.' },
        )
      }
    }
  }

  private async notices() {
    const now = DateTime.now()
    const notices = [
      {
        title: 'Coleta no feriado (exemplo)',
        body: 'No feriado a coleta passa no turno da tarde. Aviso de exemplo.',
        startsAt: now.minus({ days: 1 }),
        endsAt: now.plus({ days: 6 }),
      },
      {
        title: 'Mutirão de limpeza (exemplo)',
        body: 'Mutirão de limpeza no sábado, a partir das 7h. Aviso de exemplo.',
        startsAt: now.plus({ days: 3 }),
        endsAt: now.plus({ days: 4 }),
      },
      {
        title: 'Campanha do lixo reciclável (exemplo)',
        body: 'Separe o lixo reciclável. Aviso de exemplo já encerrado.',
        startsAt: now.minus({ days: 30 }),
        endsAt: now.minus({ days: 10 }),
      },
    ]
    for (const notice of notices) {
      await Notice.updateOrCreate({ title: notice.title }, notice)
    }
  }

  private async reports() {
    const author = await User.query()
      .where('role', USER_ROLE.ADMINISTRATOR)
      .first()
    const everyone = await Neighborhood.all()
    const centers = new Map(everyone.map((each) => [each.name, each]))

    for (const [index, seed] of REPORTS.entries()) {
      const center = centers.get(seed.neighborhood)
      const protocol = formatProtocol(
        `SEED${String(index + 1).padStart(4, '0')}`,
      )
      const createdAt = DateTime.now().minus({ days: seed.daysAgo })

      const report = await Report.updateOrCreate(
        { protocol },
        {
          kind: seed.kind,
          status: seed.status,
          latitude: (center?.latitude ?? CITY_CENTER.latitude) + seed.dLat,
          longitude: (center?.longitude ?? CITY_CENTER.longitude) + seed.dLon,
          neighborhoodId: center?.id ?? null,
          description: seed.description,
          contact: seed.contact,
          anonymous: seed.contact === null,
          createdAt,
        },
      )

      await this.timeline(report, seed.status, createdAt, author?.id ?? null)
      await this.photo(report, index)
    }
  }

  /** One event per step up to the current status, a day apart. */
  private async timeline(
    report: Report,
    status: ReportStatus,
    createdAt: DateTime,
    authorId: string | null,
  ) {
    const reached = REPORT_STATUSES.slice(
      0,
      REPORT_STATUSES.indexOf(status) + 1,
    )
    await ReportStatusEvent.query().where('reportId', report.id).delete()

    for (const [step, each] of reached.entries()) {
      // The first line is the resident's own: no author.
      let eventAuthor = authorId
      if (step === 0) eventAuthor = null

      await ReportStatusEvent.create({
        id: randomUUID(),
        reportId: report.id,
        status: each,
        message: STEP_MESSAGES[each],
        authorId: eventAuthor,
        at: createdAt.plus({ hours: step * 20 }),
      })
    }
  }

  /** A fictional photo: the row exists, the object in the bucket does not. */
  private async photo(report: Report, index: number) {
    if (await ReportPhoto.query().where('reportId', report.id).first()) return

    const filename = `seed/seed-foto-${index + 1}.jpg`
    const storage = await Storage.create({
      filename,
      originalName: `seed-foto-${index + 1}.jpg`,
      mimetype: 'image/jpeg',
      size: 1024,
      path: filename,
      status: UPLOAD_STATUS.UPLOADED,
    })
    await ReportPhoto.create({
      reportId: report.id,
      storageId: storage.id,
      position: 0,
    })
  }
}
