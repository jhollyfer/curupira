import { createFileRoute } from '@tanstack/react-router'

/**
 * The signed-in user's own profile. Both roles may open it, so there is no area guard; the
 * data is the session's (`/account`) and is already in the route context from the panel
 * gate, so the screen needs no loader of its own.
 */
export const Route = createFileRoute('/_private/gestao/account/profile/')({})
