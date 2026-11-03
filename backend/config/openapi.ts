import env from '#start/env'
import { COOKIE_TOKEN } from '#config/cookie'

/**
 * OpenAPI document configuration.
 *
 * Only what cannot be derived from the code lives here. Route, method, path
 * parameters, authentication requirement and roles come from the router itself at
 * generation time (`app/core/openapi/document.ts`); payload and response come from the
 * VineJS schemas and the models. What remains is the document identity and the human
 * label of a tag.
 */

/**
 * Name of the security scheme referenced by every authenticated operation.
 *
 * It is `apiKey` in a cookie, not `bearer`: the application guard reads the token from
 * `request.cookie(COOKIE_TOKEN.ACCESS)` and has no fallback to the `Authorization`
 * header (`app/guards/cookie-access-tokens.guard.ts`). Documenting bearer here would
 * make Scalar's "Test Request" always fail.
 */
export const SECURITY_SCHEME = 'cookieAuth'

/**
 * Cookie that carries the access token: the very constant the guard reads, so the
 * documented name cannot drift from the real one.
 */
export const SECURITY_COOKIE = COOKIE_TOKEN.ACCESS

/**
 * Label of an operation group in the Scalar sidebar.
 *
 * Matching is by **path** prefix, not by route name: the panel lifecycle subgroup is
 * `.as('lifecycle')`, so deleting a user is called
 * `administrator.lifecycle.users.purge`. The path (`/administrator/users/:id`)
 * does not have that problem.
 *
 * The prefixes are disjoint on purpose. Every registered route matches exactly one
 * rule, and the generator warns about the one that matches none.
 */
export type TagRule = {
  prefix: string
  name: string
  description: string
  /**
   * The resource noun, used to build each operation's summary:
   * `create` + `report` -> "Create report". Writing the pair once per group covers its
   * seven operations, instead of one summary per controller.
   */
  singular?: string
  plural?: string
}

const tags: TagRule[] = [
  {
    prefix: '/authentication',
    name: 'Authentication',
    description:
      'Sign in, sign out and session renewal. The token pair travels in an `httpOnly` cookie, ' +
      'so these routes answer `204` with no body - what matters is the `Set-Cookie`.',
    singular: 'session',
    plural: 'sessions',
  },
  {
    prefix: '/account',
    name: 'Account',
    description:
      'The account itself, whatever the role. No identifier in the path: the scope comes from the ' +
      'session, never from the payload - whoever edits is always whoever is authenticated.',
    singular: 'account',
    plural: 'accounts',
  },
  {
    prefix: '/storages',
    name: 'Attachments',
    description:
      'Upload in three steps, because the binary does **not** cross this application: ' +
      '`POST` opens and returns signed URLs, the browser uploads the parts straight to the bucket, and ' +
      '`complete` confirms against the real object. The record is born without an owner - whoever attaches ' +
      'keeps the reference.',
    singular: 'attachment',
    plural: 'attachments',
  },
  {
    prefix: '/management/reports',
    name: 'Management · Reports',
    description:
      'The environmental reports for the team: list with filters, map pins, dashboard numbers, detail with the contact and signed photos, and the status moving forward. ' +
      'Operators and administrators.',
    singular: 'report',
    plural: 'reports',
  },
  {
    prefix: '/management/notices',
    name: 'Management · Notices',
    description:
      'The notices the home shows between two dates. ' +
      'Operators and administrators.',
    singular: 'notice',
    plural: 'notices',
  },
  {
    prefix: '/management/schedules',
    name: 'Management · Collection schedule',
    description:
      'The weekly collection slots: a waste type, weekday and shift in a neighborhood. ' +
      'Administrators only.',
    singular: 'collection slot',
    plural: 'collection slots',
  },
  {
    prefix: '/management/neighborhoods',
    name: 'Management · Neighborhoods',
    description:
      'The neighborhoods residents pick, with an optional center on the map. ' +
      'Administrators only.',
    singular: 'neighborhood',
    plural: 'neighborhoods',
  },
  {
    prefix: '/management/users',
    name: 'Management · Users',
    description:
      'The access accounts: administrators and operators. There is no public sign-up - every account is born here. The password is never returned in any response. ' +
      'Administrators only.',
    singular: 'user',
    plural: 'users',
  },
  {
    prefix: '/storefront/neighborhoods',
    name: 'Site · Neighborhoods',
    description:
      'The neighborhood list the resident picks from. **Unauthenticated**.',
    singular: 'neighborhood',
    plural: 'neighborhoods',
  },
  {
    prefix: '/storefront/schedules',
    name: 'Site · Collection schedule',
    description:
      'The week of collection, per neighborhood. **Unauthenticated**.',
    singular: 'collection slot',
    plural: 'collection slots',
  },
  {
    prefix: '/storefront/notices',
    name: 'Site · Notices',
    description: 'The notices showing now. **Unauthenticated**.',
    singular: 'notice',
    plural: 'notices',
  },
  {
    prefix: '/storefront/report-photos',
    name: 'Site · Report photos',
    description:
      'Anonymous photo upload for a report, in two steps: open (signed `PUT`) and confirm, which verifies the image and strips its metadata. ' +
      '**Unauthenticated**, throttled per IP.',
    singular: 'report photo',
    plural: 'report photos',
  },
  {
    prefix: '/storefront/reports',
    name: 'Site · Reports',
    description:
      'File a report anonymously, follow it by protocol and see the public map. The public reads never carry the contact, the description or the photos. ' +
      '**Unauthenticated**, throttled per IP.',
    singular: 'report',
    plural: 'reports',
  },
]

const openapi = {
  info: {
    title: 'API Curupira',
    version: '1.0.0',
    description:
      'Curupira API: the collection schedule by neighborhood, anonymous environmental reports with ' +
      'photo and map, and the management panel for the city team.\n\n' +
      'The site (`/storefront`) answers without a session. Everything else requires the `httpOnly` cookie ' +
      '`curupira-access-token`, issued by `POST /authentication/sign-in` and renewed by ' +
      '`POST /authentication/refresh`.\n\n' +
      'Every failure returns the same body: `{ message, status, code, errors? }`, where `code` is the ' +
      'machine identifier and `errors` maps field to message when the failure is per ' +
      'field.',
  },

  servers: [{ url: env.get('APP_SERVER_URL'), description: 'Current server' }],

  /** Paths that never enter the document: they are not API operations. */
  ignore: ['/documentation', '/openapi.json', '/health-check'],

  tags,
}

/**
 * Fixed summary for a domain action of this project - or one that needs another
 * phrase.
 *
 * `scripts/openapi/emit.ts` is the same in every house project, so its action table
 * is about mechanism: `create`, `paginate`, `show`, `update`, `archive`,
 * `unarchive`, `delete` plus the session and upload ones. A domain name there would
 * become a wrong summary in another project, and this file - which belongs to the
 * project - is the place to say what only holds here.
 *
 * The key is the controller file name without the suffix, and the value beats
 * everything: if it is here, neither the mechanism table nor the group noun
 * is consulted.
 */
export const ACTION_OVERRIDES: Record<string, string> = {
  'update-status': 'Move report forward',
  'show-by-protocol': 'Follow report by protocol',
  map: 'Report map',
  stats: 'Dashboard numbers',
  close: 'Close notice',
}

export default openapi
