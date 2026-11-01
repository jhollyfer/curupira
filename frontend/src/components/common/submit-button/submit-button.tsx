import type { Merge } from '@curupira/shared'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'

type SubmitButtonProps = Readonly<
  Merge<
    Omit<React.ComponentProps<typeof Button>, 'isPending' | 'children'>,
    {
      /** Is the mutation in flight? Shows the spinner and locks the button. */
      isPending?: boolean
      children: React.ReactNode
    }
  >
>

/**
 * The submit button of every form: locks itself and shows the spinner while the
 * mutation is in flight. The lock is not a guard against a double send (the network
 * is slower than a double tap, and the server must be idempotent anyway); it is the
 * feedback that the tap was heard.
 *
 * The panel's image upload will need to lock it too while a file is still going up:
 * bring `uploading-context` from the interclasse kit when the first upload field
 * lands, and read it here.
 */
export function SubmitButton({
  isPending,
  disabled,
  children,
  ...props
}: SubmitButtonProps): React.JSX.Element {
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      {...props}
    >
      {isPending && <Spinner className="size-4" />}
      {children}
    </Button>
  )
}
