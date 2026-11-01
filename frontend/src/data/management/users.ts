import type {
  ManagementUserCreatePayload,
  ManagementUserPaginatePayload,
  ManagementUserShowResponse,
  ManagementUserUpdatePayload,
  Paginated,
} from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { townNowIso } from '#/lib/i18n'

import { keep, matchesText, paginate, sortedBy } from './paginate'
import { MOCK_ADMINISTRATOR_ID } from './seed-users'
import { store } from './store'

/**
 * EXAMPLE DATA of the panel: accounts, in memory. Passwords are accepted by the form's
 * validator and then dropped - the response never carries one, in the mock or in the
 * API. The example session is the first administrator, which is what the "nobody deletes
 * themselves" rule is checked against.
 */
function notFound(): HTTPError {
  return new HTTPError({
    message: 'Usuário não encontrado',
    status: 404,
    code: 'USER_NOT_FOUND',
  })
}

function assertFreeEmail(email: string, ignoreId?: string): void {
  const taken = store.users.some(
    (row) =>
      row.id !== ignoreId && row.email.toLowerCase() === email.toLowerCase(),
  )
  if (!taken) return

  throw new HTTPError({
    message: 'Já existe um usuário com este e-mail',
    status: 409,
    code: 'USER_ALREADY_EXISTS',
    errors: { email: 'Já existe um usuário com este e-mail' },
  })
}

export function listUsers(
  query: ManagementUserPaginatePayload,
): Paginated<ManagementUserShowResponse> {
  const filtered = store.users
    .filter((row) => matchesText([row.name, row.email], query.search))
    .filter((row) => !query.role || row.role === query.role)
    .filter((row) => !query.status || row.status === query.status)

  const sorted = sortedBy(
    filtered,
    (row) => {
      if (query.sort === 'email') return row.email
      if (query.sort === 'createdAt') return row.createdAt

      return row.name
    },
    query.direction,
  )

  return paginate(sorted, query)
}

export function findUser(id: string): ManagementUserShowResponse {
  const found = store.users.find((row) => row.id === id)
  if (!found) throw notFound()

  return found
}

export function createUser(
  payload: ManagementUserCreatePayload,
): ManagementUserShowResponse {
  assertFreeEmail(payload.email)

  const created: ManagementUserShowResponse = {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: 'ACTIVE',
    createdAt: townNowIso(),
    updatedAt: null,
  }
  store.users = [...store.users, created]

  return created
}

export function updateUser(
  id: string,
  payload: ManagementUserUpdatePayload,
): ManagementUserShowResponse {
  const current = findUser(id)
  const email = keep(payload.email, current.email)
  assertFreeEmail(email, id)

  const updated: ManagementUserShowResponse = {
    ...current,
    name: keep(payload.name, current.name),
    email,
    role: keep(payload.role, current.role),
    status: keep(payload.status, current.status),
    updatedAt: townNowIso(),
  }
  store.users = store.users.map((row) => {
    if (row.id === id) return updated

    return row
  })

  return updated
}

export function deleteUser(id: string): void {
  findUser(id)

  if (id === MOCK_ADMINISTRATOR_ID) {
    throw new HTTPError({
      message: 'Você não pode excluir a própria conta',
      status: 403,
      code: 'SELF_DELETE_FORBIDDEN',
    })
  }

  store.users = store.users.filter((row) => row.id !== id)
}
