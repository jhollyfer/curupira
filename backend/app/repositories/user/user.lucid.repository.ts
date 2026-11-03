import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { left, right } from '@curupira/shared'
import type { Either, Paginated } from '@curupira/shared'

import {
  UserRepository,
  type UserListCriteria,
  type UserRead,
} from './user.repository.ts'

import UserModel from '#models/user'
import { PostgresError } from '#core/postgres-error'
import { User } from '#domain/user/user.entity'
import type { UserError } from '#domain/user/user.errors'
import { TransactionContext } from '#core/transaction-context'

@inject()
export class UserLucidRepository extends UserRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.query().where('id', id).first()

    if (!row) return null

    return this.toEntity(row)
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.query().where('email', email).first()

    if (!row) return null

    return this.toEntity(row)
  }

  async existsByEmail(email: string, exceptId?: string): Promise<boolean> {
    const query = this.query().where('email', email)
    if (exceptId) query.whereNot('id', exceptId)

    return Boolean(await query.first())
  }

  async save(user: User): Promise<Either<UserError, void>> {
    const { id, createdAt, updatedAt, ...columns } = user.snapshot()

    try {
      // The password goes as is: the model hook hashes when it changed, and the hash
      // already saved comes back equal and is not hashed again.
      await UserModel.updateOrCreate(
        { id },
        {
          ...columns,
          createdAt: DateTime.fromJSDate(createdAt),
          updatedAt: this.dateOrNull(updatedAt),
        },
        { client: this.transaction.client() },
      )

      return right(undefined)
    } catch (error) {
      if (PostgresError.isUniqueViolation(error))
        return left({ code: 'USER_ALREADY_EXISTS' })

      throw error
    }
  }

  async delete(user: User): Promise<void> {
    await this.query().where('id', user.id).delete()
  }

  async detail(id: string): Promise<UserRead | null> {
    const row = await this.query().where('id', id).first()
    if (!row) return null

    return this.toResponse(row)
  }

  async paginate(criteria: UserListCriteria): Promise<Paginated<UserRead>> {
    const query = this.query()

    if (criteria.role) query.where('role', criteria.role)
    if (criteria.status) query.where('status', criteria.status)

    // The `OR` goes inside a subquery: loose, it would escape the filters' `AND`.
    if (criteria.search) {
      const search = `%${criteria.search}%`

      query.where((builder) => {
        builder.whereILike('name', search).orWhereILike('email', search)
      })
    }

    const page = await query
      .orderBy(criteria.sort, criteria.direction)
      .paginate(criteria.page, criteria.perPage)

    return {
      meta: page.getMeta(),
      data: page.all().map((row) => this.toResponse(row)),
    }
  }

  private query() {
    return UserModel.query({ client: this.transaction.client() })
  }

  private toEntity(row: UserModel): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      status: row.status,
      avatarId: row.avatarId,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: row.updatedAt?.toJSDate() ?? null,
    })
  }

  private toResponse(row: UserModel): UserRead {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt.toISO() ?? '',
      updatedAt: row.updatedAt?.toISO() ?? null,
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
