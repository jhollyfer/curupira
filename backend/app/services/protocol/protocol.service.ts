import { randomInt } from 'node:crypto'

import { PROTOCOL_ALPHABET, formatProtocol } from '@curupira/shared'

import { ProtocolContract } from '#services/protocol/protocol.contract'

/**
 * Draws 8 symbols of the 32-letter alphabet with `crypto.randomInt`: 2^40 combinations,
 * from the OS CSPRNG. `Math.random` is not enough here, because the protocol is the only
 * key to the status page and a predictable generator would let a stranger walk it.
 */
export default class ProtocolService extends ProtocolContract {
  private static readonly LENGTH = 8

  next(): string {
    let symbols = ''
    for (let index = 0; index < ProtocolService.LENGTH; index++)
      symbols += PROTOCOL_ALPHABET[randomInt(PROTOCOL_ALPHABET.length)]

    return formatProtocol(symbols)
  }
}
