import { Slug, left, right, type Either } from '@curupira/shared'

import type { NeighborhoodError } from './neighborhood.errors.ts'

export type NeighborhoodProps = {
  readonly id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
  readonly createdAt: Date
  updatedAt: Date | null
}

type NeighborhoodChanges = {
  readonly name?: string
  readonly latitude?: number | null
  readonly longitude?: number | null
}

/**
 * A neighborhood of the city: the unit residents pick to read the collection schedule and
 * the one a report is filed under (`_standards/domain.md` §1). The optional center is what
 * lets a report be matched to the nearest neighborhood.
 */
export class Neighborhood {
  private constructor(private readonly props: NeighborhoodProps) {}

  /** Birth. The id and the clock come from outside: the domain does no I/O. */
  static create(input: {
    readonly id: string
    readonly name: string
    readonly latitude?: number | null
    readonly longitude?: number | null
    readonly now: Date
  }): Either<NeighborhoodError, Neighborhood> {
    const latitude = input.latitude ?? null
    const longitude = input.longitude ?? null
    if ((latitude === null) !== (longitude === null))
      return left({ code: 'NEIGHBORHOOD_CENTER_INCOMPLETE' })

    return right(
      new Neighborhood({
        id: input.id,
        name: input.name,
        slug: Slug.from(input.name).value,
        latitude,
        longitude,
        createdAt: input.now,
        // Born with the edit stamped, the way the row is born: `updated_at` is filled on insert.
        updatedAt: input.now,
      }),
    )
  }

  /** Rehydration by the repository: the data passed through the invariants when it was saved. */
  static restore(props: NeighborhoodProps): Neighborhood {
    return new Neighborhood({ ...props })
  }

  /** Absent field means "leave alone"; `null` on a coordinate erases the center. */
  update(changes: NeighborhoodChanges, now: Date): Either<NeighborhoodError, Neighborhood> {
    const latitude = changes.latitude === undefined ? this.props.latitude : changes.latitude
    const longitude = changes.longitude === undefined ? this.props.longitude : changes.longitude
    if ((latitude === null) !== (longitude === null))
      return left({ code: 'NEIGHBORHOOD_CENTER_INCOMPLETE' })

    if (changes.name !== undefined && changes.name !== this.props.name) {
      this.props.name = changes.name
      this.props.slug = Slug.from(changes.name).value
    }
    this.props.latitude = latitude
    this.props.longitude = longitude
    this.props.updatedAt = now

    return right(this)
  }

  /** Whether the name changes: only then is it worth checking for duplicates. */
  renamesTo(name: string | undefined): name is string {
    return name !== undefined && name !== this.props.name
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<NeighborhoodProps> {
    return { ...this.props }
  }
}
