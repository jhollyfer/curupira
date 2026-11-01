import {
  AccountProfileShowResponse,
  ManagementNeighborhoodShowResponse,
  ManagementNoticeShowResponse,
  ManagementReportShowResponse,
  ManagementScheduleShowResponse,
  ManagementUserShowResponse,
} from '@curupira/shared'
import type {
  AccountProfileUpdatePayload,
  ManagementNeighborhoodCreatePayload,
  ManagementNeighborhoodUpdatePayload,
  ManagementNoticeCreatePayload,
  ManagementNoticeUpdatePayload,
  ManagementReportUpdateStatusPayload,
  ManagementScheduleCreatePayload,
  ManagementScheduleUpdatePayload,
  ManagementUserCreatePayload,
  ManagementUserUpdatePayload,
  Merge,
} from '@curupira/shared'
import { useMutation } from '@tanstack/react-query'

import {
  createNeighborhood,
  deleteNeighborhood,
  updateNeighborhood,
} from '#/data/management/neighborhoods'
import {
  closeNotice,
  createNotice,
  deleteNotice,
  updateNotice,
} from '#/data/management/notices'
import { updateReportStatus } from '#/data/management/reports'
import {
  createSchedule,
  deleteSchedule,
  updateSchedule,
} from '#/data/management/schedules'
import { createUser, deleteUser, updateUser } from '#/data/management/users'
import type { MutationProps } from '#/hooks/tanstack-query/_mutation-props'

import { request, send } from '../http'
import type { HTTPError } from '../http'
import { mockProfile } from '../mock-session'
import { fromSource } from '../source'

/**
 * The panel's writes (`/management/*`). The `api` bodies are the routes in
 * `backend/start/routes.ts`; the payloads are the `*Payload` types of the shared
 * validators, so the form, the mock and the request are checked against one contract.
 *
 * Updates carry the `id` next to the body (`Merge<Payload, { id }>`), so a mutation hook
 * can be handed to `useMutationForm`/`useResourceForm` as-is: the form builds the
 * variables, and the `id` is stripped here before the body goes out.
 *
 * The mock bodies run the same refusals the API does (409 on a duplicate, 422 on a
 * status regression), so the screens' error handling is exercised in development.
 */
type WithId<TPayload> = Merge<TPayload, { id: string }>

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) }
}

export type ReportStatusVariables = WithId<ManagementReportUpdateStatusPayload>

export function useManagementReportStatusMutation(
  options?: MutationProps<ManagementReportShowResponse, ReportStatusVariables>,
) {
  return useMutation<
    ManagementReportShowResponse,
    HTTPError,
    ReportStatusVariables
  >({
    ...options,
    mutationFn: ({ id, ...body }) =>
      fromSource<ManagementReportShowResponse>({
        mock: () => updateReportStatus(id, body),
        api: () =>
          request(
            `/management/reports/${encodeURIComponent(id)}/status`,
            ManagementReportShowResponse,
            { method: 'PATCH', ...json(body) },
          ),
      }),
  })
}

export function useManagementNoticeCreateMutation(
  options?: MutationProps<
    ManagementNoticeShowResponse,
    ManagementNoticeCreatePayload
  >,
) {
  return useMutation<
    ManagementNoticeShowResponse,
    HTTPError,
    ManagementNoticeCreatePayload
  >({
    ...options,
    mutationFn: (body) =>
      fromSource<ManagementNoticeShowResponse>({
        mock: () => createNotice(body),
        api: () =>
          request('/management/notices', ManagementNoticeShowResponse, {
            method: 'POST',
            ...json(body),
          }),
      }),
  })
}

export type NoticeUpdateVariables = WithId<ManagementNoticeUpdatePayload>

export function useManagementNoticeUpdateMutation(
  options?: MutationProps<ManagementNoticeShowResponse, NoticeUpdateVariables>,
) {
  return useMutation<
    ManagementNoticeShowResponse,
    HTTPError,
    NoticeUpdateVariables
  >({
    ...options,
    mutationFn: ({ id, ...body }) =>
      fromSource<ManagementNoticeShowResponse>({
        mock: () => updateNotice(id, body),
        api: () =>
          request(
            `/management/notices/${encodeURIComponent(id)}`,
            ManagementNoticeShowResponse,
            { method: 'PUT', ...json(body) },
          ),
      }),
  })
}

export function useManagementNoticeCloseMutation(
  options?: MutationProps<ManagementNoticeShowResponse, string>,
) {
  return useMutation<ManagementNoticeShowResponse, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      fromSource<ManagementNoticeShowResponse>({
        mock: () => closeNotice(id),
        api: () =>
          request(
            `/management/notices/${encodeURIComponent(id)}/close`,
            ManagementNoticeShowResponse,
            { method: 'PATCH' },
          ),
      }),
  })
}

