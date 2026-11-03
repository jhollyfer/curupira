import type { Either } from '@curupira/shared'

/** The right side of the result; a `left` in the arrangement or the assertion fails the test. */
export function rightOf<L, R>(result: Either<L, R>): R {
  if (result.isLeft())
    throw new Error(`expected right, got left: ${JSON.stringify(result.value)}`)

  return result.value
}

/** The left side of the result; a `right` fails the test. */
export function leftOf<L, R>(result: Either<L, R>): L {
  if (result.isRight())
    throw new Error(`expected left, got right: ${JSON.stringify(result.value)}`)

  return result.value
}
