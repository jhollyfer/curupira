import { ManagementNeighborhoodCreateValidator } from '@curupira/shared'
import type { ManagementNeighborhoodShowResponse } from '@curupira/shared'
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
import { useManagementNeighborhoodCreateMutation } from '#/integrations/tanstack-query/mutations/management'
import { m } from '#/paraglide/messages'

import { NEIGHBORHOOD_FIELDS, NeighborhoodFormFields } from './form-fields'
import type { NeighborhoodFormValues } from './form-fields'

export function NeighborhoodFormCreate(): React.JSX.Element {
  const { form, onSubmit, shell } = useResourceForm<
    NeighborhoodFormValues,
    ManagementNeighborhoodShowResponse,
    NeighborhoodFormValues
  >({
    formId: 'neighborhood-create',
    validator: ManagementNeighborhoodCreateValidator,
    defaults: { name: '', latitude: null, longitude: null },
    fields: NEIGHBORHOOD_FIELDS,
    mutation: useManagementNeighborhoodCreateMutation,
    invalidate: queryKeys.management.neighborhoods.all,
    alsoInvalidate: DEPENDENTS.neighborhoods,
    backTo: '/management/neighborhoods',
    success: (created) => m.panel_neighborhoods_saved({ name: created.name }),
    // The use case refuses a repeated name with 409 before inserting, so a resend after
    // a 5xx cannot create a second neighborhood: the retry is safe here.
    retry: 'neighborhood-create-error',
    payload: (values) => values,
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>{m.panel_neighborhoods_new()}</FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>

      <FormShellContent onSubmit={onSubmit}>
        <Card className="max-w-3xl">
          <CardContent>
            <NeighborhoodFormFields
              form={form}
              idPrefix="neighborhood-create"
            />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
