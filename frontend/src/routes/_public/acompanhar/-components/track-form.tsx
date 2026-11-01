import { PROTOCOL_PREFIX } from '@curupira/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useNavigate } from '@tanstack/react-router'
import type * as React from 'react'
import { Controller, useForm } from 'react-hook-form'

import { SubmitButton } from '#/components/common/submit-button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { errorId, invalidProps } from '#/lib/form-a11y'
import { m } from '#/paraglide/messages'

import { TrackFormValidator } from '../-schema'
import type { TrackFormInput, TrackFormOutput } from '../-schema'

type TrackFormProps = Readonly<{
  defaultProtocol: string
}>

/** The code field: it moves the protocol into the URL, where the loader reads it. */
export function TrackForm({
  defaultProtocol,
}: TrackFormProps): React.JSX.Element {
  const navigate = useNavigate({ from: '/acompanhar/' })
  const form = useForm<TrackFormInput, unknown, TrackFormOutput>({
    resolver: zodResolver(TrackFormValidator),
    mode: 'onTouched',
    defaultValues: { protocol: defaultProtocol },
  })

  async function onValid(values: TrackFormOutput): Promise<void> {
    await navigate({ search: { protocol: values.protocol } })
  }

  function onSubmit(event?: React.BaseSyntheticEvent): void {
    void form.handleSubmit(onValid)(event)
  }

  return (
    <form
      method="get"
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      <Controller
        name="protocol"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              htmlFor="track-protocol"
              className="text-base font-semibold"
            >
              {m.track_label()}
            </FieldLabel>
            <Input
              {...field}
              {...invalidProps(fieldState.invalid, 'track-protocol')}
              id="track-protocol"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              placeholder={`${PROTOCOL_PREFIX}-XXXX-XXXX`}
              className="h-14 text-xl font-bold tracking-wider uppercase"
            />
            <FieldDescription>{m.track_hint()}</FieldDescription>
            {fieldState.invalid && (
              <FieldError id={errorId('track-protocol')}>
                {m.track_invalid()}
              </FieldError>
            )}
          </Field>
        )}
      />
      <SubmitButton size="touch-lg" isPending={form.formState.isSubmitting}>
        <MagnifyingGlassIcon aria-hidden="true" weight="bold" />
        {m.track_submit()}
      </SubmitButton>
    </form>
  )
}
