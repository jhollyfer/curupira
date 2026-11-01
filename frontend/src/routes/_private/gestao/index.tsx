import { createFileRoute } from '@tanstack/react-router'

/**
 * The panel's front door. A placeholder so the guard, the sign-in redirect and the
 * route tree have a real destination; the panel team replaces the screen
 * (`index.lazy.tsx`) and adds the siblings (`reports/`, `schedules/`, `notices/`...).
 */
export const Route = createFileRoute('/_private/gestao/')({})
