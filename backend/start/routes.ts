/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { USER_ROLE } from '@curupira/shared'

import {
  accountUpdateThrottle,
  refreshThrottle,
  reportCreateThrottle,
  reportLookupThrottle,
  reportMapThrottle,
  reportPhotoThrottle,
  signInAccountThrottle,
  signInThrottle,
  uploadThrottle,
} from '#start/limiter'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

/**
 * Routes are grouped by **role**, not by resource: what a
 * group has in common is who can enter it, and it is the group that carries the
 * middleware. A new route is born protected by the module where it was placed, instead
 * of depending on someone remembering to repeat the protection.
 *
 * The controllers come from `#generated/controllers`, generated from the
 * `app/features` directory: moving or renaming a file breaks the build here, and not in
 * production as a path string would.
 */

/** Container liveness probe; the why is in the controller. */
router.get('/health-check', [controllers.HealthCheck]).as('health-check')

/**
 * API documentation: the document and the browsable reference. Outside any
 * authenticated group, in `openapi.ignore` together with `/health-check` - the
 * document does not document itself -, and behind `middleware.documentation()`.
 */
router
  .get('/openapi.json', [controllers.documentation.openapi.show.Show])
  .as('documentation.openapi')
  .use(middleware.documentation())
router
  .get('/documentation', [controllers.documentation.reference.show.Show])
  .as('documentation.reference')
  .use(middleware.documentation())

/**
 * The public site. **No `auth()`**, and not by oversight: it is the characteristic of the
 * block - a resident reads the schedule and files a report without an account.
 *
 * Read-only, except for the two anonymous writes (a report and its photos), and **every
 * write here is throttled per IP**: an anonymous `POST` with no ceiling is a free way to
 * fill the database and the bucket. Public data is cut at the repository (see the
 * `ReportRepository` public reads), not here.
 */
router
  .group(() => {
    router
      .get('neighborhoods', [controllers.storefront.neighborhoods.paginate.Paginate])
      .as('neighborhoods')
    router.get('schedules', [controllers.storefront.schedules.paginate.Paginate]).as('schedules')
    router.get('notices', [controllers.storefront.notices.paginate.Paginate]).as('notices')

    router
      .group(() => {
        router
          .post('/', [controllers.storefront.reportPhotos.create.Create])
          .use(reportPhotoThrottle)
        router
          .post(':id/complete', [controllers.storefront.reportPhotos.complete.Complete])
          .as('complete')
          .use(reportPhotoThrottle)
      })
      .prefix('report-photos')
      .as('reportPhotos')

    router
      .group(() => {
        router.post('/', [controllers.storefront.reports.create.Create]).use(reportCreateThrottle)
        // Before `:protocol`: otherwise `map` would be read as a protocol.
        router.get('map', [controllers.storefront.reports.map.Map]).as('map').use(reportMapThrottle)
        router
          .get(':protocol', [controllers.storefront.reports.showByProtocol.ShowByProtocol])
          .as('showByProtocol')
          .use(reportLookupThrottle)
      })
      .prefix('reports')
      .as('reports')
  })
  .prefix('storefront')
  .as('storefront')

/**
 * Session. No middleware on purpose - not an oversight, it is the characteristic
 * of the block: it is the entry door, and requiring a session here would make it unreachable.
 *
 * The three routes answer `204` with no body. What changes state travels in
 * `Set-Cookie`, with the `httpOnly` token pair.
 */
router
  .group(() => {
    router
      .post('sign-in', [controllers.authentication.sessions.signIn.SignIn])
      .use([signInThrottle, signInAccountThrottle])
    // The only one in the group that requires a session: signing out is erasing the tokens of *this*
    // session, and without knowing which one it is there is nothing to erase.
    router
      .post('sign-out', [controllers.authentication.sessions.signOut.SignOut])
      .use(middleware.auth())
    // Outside `auth()` because it is the expired access token that brings someone here.
    // Who authorizes is the refresh cookie, and nothing else.
    router
      .post('refresh', [controllers.authentication.sessions.refresh.Refresh])
      .use(refreshThrottle)
  })
  .prefix('authentication')
  .as('authentication')

/**
 * The account itself, whatever the role.
 *
 * No identifier in the path: the scope comes from the session, never from the payload. The
 * `middleware.auth()` is on the group, not on each route - without a session the role is
 * unknown, and the answer is 401, never 403.
 */
router
  .group(() => {
    router.get('/', [controllers.account.profile.show.Show])
    router.put('/', [controllers.account.profile.update.Update]).use(accountUpdateThrottle)
  })
  .prefix('account')
  .as('profile')
  .use(middleware.auth())

