/**
 * The report protocol generator contract (_standards/solid.md §2): randomness is an
 * external effect, so the use case depends on this and the unit test passes a fixed one.
 * The concrete one is `ProtocolService`, bound in `providers/storage.provider.ts`.
 */
export abstract class ProtocolContract {
  /** A new `CUR-XXXX-XXXX` code. Uniqueness is the database's job, not this method's. */
  abstract next(): string
}
