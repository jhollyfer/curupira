import type { ManagementNoticeCreatePayload } from '@curupira/shared'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { FieldDescription, FieldGroup } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { AppField } from '#/integrations/react-hook-form/app-field'
import { instantToLocalInput, localInputToInstant } from '#/lib/datetime-field'
import { m } from '#/paraglide/messages'

export type NoticeFormValues = ManagementNoticeCreatePayload

export const NOTICE_FIELDS = ['title', 'body', 'startsAt', 'endsAt'] as const

export const NOTICE_BODY_MAX = 600

type NoticeFormFieldsProps = Readonly<{
  form: UseFormReturn<NoticeFormValues>
  idPrefix: string
}>

/**
 * The notice's fields, shared by create and edit.
 *
 * The date controls keep the **ISO instant** in the form (that is what the shared
 * validator and the API take) and only *display* the town's wall clock: the conversion
 * lives in `lib/datetime-field.ts` and runs on each change. Keeping the browser's
 * zone-less text in the form instead would send "08:00" meaning the manager's laptop
 * zone, not Benjamin Constant's.
 */
export function NoticeFormFields({
  form,
  idPrefix,
}: NoticeFormFieldsProps): React.JSX.Element {
  return (
    <FieldGroup>
      <AppField
        control={form.control}
        name="title"
        id={idPrefix.concat('-title')}
        label={m.panel_notices_field_title()}
      >
        {({ field, control }) => (
          <Input
            {...field}
            {...control}
            maxLength={120}
            className="h-10 text-sm"
          />
        )}
      </AppField>

      <AppField
        control={form.control}
        name="body"
        id={idPrefix.concat('-body')}
        label={m.panel_notices_field_body()}
      >
        {({ field, control }) => (
          <>
            <Textarea
              {...field}
              {...control}
              rows={4}
              maxLength={NOTICE_BODY_MAX}
              className="min-h-24 text-sm"
            />
            <FieldDescription>
              {m.panel_notices_field_body_hint({
                count: field.value.length,
                max: NOTICE_BODY_MAX,
              })}
            </FieldDescription>
          </>
        )}
      </AppField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AppField
          control={form.control}
          name="startsAt"
          id={idPrefix.concat('-starts')}
          label={m.panel_notices_field_starts()}
        >
          {({ field, control }) => (
            <>
              <Input
                {...control}
                type="datetime-local"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={instantToLocalInput(field.value)}
                onChange={(event) =>
                  field.onChange(localInputToInstant(event.target.value) ?? '')
                }
                className="h-10 text-sm"
              />
              <FieldDescription>
                {m.panel_notices_field_starts_hint()}
              </FieldDescription>
            </>
          )}
        </AppField>

        <AppField
          control={form.control}
          name="endsAt"
          id={idPrefix.concat('-ends')}
          label={m.panel_notices_field_ends()}
        >
          {({ field, control }) => (
            <>
              <Input
                {...control}
                type="datetime-local"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={instantToLocalInput(field.value ?? '')}
                onChange={(event) =>
                  field.onChange(
                    localInputToInstant(event.target.value) ?? null,
                  )
                }
                className="h-10 text-sm"
              />
              <FieldDescription>
                {m.panel_notices_field_ends_hint()}
              </FieldDescription>
            </>
          )}
        </AppField>
      </div>
    </FieldGroup>
  )
}