/**
 * Attachments, at the authenticated root like `/account`: every panel role uploads a
 * file, and the record is born without an owner because whoever attaches
 * keeps the reference.
 *
 * The upload has three steps, not one, because the binary does not pass through here: `POST` opens and returns signed URLs, the browser uploads the parts
 * straight to the bucket, and `complete` confirms. `GET :id/parts` is the fourth
 * path, and the same for two cases - resuming after a drop and fetching the
 * next batch of URLs for a file with too many parts.
 *
 * `DELETE` is the pair of `POST` and serves both states: it cancels the upload in
 * progress and deletes the finished file. It only reaches orphan files - since the
 * record is neutral and shared, ownership does not serve as authorization, and what
 * decides is the live reference.
 *
 * The two reads - `GET /` and `GET :id` - are the panel file library.
 * There is no `PUT`: a file is not edited, it is replaced.
 */
router
  .group(() => {
    router.get('/', [controllers.storages.files.paginate.Paginate])
    router.post('/', [controllers.storages.files.create.Create]).use(uploadThrottle)
    router
      .post(':id/complete', [controllers.storages.files.complete.Complete])
      .as('complete')
      .use(uploadThrottle)
    router
      .get(':id/parts', [controllers.storages.files.parts.Parts])
      .as('parts')
      .use(uploadThrottle)
    // After `:id/parts`: the two-segment path is the most specific, and
    // registered before it, it cannot be swallowed by the generic one.
    router.get(':id', [controllers.storages.files.show.Show])
    router.delete(':id', [controllers.storages.files.delete.Delete])

    // The download with the original name goes here, and no longer loose.
    //
    // It used to be outside because the bucket was public: requiring a session only on this route
    // would lock the front door with the back door open. With the private disk
    // the back door closed, and this one now counts - loose, it became the
    // back door itself, issuing a signed URL for any uuid without a
    // session. The save-file `<a>` keeps working: same-site
    // navigation sends the cookie.
    router.get(':id/download', [controllers.storages.files.download.Download]).as('download')
  })
  .prefix('storages')
  .as('storages')
  .use(middleware.auth())

/**
 * Management panel.
 *
 * `auth()` **before** `role()`, and both on the group: without a session the requester's
 * role is still unknown, and the answer is `401` and not `403`. Being on the group, a new
 * route is born protected by the module where it was placed.
 *
 * Two role blocks, because the roles have two reaches: the **operator** works the reports
 * and the notices (the day-to-day desk), the **administrator** does that and also owns the
 * collection schedule, the neighborhoods and the accounts. The stricter block is not a
 * subset of the first by accident: each lists its roles explicitly, so a new role enters
 * neither by default.
 */
router
  .group(() => {
    /**
     * Reports and notices: operator and administrator.
     */
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.management.reports.paginate.Paginate])
            // Before `:id`: otherwise `map` and `stats` would be read as report ids.
            router.get('map', [controllers.management.reports.map.Map]).as('map')
            router.get('stats', [controllers.management.reports.stats.Stats]).as('stats')
            router.get(':id', [controllers.management.reports.show.Show])
            router
              .patch(':id/status', [controllers.management.reports.updateStatus.UpdateStatus])
              .as('updateStatus')
            router.delete(':id', [controllers.management.reports.delete.Delete])
          })
          .prefix('reports')
          .as('reports')

        router
          .group(() => {
            router.get('/', [controllers.management.notices.paginate.Paginate])
            router.post('/', [controllers.management.notices.create.Create])
            router.get(':id', [controllers.management.notices.show.Show])
            router.put(':id', [controllers.management.notices.update.Update])
            router.patch(':id/close', [controllers.management.notices.close.Close]).as('close')
            router.delete(':id', [controllers.management.notices.delete.Delete])
          })
          .prefix('notices')
          .as('notices')
      })
      .use(middleware.role([USER_ROLE.ADMINISTRATOR, USER_ROLE.OPERATOR]))

    /**
     * Schedule, neighborhoods and accounts: administrator only.
     */
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.management.schedules.paginate.Paginate])
            router.post('/', [controllers.management.schedules.create.Create])
            router.get(':id', [controllers.management.schedules.show.Show])
            router.put(':id', [controllers.management.schedules.update.Update])
            router.delete(':id', [controllers.management.schedules.delete.Delete])
          })
          .prefix('schedules')
          .as('schedules')

        router
          .group(() => {
            router.get('/', [controllers.management.neighborhoods.paginate.Paginate])
            router.post('/', [controllers.management.neighborhoods.create.Create])
            router.get(':id', [controllers.management.neighborhoods.show.Show])
            router.put(':id', [controllers.management.neighborhoods.update.Update])
            router.delete(':id', [controllers.management.neighborhoods.delete.Delete])
          })
          .prefix('neighborhoods')
          .as('neighborhoods')

        router
          .group(() => {
            router.get('/', [controllers.management.users.paginate.Paginate])
            router.post('/', [controllers.management.users.create.Create])
            router.get(':id', [controllers.management.users.show.Show])
            router.put(':id', [controllers.management.users.update.Update])
            router.delete(':id', [controllers.management.users.delete.Delete])
          })
          .prefix('users')
          .as('users')
      })
      .use(middleware.role([USER_ROLE.ADMINISTRATOR]))
  })
  .prefix('management')
  .as('management')
  .use(middleware.auth())
