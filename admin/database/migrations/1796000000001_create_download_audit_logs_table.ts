import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'download_audit_logs'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      this.schema.createTable(this.tableName, (table) => {
        table.increments('id').primary()
        table.string('job_id', 64).notNullable().index()
        table.text('url').nullable()
        table.text('filepath').nullable()
        table.string('title', 255).nullable()
        table.string('filetype', 32).nullable()
        table.string('event_type', 48).notNullable().index()
        table.integer('attempt').notNullable().defaultTo(1)
        table.integer('max_attempts').notNullable().defaultTo(3)
        table.string('error_code', 64).nullable()
        table.text('raw_error').nullable()
        table.text('summary_pt').notNullable()
        table.text('details_pt').nullable()
        table.timestamp('created_at').notNullable()
      })
    }
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
