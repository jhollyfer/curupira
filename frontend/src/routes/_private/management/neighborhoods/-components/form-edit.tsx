import { ManagementNeighborhoodCreateValidator } from '@curupira/shared'
import type { ManagementNeighborhoodShowResponse } from '@curupira/shared'
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
import { useManagementNeighborhoodUpdateMutation } from '#/integrations/tanstack-query/mutations/management'
import type { NeighborhoodUpdateVariables } from '#/integrations/tanstack-query/mutations/management'
import { managementNeighborhoodQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { m } from '#/paraglide/messages'

import { NEIGHBORHOOD_FIELDS, NeighborhoodFormFields } from './form-fields'
import type { NeighborhoodFormValues } from './form-fields'

const route = getRouteApi('/_private/management/neighborhoods/$id/edit')

export function NeighborhoodFormEdit(): React.JSX.Element {
  const { id } = route.useParams()
  const { data: neighborhood } = useSuspenseQuery(
    managementNeighborhoodQueryOptions(id),
  )

  const { form, onSubmit, shell } = useResourceForm<
    NeighborhoodFormValues,
    ManagementNeighborhoodShowResponse,
    NeighborhoodUpdateVariables
  >({
    formId: 'neighborhood-update',
    validator: ManagementNeighborhoodCreateValidator,
    values: {
      name: neighborhood.name,
      latitude: neighborhood.latitude,
      longitude: neighborhood.longitude,
    },
    fields: NEIGHBORHOOD_FIELDS,
    mutation: useManagementNeighborhoodUpdateMutation,
    invalidate: queryKeys.management.neighborhoods.all,
    alsoInvalidate: DEPENDENTS.neighborhoods,
    backTo: '/management/neighborhoods',
    success: (updated) => m.panel_neighborhoods_saved({ name: updated.name }),
    retry: 'neighborhood-update-error',
    payload: (values) => ({ ...values, id }),
  })

  return (
    <FormShell {...shell}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>
          {m.panel_neighborhoods_edit_named({ name: neighborhood.name })}
        </FormShellTitle>
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
              idPrefix="neighborhood-update"
            />
          </CardContent>
        </Card>
      </FormShellContent>
    </FormShell>
  )
}
