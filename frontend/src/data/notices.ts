import type { StorefrontNoticeShowResponse } from '@curupira/shared'
import type { DateTime } from 'luxon'

import { exampleUuid } from './ids'

/**
 * EXAMPLE DATA. Relative to "now" on purpose: a notice with a fixed date would be
 * expired the day after this file is written, and the home would show none.
 */
export function exampleNotices(
  now: DateTime,
): Array<StorefrontNoticeShowResponse> {
  const iso = (offsetDays: number): string =>
    now.plus({ days: offsetDays }).toISO({ suppressMilliseconds: true }) ?? ''

  return [
    {
      id: exampleUuid('c', 1),
      title: 'Coleta alterada no feriado',
      body: 'No feriado, o caminhão passa só no turno da tarde. Deixe o lixo na calçada depois do almoço.',
      startsAt: iso(-1),
      endsAt: iso(5),
    },
    {
      id: exampleUuid('c', 2),
      title: 'Queimada não se apaga sozinho',
      body: 'Viu fogo no mato ou no terreno? Faça a denúncia pelo aplicativo, com foto e localização. Não precisa se identificar.',
      startsAt: iso(-20),
      endsAt: null,
    },
    {
      id: exampleUuid('c', 3),
      title: 'Coleta extra no Porto Cajuí',
      body: 'Até o fim do mês há coleta de reforço aos domingos à noite perto do porto.',
      startsAt: iso(-3),
      endsAt: iso(20),
    },
  ]
}
