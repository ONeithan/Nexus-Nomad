import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected operatorsTable = 'nomad_operators'
  protected sessionsTable = 'nomad_operator_sessions'

  async up() {
    const hasOperators = await this.schema.hasTable(this.operatorsTable)
    if (!hasOperators) {
      this.schema.createTable(this.operatorsTable, (table) => {
        table.increments('id').primary()
        table.string('username', 80).notNullable()
        table.string('username_lower', 80).notNullable().unique()
        table.string('password_hash', 255).notNullable()
        table.integer('role_level').notNullable().defaultTo(5)
        table.boolean('is_active').notNullable().defaultTo(true)
        table.string('created_by', 80).nullable()
        table.timestamp('last_login_at').nullable()
        table.timestamp('created_at').notNullable()
        table.timestamp('updated_at').notNullable()
      })
    }

    const hasSessions = await this.schema.hasTable(this.sessionsTable)
    if (!hasSessions) {
      this.schema.createTable(this.sessionsTable, (table) => {
        table.increments('id').primary()
        table.string('token_hash', 128).notNullable().unique()
        table
          .integer('operator_id')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable(this.operatorsTable)
          .onDelete('CASCADE')
        table.string('ip_address', 64).nullable()
        table.string('user_agent', 255).nullable()
        table.boolean('is_locked').notNullable().defaultTo(false)
        table.boolean('remember').notNullable().defaultTo(true)
        table.timestamp('expires_at').notNullable()
        table.timestamp('last_seen_at').nullable()
        table.timestamp('created_at').notNullable()
        table.timestamp('updated_at').notNullable()
      })
    }
  }

  async down() {
    this.schema.dropTableIfExists(this.sessionsTable)
    this.schema.dropTableIfExists(this.operatorsTable)
  }
}
