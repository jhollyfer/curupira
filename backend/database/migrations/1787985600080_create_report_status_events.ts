import { BaseSchema } from '@adonisjs/lucid/schema'
import { REPORT_STATUSES } from '@curupira/shared'

export default class extends BaseSchema {
  protected tableName = 'report_status_events'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      table
        .uuid('report_id')
        .notNullable()
        .references('id')
        .inTable('reports')
        .onDelete('CASCADE')
      table.enum('status', REPORT_STATUSES).notNullable()
      table.string('message', 500).nullable()
      // `SET NULL`: the account leaving the team does not erase the history it wrote.
      table
        .uuid('author_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['report_id', 'at'], 'report_status_events_report_at_index')
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
