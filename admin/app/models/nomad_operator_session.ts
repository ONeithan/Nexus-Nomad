import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import NomadOperator from '#models/nomad_operator'

export default class NomadOperatorSession extends BaseModel {
  static table = 'nomad_operator_sessions'
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column({ serializeAs: null })
  declare token_hash: string

  @column()
  declare operator_id: number

  @belongsTo(() => NomadOperator, { foreignKey: 'operator_id' })
  declare operator: BelongsTo<typeof NomadOperator>

  @column()
  declare ip_address: string | null

  @column()
  declare user_agent: string | null

  @column()
  declare is_locked: boolean

  @column()
  declare remember: boolean

  @column.dateTime()
  declare expires_at: DateTime

  @column.dateTime()
  declare last_seen_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
