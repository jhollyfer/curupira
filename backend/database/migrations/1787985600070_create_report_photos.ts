import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_photos'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      table.uuid('report_id').notNullable().references('id').inTable('reports').onDelete('CASCADE')
      // `unique`: one upload serves one report, so a photo id leaked or guessed cannot be
      // attached to a second report. `RESTRICT` keeps the file from being deleted from
      // the library while a report still shows it (the in-use check reads this table).
      table
        .uuid('storage_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('storages')
        .onDelete('RESTRICT')
      table.integer('position').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
