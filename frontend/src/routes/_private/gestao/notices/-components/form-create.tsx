import { ManagementNoticeCreateValidator } from '@curupira/shared'
import type { ManagementNoticeShowResponse } from '@curupira/shared'
import type * as React from 'react'

import {
  FormShell,
  FormShellActions,
  FormShellBack,
  FormShellContent,
  FormShellDiscard,
  FormShellHeader,
  FormShellSubmit,
  FormShellTitle,
} from '#/components/common/form-shell'
import { Card, CardContent } from '#/components/ui/card'
import { DEPENDENTS, queryKeys } from '#/hooks/tanstack-query/_query-keys'
import { useResourceForm } from '#/hooks/use-resource-form'
import { useManagementNoticeCreateMutation } from '#/integrations/tanstack-query/mutations/management'
import { localInputToInstant } from '#/lib/datetime-field'
import { townNow } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

import { NOTICE_FIELDS, NoticeFormFields } from './form-fields'
import type { NoticeFormValues } from './form-fields'

export function NoticeFormCreate(): React.JSX.Element {
  const { form, onSubmit, shell } = useResourceForm<
    NoticeFormValues,
    ManagementNoticeShowResponse,
    NoticeFormValues
  >({
    formId: 'notice-create',
    validator: ManagementNoticeCreateValidator,
    // Starts now by default: the common case is "publish this today", and a manager who
    // wants to schedule edits one field. The clock is read when the form opens.
    defaults: {
      title: '',
      body: '',
      startsAt:
        localInputToInstant(townNow().toFormat("yyyy-LL-dd'T'HH:mm")) ?? '',
      endsAt: null,
    },
    fields: NOTICE_FIELDS,
    mutation: useManagementNoticeCreateMutation,
    invalidate: queryKeys.management.notices.all,
    alsoInvalidate: DEPENDENTS.notices,
    backTo: '/gestao/notices',
    success: (created) => m.panel_notices_saved({ title: created.title }),
    // A create is only safe to resend where the use case refuses duplicates with 409;
    // notices insert directly, so a retry after a 5xx could publish twice.
    payload: (values) => values,
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>{m.panel_notices_new()}</FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>

      <FormShellContent onSubmit={onSubmit}>
        <Card className="max-w-3xl">
          <CardContent>
            <NoticeFormFields form={form} idPrefix="notice-create" />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