export function useManagementNoticeDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      fromSource<void>({
        mock: () => deleteNotice(id),
        api: () =>
          send(`/management/notices/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }),
      }),
  })
}

export function useManagementNeighborhoodCreateMutation(
  options?: MutationProps<
    ManagementNeighborhoodShowResponse,
    ManagementNeighborhoodCreatePayload
  >,
) {
  return useMutation<
    ManagementNeighborhoodShowResponse,
    HTTPError,
    ManagementNeighborhoodCreatePayload
  >({
    ...options,
    mutationFn: (body) =>
      fromSource<ManagementNeighborhoodShowResponse>({
        mock: () => createNeighborhood(body),
        api: () =>
          request(
            '/management/neighborhoods',
            ManagementNeighborhoodShowResponse,
            { method: 'POST', ...json(body) },
          ),
      }),
  })
}

export type NeighborhoodUpdateVariables =
  WithId<ManagementNeighborhoodUpdatePayload>

export function useManagementNeighborhoodUpdateMutation(
  options?: MutationProps<
    ManagementNeighborhoodShowResponse,
    NeighborhoodUpdateVariables
  >,
) {
  return useMutation<
    ManagementNeighborhoodShowResponse,
    HTTPError,
    NeighborhoodUpdateVariables
  >({
    ...options,
    mutationFn: ({ id, ...body }) =>
      fromSource<ManagementNeighborhoodShowResponse>({
        mock: () => updateNeighborhood(id, body),
        api: () =>
          request(
            `/management/neighborhoods/${encodeURIComponent(id)}`,
            ManagementNeighborhoodShowResponse,
            { method: 'PUT', ...json(body) },
          ),
      }),
  })
}

export function useManagementNeighborhoodDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      fromSource<void>({
        mock: () => deleteNeighborhood(id),
        api: () =>
          send(`/management/neighborhoods/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }),
      }),
  })
}

export function useManagementScheduleCreateMutation(
  options?: MutationProps<
    ManagementScheduleShowResponse,
    ManagementScheduleCreatePayload
  >,
) {
  return useMutation<
    ManagementScheduleShowResponse,
    HTTPError,
    ManagementScheduleCreatePayload
  >({
    ...options,
    mutationFn: (body) =>
      fromSource<ManagementScheduleShowResponse>({
        mock: () => createSchedule(body),
        api: () =>
          request('/management/schedules', ManagementScheduleShowResponse, {
            method: 'POST',
            ...json(body),
          }),
      }),
  })
}

export type ScheduleUpdateVariables = WithId<ManagementScheduleUpdatePayload>

export function useManagementScheduleUpdateMutation(
  options?: MutationProps<
    ManagementScheduleShowResponse,
    ScheduleUpdateVariables
  >,
) {
  return useMutation<
    ManagementScheduleShowResponse,
    HTTPError,
    ScheduleUpdateVariables
  >({
    ...options,
    mutationFn: ({ id, ...body }) =>
      fromSource<ManagementScheduleShowResponse>({
        mock: () => updateSchedule(id, body),
        api: () =>
          request(
            `/management/schedules/${encodeURIComponent(id)}`,
            ManagementScheduleShowResponse,
            { method: 'PUT', ...json(body) },
          ),
      }),
  })
}

export function useManagementScheduleDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      fromSource<void>({
        mock: () => deleteSchedule(id),
        api: () =>
          send(`/management/schedules/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }),
      }),
  })
}

export function useManagementUserCreateMutation(
  options?: MutationProps<
    ManagementUserShowResponse,
    ManagementUserCreatePayload
  >,
) {
  return useMutation<
    ManagementUserShowResponse,
    HTTPError,
    ManagementUserCreatePayload
  >({
    ...options,
    mutationFn: (body) =>
      fromSource<ManagementUserShowResponse>({
        mock: () => createUser(body),
        api: () =>
          request('/management/users', ManagementUserShowResponse, {
            method: 'POST',
            ...json(body),
          }),
      }),
  })
}

export type UserUpdateVariables = WithId<ManagementUserUpdatePayload>

export function useManagementUserUpdateMutation(
  options?: MutationProps<ManagementUserShowResponse, UserUpdateVariables>,
) {
  return useMutation<
    ManagementUserShowResponse,
    HTTPError,
    UserUpdateVariables
  >({
    ...options,
    mutationFn: ({ id, ...body }) =>
      fromSource<ManagementUserShowResponse>({
        mock: () => updateUser(id, body),
        api: () =>
          request(
            `/management/users/${encodeURIComponent(id)}`,
            ManagementUserShowResponse,
            { method: 'PUT', ...json(body) },
          ),
      }),
  })
}

export function useManagementUserDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      fromSource<void>({
        mock: () => deleteUser(id),
        api: () =>
          send(`/management/users/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }),
      }),
  })
}

/**
 * `PUT /account`: the signed-in user edits their own profile. The mock applies name and
 * e-mail through the same store as the user list, so the header shows the new name.
 */
export function useAccountProfileUpdateMutation(
  options?: MutationProps<
    AccountProfileShowResponse,
    AccountProfileUpdatePayload
  >,
) {
  return useMutation<
    AccountProfileShowResponse,
    HTTPError,
    AccountProfileUpdatePayload
  >({
    ...options,
    mutationFn: (body) =>
      fromSource<AccountProfileShowResponse>({
        mock: () => {
          const current = mockProfile()

          return updateUser(current.id, {
            name: body.name,
            email: body.email,
          })
        },
        api: () =>
          request('/account', AccountProfileShowResponse, {
            method: 'PUT',
            ...json(body),
          }),
      }),
  })
}
