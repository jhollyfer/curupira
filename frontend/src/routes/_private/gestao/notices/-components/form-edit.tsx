import { ManagementNoticeCreateValidator } from '@curupira/shared'
import type { ManagementNoticeShowResponse } from '@curupira/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
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
import { useManagementNoticeUpdateMutation } from '#/integrations/tanstack-query/mutations/management'
import type { NoticeUpdateVariables } from '#/integrations/tanstack-query/mutations/management'
import { managementNoticeQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { NOTICE_FIELDS, NoticeFormFields } from './form-fields'
import type { NoticeFormValues } from './form-fields'

const route = getRouteApi('/_private/gestao/notices/$id/edit')

export function NoticeFormEdit(): React.JSX.Element {
  const { id } = route.useParams()
  const { data: notice } = useSuspenseQuery(managementNoticeQueryOptions(id))

  const { form, onSubmit, shell } = useResourceForm<
    NoticeFormValues,
    ManagementNoticeShowResponse,
    NoticeUpdateVariables
  >({
    formId: 'notice-update',
    validator: ManagementNoticeCreateValidator,
    values: {
      title: notice.title,
      body: notice.body,
      startsAt: notice.startsAt,
      endsAt: notice.endsAt,
    },
    fields: NOTICE_FIELDS,
    mutation: useManagementNoticeUpdateMutation,
    invalidate: queryKeys.management.notices.all,
    alsoInvalidate: DEPENDENTS.notices,
    backTo: '/gestao/notices',
    success: (updated) => m.panel_notices_saved({ title: updated.title }),
    // An edit always can be resent: the PUT carries the id and writes the same state.
    retry: 'notice-update-error',
    payload: (values) => ({ ...values, id }),
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>
          {m.panel_notices_edit_named({ title: notice.title })}
        </FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>

      <FormShellContent onSubmit={onSubmit}>
        <Card className="max-w-3xl">
          <CardContent>
            <NoticeFormFields form={form} idPrefix="notice-update" />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
