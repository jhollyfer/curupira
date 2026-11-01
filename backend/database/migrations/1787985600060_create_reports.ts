import { BaseSchema } from '@adonisjs/lucid/schema'
import { REPORT_KINDS, REPORT_STATUSES } from '@curupira/shared'

export default class extends BaseSchema {
  protected tableName = 'reports'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      // The only key to the public status page, so it is drawn, not sequenced.
      table.string('protocol', 20).notNullable().unique()
      table.enum('kind', REPORT_KINDS).notNullable()
      table.enum('status', REPORT_STATUSES).notNullable()
      table.double('latitude').notNullable()
      table.double('longitude').notNullable()
      // `SET NULL`: removing a neighborhood keeps the report (and its pin) on the map.
      table
        .uuid('neighborhood_id')
        .nullable()
        .references('id')
        .inTable('neighborhoods')
        .onDelete('SET NULL')
      table.text('description').nullable()
      // Personal data, read only by the panel. Never selected by a public query.
      table.string('contact', 120).nullable()
      table.boolean('anonymous').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['status', 'created_at'], 'reports_status_created_at_index')
      table.index(['neighborhood_id'], 'reports_neighborhood_id_index')
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
