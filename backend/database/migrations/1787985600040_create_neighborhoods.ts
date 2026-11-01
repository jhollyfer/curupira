import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'neighborhoods'

  override async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.knexRawQuery('uuid_generate_v4()'))
      table.string('name', 80).notNullable().unique()
      // The address of the neighborhood on the site; two names that differ only by
      // accent or case would otherwise compete for the same one.
      table.string('slug', 100).notNullable().unique()
      // The center, both or none (an entity rule). `double precision` is plenty: a pin
      // is not a survey, and the nearest-match compares kilometers.
      table.double('latitude').nullable()
      table.double('longitude').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  override async down(): Promise<void> {
    this.schema.dropTable(this.tableName)
  }
}
