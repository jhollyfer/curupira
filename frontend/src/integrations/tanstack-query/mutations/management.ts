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

import type { MutationProps } from '#/hooks/tanstack-query/_mutation-props'

import { request, send } from '../http'
import type { HTTPError } from '../http'

/**
 * The panel's writes (`/management/*`). The routes are the ones in
 * `backend/start/routes.ts`; the payloads are the `*Payload` types of the shared
 * validators, so the form and the request are checked against one contract.
 *
 * Updates carry the `id` next to the body (`Merge<Payload, { id }>`), so a mutation hook
 * can be handed to `useMutationForm`/`useResourceForm` as-is: the form builds the
 * variables, and the `id` is stripped here before the body goes out.
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
      request(
        `/management/reports/${encodeURIComponent(id)}/status`,
        ManagementReportShowResponse,
        { method: 'PATCH', ...json(body) },
      ),
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
      request('/management/notices', ManagementNoticeShowResponse, {
        method: 'POST',
        ...json(body),
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
      request(
        `/management/notices/${encodeURIComponent(id)}`,
        ManagementNoticeShowResponse,
        { method: 'PUT', ...json(body) },
      ),
  })
}

export function useManagementNoticeCloseMutation(
  options?: MutationProps<ManagementNoticeShowResponse, string>,
) {
  return useMutation<ManagementNoticeShowResponse, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      request(
        `/management/notices/${encodeURIComponent(id)}/close`,
        ManagementNoticeShowResponse,
        { method: 'PATCH' },
      ),
  })
}

export function useManagementNoticeDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      send(`/management/notices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
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
      request('/management/neighborhoods', ManagementNeighborhoodShowResponse, {
        method: 'POST',
        ...json(body),
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
      request(
        `/management/neighborhoods/${encodeURIComponent(id)}`,
        ManagementNeighborhoodShowResponse,
        { method: 'PUT', ...json(body) },
      ),
  })
}

export function useManagementNeighborhoodDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      send(`/management/neighborhoods/${encodeURIComponent(id)}`, {
        method: 'DELETE',
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
      request('/management/schedules', ManagementScheduleShowResponse, {
        method: 'POST',
        ...json(body),
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
      request(
        `/management/schedules/${encodeURIComponent(id)}`,
        ManagementScheduleShowResponse,
        { method: 'PUT', ...json(body) },
      ),
  })
}

export function useManagementScheduleDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      send(`/management/schedules/${encodeURIComponent(id)}`, {
        method: 'DELETE',
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
      request('/management/users', ManagementUserShowResponse, {
        method: 'POST',
        ...json(body),
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
      request(
        `/management/users/${encodeURIComponent(id)}`,
        ManagementUserShowResponse,
        { method: 'PUT', ...json(body) },
      ),
  })
}

export function useManagementUserDeleteMutation(
  options?: MutationProps<void, string>,
) {
  return useMutation<void, HTTPError, string>({
    ...options,
    mutationFn: (id) =>
      send(`/management/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  })
}

/**
 * `PUT /account`: the signed-in user edits their own profile.
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
      request('/account', AccountProfileShowResponse, {
        method: 'PUT',
        ...json(body),
      }),
  })
}
