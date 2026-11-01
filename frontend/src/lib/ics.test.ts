import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import { buildIcs, escapeIcsText, foldIcsLine } from './ics'
import type { CollectionPass } from './schedule'

const ZONE = 'America/Manaus'

const PASS: CollectionPass = {
  id: '00000000-0000-4000-8000-000000000001',
  neighborhoodId: '00000000-0000-4000-8000-0000000000aa',
  wasteType: 'ORGANIC',
  weekday: 'MONDAY',
  shift: 'MORNING',
  note: 'Deixe o saco na calçada, até as 6h',
}

function build(from: string, passes: ReadonlyArray<CollectionPass> = [PASS]) {
  return buildIcs({
    neighborhoodName: 'Umariaçu',
    passes,
    from: DateTime.fromISO(from, { zone: ZONE }),
    now: DateTime.fromISO('2026-11-01T12:00:00Z'),
    summary: () => 'Coleta: lixo orgânico',
    calendarName: 'Coleta em Umariaçu',
  })
}

describe('escapeIcsText', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })
})

describe('foldIcsLine', () => {
  it('leaves a short line alone', () => {
    expect(foldIcsLine('SUMMARY:ok')).toBe('SUMMARY:ok')
  })

  it('folds at 75 octets and continues with one space', () => {
    const folded = foldIcsLine(`X:${'a'.repeat(200)}`)
    const parts = folded.split('\r\n')

    expect(parts[0]).toHaveLength(75)
    expect(parts.slice(1).every((part) => part.startsWith(' '))).toBe(true)
    expect(parts.slice(1).every((part) => part.length <= 75)).toBe(true)
    expect(folded.replaceAll('\r\n ', '')).toBe(`X:${'a'.repeat(200)}`)
  })

  it('never splits a multi-byte character', () => {
    const folded = foldIcsLine(`X:${'ç'.repeat(80)}`)

    expect(folded.replaceAll('\r\n ', '')).toBe(`X:${'ç'.repeat(80)}`)
    for (const part of folded.split('\r\n')) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
    }
  })
})

describe('buildIcs', () => {
  it('is a calendar with CRLF endings', () => {
    const ics = build('2026-11-01T10:00')

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('writes the Manaus morning as UTC (UTC-4 means +4h)', () => {
    // Sunday 2026-11-01 -> first Monday is 2026-11-02; 06:00 Manaus is 10:00Z.
    const ics = build('2026-11-01T10:00')

    expect(ics).toContain('DTSTART:20261102T100000Z')
    expect(ics).toContain('DTEND:20261102T160000Z')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('rolls over to the next year when the weekday is after Dec 31st', () => {
    // Thursday Dec 31st 2026: the next Monday is Jan 4th 2027.
    const ics = build('2026-12-31T09:00')

    expect(ics).toContain('DTSTART:20270104T100000Z')
  })

  it('moves the date forward when the night shift ends after 20:00 Manaus', () => {
    // 19:00 Manaus is 23:00Z (same day); the night end 23:00 is 03:00Z of the next.
    const night: CollectionPass = {
      ...PASS,
      shift: 'NIGHT',
      weekday: 'SATURDAY',
    }
    const ics = build('2026-11-01T10:00', [night])

    expect(ics).toContain('DTSTART:20261107T230000Z')
    expect(ics).toContain('DTEND:20261108T030000Z')
  })

  it('stamps with the injected clock and keeps the stable uid', () => {
    const ics = build('2026-11-01T10:00')

    expect(ics).toContain('DTSTAMP:20261101T120000Z')
    expect(ics).toContain(`UID:${PASS.id}@curupira`)
  })

  it('escapes the note and the location', () => {
    const ics = build('2026-11-01T10:00')

    expect(ics).toContain('DESCRIPTION:Deixe o saco na calçada\\, até as 6h')
    expect(ics).toContain('LOCATION:Umariaçu')
  })
})
