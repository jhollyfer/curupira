import {
  COLLECTION_SHIFTS,
  NOTICE_STATUSES,
  REPORT_KINDS,
  REPORT_STATUSES,
  WASTE_TYPES,
} from '@curupira/shared'
import { afterEach, describe, expect, it } from 'vitest'

import { overwriteGetLocale } from '#/paraglide/runtime'

import {
  COLLECTION_SHIFT_LABELS,
  NOTICE_STATUS_LABELS,
  REPORT_KIND_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_VARIANTS,
  WASTE_TYPE_CLASSES,
  WASTE_TYPE_LABELS,
} from './labels'

afterEach(() => {
  overwriteGetLocale(() => 'pt-BR')
})

describe('labels', () => {
  it('covers every enum value with a non-empty text in each language', () => {
    for (const locale of ['pt-BR', 'es', 'en'] as const) {
      overwriteGetLocale(() => locale)

      for (const type of WASTE_TYPES)
        expect(WASTE_TYPE_LABELS[type]()).not.toBe('')
      for (const kind of REPORT_KINDS)
        expect(REPORT_KIND_LABELS[kind]()).not.toBe('')
      for (const status of REPORT_STATUSES)
        expect(REPORT_STATUS_LABELS[status]()).not.toBe('')
      for (const shift of COLLECTION_SHIFTS)
        expect(COLLECTION_SHIFT_LABELS[shift]()).not.toBe('')
      for (const status of NOTICE_STATUSES)
        expect(NOTICE_STATUS_LABELS[status]()).not.toBe('')
    }
  })

  it('answers in the language of the moment', () => {
    overwriteGetLocale(() => 'en')
    expect(WASTE_TYPE_LABELS.RECYCLABLE()).toBe('Recyclables')

    overwriteGetLocale(() => 'es')
    expect(WASTE_TYPE_LABELS.RECYCLABLE()).toBe('Reciclables')
  })

  it('gives each waste type its own fixed color class', () => {
    const classes = WASTE_TYPES.map((type) => WASTE_TYPE_CLASSES[type])

    expect(new Set(classes).size).toBe(WASTE_TYPES.length)
  })

  it('never uses the alert variant for a report status', () => {
    for (const status of REPORT_STATUSES)
      expect(REPORT_STATUS_VARIANTS[status]).not.toBe('destructive')
  })
})
