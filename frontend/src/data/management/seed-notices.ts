import type { ManagementNoticeShowResponse } from '@curupira/shared'

import { townNow } from '#/lib/i18n'

import { exampleUuid } from '../ids'

/**
 * EXAMPLE notices, relative to "now" so the three statuses exist whenever the panel is
 * opened: a fixed date would turn every one of them into CLOSED within a week.
 */
export function seedNotices(): Array<ManagementNoticeShowResponse> {
  const now = townNow()
  const iso = (days: number): string =>
    now.plus({ days }).toISO({ suppressMilliseconds: true }) ?? ''

  const rows = [
    [
      'Coleta alterada no feriado',
      'No feriado, o caminhão passa só no turno da tarde. Deixe o lixo na calçada depois do almoço.',
      -1,
      5,
      null,
      'ACTIVE',
    ],
    [
      'Queimada não se apaga sozinho',
      'Viu fogo no mato ou no terreno? Faça a denúncia pelo aplicativo, com foto e localização.',
      -20,
      null,
      null,
      'ACTIVE',
    ],
    [
      'Coleta extra no Porto Cajuí',
      'Até o fim do mês há coleta de reforço aos domingos à noite perto do porto.',
      -3,
      20,
      null,
      'ACTIVE',
    ],
    [
      'Mutirão de limpeza do igarapé',
      'Sábado, às 7h, saída da praça central. Luvas e sacos serão distribuídos.',
      4,
      5,
      null,
      'SCHEDULED',
    ],
    [
      'Nova rota no Umariaçu',
      'A partir da próxima semana a coleta orgânica no Umariaçu passa de manhã.',
      9,
      null,
      null,
      'SCHEDULED',
    ],
    [
      'Caminhão em manutenção',
      'A coleta de volumosos ficou suspensa por dois dias e já foi retomada.',
      -15,
      -10,
      -10,
      'CLOSED',
    ],
    [
      'Feira do reciclável',
      'A feira de troca de recicláveis foi encerrada com 340 kg recolhidos.',
      -40,
      -30,
      -30,
      'CLOSED',
    ],
  ] as const

  return rows.map(([title, body, start, end, closed, status], index) => {
    let endsAt: string | null = null
    if (end !== null) endsAt = iso(end)
    let closedAt: string | null = null
    if (closed !== null) closedAt = iso(closed)

    return {
      id: exampleUuid('c', index + 1),
      title,
      body,
      status,
      startsAt: iso(start),
      endsAt,
      closedAt,
      createdAt: iso(start - 1),
      updatedAt: null,
    }
  })
}
