import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.defer(async (db) => {
      await db.from(this.tableName)
        .where('service_name', 'nomad_open_webui')
        .update({ depends_on: null })
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from(this.tableName)
        .where('service_name', 'nomad_open_webui')
        .update({ depends_on: 'nomad_ollama' })
    })
  }
}
