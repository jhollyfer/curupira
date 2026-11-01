import { BaseSchema } from '@adonisjs/lucid/schema'
import { COLLECTION_SHIFTS, WASTE_TYPES, WEEKDAYS } from '@curupira/shared'

export default class extends BaseSchema {
  protected tableName = 'collection_schedules'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      // `RESTRICT`: deleting a neighborhood must not silently erase the schedule
      // residents read; the use case refuses first, and this is the net under it.
      table
        .uuid('neighborhood_id')
        .notNullable()
        .references('id')
        .inTable('neighborhoods')
        .onDelete('RESTRICT')
      table.enum('waste_type', WASTE_TYPES).notNullable()
      table.enum('weekday', WEEKDAYS).notNullable()
      table.enum('shift', COLLECTION_SHIFTS).notNullable()
      table.string('note', 200).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      // The same type cannot be listed twice for the same slot of the same neighborhood.
      table.unique(['neighborhood_id', 'waste_type', 'weekday', 'shift'], {
        indexName: 'collection_schedules_slot_unique',
      })
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
