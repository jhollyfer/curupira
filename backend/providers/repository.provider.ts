import type { ApplicationService } from '@adonisjs/core/types'

import { CollectionScheduleLucidRepository } from '#repositories/collection-schedule/collection-schedule.lucid.repository'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import { NeighborhoodLucidRepository } from '#repositories/neighborhood/neighborhood.lucid.repository'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { NoticeLucidRepository } from '#repositories/notice/notice.lucid.repository'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import { ReportLucidRepository } from '#repositories/report/report.lucid.repository'
import { ReportRepository } from '#repositories/report/report.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UnitOfWorkLucid } from '#repositories/unit-of-work/unit-of-work.lucid'
import { StorageLucidRepository } from '#repositories/storage/storage.lucid.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UserLucidRepository } from '#repositories/user/user.lucid.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { SessionLucidRepository } from '#repositories/session/session.lucid.repository'
import { SessionRepository } from '#repositories/session/session.repository'

/**
 * The persistence composition root (`_standards/architecture.md` §2,
 * `solid.md` §2): binds each contract in `app/repositories/` to its Lucid
 * implementation. The use case receives the contract in the constructor and never
 * knows which one it is; the unit test passes the in-memory implementation directly.
 */
export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(UnitOfWork, () => this.app.container.make(UnitOfWorkLucid))
    this.app.container.bind(NeighborhoodRepository, () =>
      this.app.container.make(NeighborhoodLucidRepository),
    )
    this.app.container.bind(CollectionScheduleRepository, () =>
      this.app.container.make(CollectionScheduleLucidRepository),
    )
    this.app.container.bind(ReportRepository, () => this.app.container.make(ReportLucidRepository))
    this.app.container.bind(NoticeRepository, () => this.app.container.make(NoticeLucidRepository))
    this.app.container.bind(StorageRepository, () =>
      this.app.container.make(StorageLucidRepository),
    )
    this.app.container.bind(UserRepository, () => this.app.container.make(UserLucidRepository))
    this.app.container.bind(SessionRepository, () =>
      this.app.container.make(SessionLucidRepository),
    )
  }
}
