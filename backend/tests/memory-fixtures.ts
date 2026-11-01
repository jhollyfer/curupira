import { CollectionScheduleMemoryRepository } from '#repositories/collection-schedule/collection-schedule.memory.repository'
import { NeighborhoodMemoryRepository } from '#repositories/neighborhood/neighborhood.memory.repository'
import { NoticeMemoryRepository } from '#repositories/notice/notice.memory.repository'
import { ReportMemoryRepository } from '#repositories/report/report.memory.repository'
import { StorageMemoryRepository } from '#repositories/storage/storage.memory.repository'
import { UserMemoryRepository } from '#repositories/user/user.memory.repository'

/**
 * The unit in-memory repositories (`_standards/domain.md` §5.3). A `features/` spec
 * does not import a concrete implementation (`architecture.md` §2): it takes the
 * instance from here and passes it to the container by the contract (`makeWithMemory`).
 */
export class MemoryRepositories {
  static neighborhoods(): NeighborhoodMemoryRepository {
    return new NeighborhoodMemoryRepository()
  }

  static schedules(): CollectionScheduleMemoryRepository {
    return new CollectionScheduleMemoryRepository()
  }

  static notices(): NoticeMemoryRepository {
    return new NoticeMemoryRepository()
  }

  static reports(): ReportMemoryRepository {
    return new ReportMemoryRepository()
  }

  static storages(): StorageMemoryRepository {
    return new StorageMemoryRepository()
  }

  static users(): UserMemoryRepository {
    return new UserMemoryRepository()
  }
}
