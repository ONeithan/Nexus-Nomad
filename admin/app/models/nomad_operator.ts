import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export default class NomadOperator extends BaseModel {
  static table = 'nomad_operators'
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare username_lower: string

  @column({ serializeAs: null })
  declare password_hash: string

  @column()
  declare role_level: number

  @column()
  declare is_active: boolean

  @column()
  declare created_by: string | null

  @column.dateTime()
  declare last_login_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
