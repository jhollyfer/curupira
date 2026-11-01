/**
 * Stable ids for the example records. The shared contract types ids as UUIDs
 * (`z.uuid()`), so the examples carry well-formed ones: `kind` separates the families
 * (neighborhoods, passes, reports, notices) and `n` numbers inside a family.
 */
export function exampleUuid(kind: string, n: number): string {
  return `00000000-0000-4000-8000-${kind}${String(n).padStart(12 - kind.length, '0')}`
}
