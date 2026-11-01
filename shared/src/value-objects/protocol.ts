/**
 * The protocol a resident gets on sending a report and uses to follow it without
 * signing in. The code is the only key to the status page, so it is not a sequence:
 * 8 characters of a 32-symbol alphabet is 2^40 combinations, and the lookup is
 * throttled per IP.
 *
 * The alphabet leaves out `I`, `L`, `O` and `U` (Crockford): it is read aloud and
 * typed on a phone by someone unfamiliar with apps, and `0`/`O` is the typo that
 * costs a lookup.
 */
export const PROTOCOL_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const PROTOCOL_PREFIX = 'CUR'

const GROUP = 4

/** `CUR-XXXX-XXXX`, the shape shown to the resident. */
export const PROTOCOL_PATTERN = /^CUR-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/

/**
 * What the resident typed, brought to the canonical shape: case, spaces, hyphens and
 * the look-alike letters (`O` as `0`, `I` and `L` as `1`) are forgiven. Returns the
 * input untouched, uppercased, when it does not fit, so the validator can say why.
 */
export function normalizeProtocol(input: string): string {
  const compact = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/^CUR/, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')

  if (compact.length !== GROUP * 2) {
    return input.toUpperCase().trim()
  }

  return `${PROTOCOL_PREFIX}-${compact.slice(0, GROUP)}-${compact.slice(GROUP)}`
}

/** The canonical protocol from the 8 raw symbols the server draws. */
export function formatProtocol(symbols: string): string {
  return `${PROTOCOL_PREFIX}-${symbols.slice(0, GROUP)}-${symbols.slice(GROUP)}`
}
