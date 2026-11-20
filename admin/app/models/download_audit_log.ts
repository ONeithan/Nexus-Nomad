import { DateTime } from 'luxon'
import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

export type DownloadAuditEventType =
  | 'queued'
  | 'started'
  | 'resumed'
  | 'directory_repaired'
  | 'failed_attempt'
  | 'requeued_tail'
  | 'boot_recovery'
  | 'retried_manual'
  | 'completed'
  | 'cancelled_max_retries'
  | 'cancelled_user'

export default class DownloadAuditLog extends BaseModel {
  static table = 'download_audit_logs'
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare job_id: string

  @column()
  declare url: string | null

  @column()
  declare filepath: string | null

  @column()
  declare title: string | null

  @column()
  declare filetype: string | null

  @column()
  declare event_type: DownloadAuditEventType

  @column()
  declare attempt: number

  @column()
  declare max_attempts: number

  @column()
  declare error_code: string | null

  @column()
  declare raw_error: string | null

  @column()
  declare summary_pt: string

  @column()
  declare details_pt: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime
}
