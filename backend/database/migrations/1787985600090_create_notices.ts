import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notices'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      table.string('title', 120).notNullable()
      table.string('body', 600).notNullable()
      table.timestamp('starts_at').notNullable()
      table.timestamp('ends_at').nullable()
      // Closed by hand. There is no `status` column: it is derived from the dates.
      table.timestamp('closed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['starts_at'], 'notices_starts_at_index')
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
