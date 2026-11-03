import { afterEach, describe, expect, it } from 'vitest'

import { m } from '#/paraglide/messages'
import { overwriteGetLocale } from '#/paraglide/runtime'

import {
  TOWN_TIME_ZONE,
  formatNumber,
  formatTownDate,
  localized,
  townDay,
} from './i18n'

afterEach(() => {
  overwriteGetLocale(() => 'pt-BR')
})

const TEXT = { 'pt-BR': 'Olá', es: 'Hola', en: 'Hello' }

describe('localized', () => {
  it('reads the text of the current language', () => {
    overwriteGetLocale(() => 'es')
    expect(localized(TEXT)).toBe('Hola')

    overwriteGetLocale(() => 'en')
    expect(localized(TEXT)).toBe('Hello')
  })
})

describe('formatNumber', () => {
  it('follows the separator of the language', () => {
    overwriteGetLocale(() => 'pt-BR')
    expect(formatNumber(1234.5)).toBe('1.234,5')

    overwriteGetLocale(() => 'en')
    expect(formatNumber(1234.5)).toBe('1,234.5')
  })
})

describe('town clock', () => {
  it('is the Manaus time zone', () => {
    expect(TOWN_TIME_ZONE).toBe('America/Manaus')
  })

  it('shows an instant at UTC-4, not in UTC', () => {
    // 02:30Z on Jan 1st is still Dec 31st at 22:30 in Manaus.
    expect(
      formatTownDate('2027-01-01T02:30:00Z', {
        day: '2-digit',
        month: '2-digit',
      }),
    ).toBe('31/12')
  })

  it('reads a bare day on the town clock', () => {
    expect(townDay('2026-12-31').offset).toBe(-240)
  })
})

describe('counter messages', () => {
  it('uses the exact phrase for 0 and 1, and the plural otherwise', () => {
    expect(m.panel_table_total({ total: 0 }, { locale: 'pt-BR' })).toBe(
      'Nenhum registro',
    )
    expect(m.panel_table_total({ total: 1 }, { locale: 'pt-BR' })).toBe(
      '1 registro',
    )
    expect(m.panel_table_total({ total: 1000 }, { locale: 'pt-BR' })).toBe(
      '1.000 registros',
    )
    expect(m.map_list_title({ count: 0 }, { locale: 'en' })).toBe(
      'No occurrences',
    )
    expect(m.map_list_title({ count: 1 }, { locale: 'es' })).toBe(
      '1 ocurrencia',
    )
    expect(m.map_list_title({ count: 12 }, { locale: 'en' })).toBe(
      '12 occurrences',
    )
  })
})
