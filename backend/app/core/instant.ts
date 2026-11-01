/**
 * The ISO 8601 strings the validators let through, turned into `Date` at the edge of the
 * use case. The validators already guaranteed the format, so `new Date()` never yields an
 * invalid date here.
 *
 * Three states are kept apart on purpose, because an update payload needs them: absent
 * (`undefined`, leave alone), explicit `null` (erase) and a value.
 */
export class Instant {
  static parse(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined
    if (value === null) return null

    return new Date(value)
  }

  /** For a field that cannot be erased: absent stays absent. */
  static optional(value: string | undefined): Date | undefined {
    if (value === undefined) return undefined

    return new Date(value)
  }
}
