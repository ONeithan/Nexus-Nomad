import DownloadAuditLog, { type DownloadAuditEventType } from '#models/download_audit_log'
import type { DownloadAuditLogEntry } from '../../types/downloads.js'
import logger from '@adonisjs/core/services/logger'
import { basename } from 'node:path'

export interface RecordDownloadAuditParams {
  jobId: string
  url?: string | null
  filepath?: string | null
  title?: string | null
  filetype?: string | null
  eventType: DownloadAuditEventType
  attempt?: number
  maxAttempts?: number
  errorCode?: string | null
  rawError?: string | null
  summaryPt: string
  detailsPt?: string | null
}

function deriveLabel(params: { title?: string | null; filepath?: string | null; url?: string | null; jobId: string }): string {
  if (params.title && params.title.trim()) return params.title.trim()
  if (params.filepath && params.filepath.trim()) return basename(params.filepath.trim())
  if (params.url && params.url.trim()) return params.url.split('/').pop() || params.url
  return params.jobId
}

export class DownloadAuditService {
  static toDto(row: DownloadAuditLog): DownloadAuditLogEntry {
    return {
      id: row.id,
      jobId: row.job_id,
      url: row.url ?? undefined,
      filepath: row.filepath ?? undefined,
      title: row.title || deriveLabel({ filepath: row.filepath, url: row.url, jobId: row.job_id }),
      filetype: row.filetype ?? undefined,
      eventType: row.event_type,
      attempt: row.attempt,
      maxAttempts: row.max_attempts,
      errorCode: row.error_code ?? undefined,
      rawError: row.raw_error ?? undefined,
      summaryPt: row.summary_pt,
      detailsPt: row.details_pt ?? undefined,
      createdAt: row.created_at ? row.created_at.toISO() || new Date().toISOString() : new Date().toISOString(),
    }
  }

  static async record(params: RecordDownloadAuditParams): Promise<void> {
    try {
      await DownloadAuditLog.create({
        job_id: String(params.jobId || 'unknown').slice(0, 64),
        url: params.url ?? null,
        filepath: params.filepath ?? null,
        title: (params.title || deriveLabel({ filepath: params.filepath, url: params.url, jobId: params.jobId })).slice(0, 255),
        filetype: params.filetype ? String(params.filetype).slice(0, 32) : null,
        event_type: params.eventType,
        attempt: Number(params.attempt || 1),
        max_attempts: Number(params.maxAttempts || 3),
        error_code: params.errorCode ? String(params.errorCode).slice(0, 64) : null,
        raw_error: params.rawError ?? null,
        summary_pt: params.summaryPt,
        details_pt: params.detailsPt ?? null,
      })
    } catch (err: any) {
      // Never let audit persistence interrupt or fail a download worker
      logger.debug(`[DownloadAuditService] Skipped persisting audit log (${params.eventType}): ${err?.message}`)
    }
  }

  static async getLogsForJob(jobId: string, limit = 100): Promise<DownloadAuditLogEntry[]> {
    try {
      const rows = await DownloadAuditLog.query()
        .where('job_id', jobId)
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc')
        .limit(limit)
      return rows.map((r) => DownloadAuditService.toDto(r))
    } catch {
      return []
    }
  }

  static async listGlobalLogs(options?: {
    limit?: number
    filter?: 'all' | 'errors' | 'recovery' | 'completed'
    search?: string
  }): Promise<DownloadAuditLogEntry[]> {
    try {
      const limit = Math.min(Math.max(Number(options?.limit || 200), 1), 500)
      const q = DownloadAuditLog.query().orderBy('created_at', 'desc').orderBy('id', 'desc')

      if (options?.filter === 'errors') {
        q.whereIn('event_type', ['failed_attempt', 'requeued_tail', 'cancelled_max_retries', 'cancelled_user'])
      } else if (options?.filter === 'recovery') {
        q.whereIn('event_type', ['boot_recovery', 'directory_repaired', 'requeued_tail', 'retried_manual'])
      } else if (options?.filter === 'completed') {
        q.where('event_type', 'completed')
      }

      if (options?.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`
        q.where((sub) => {
          sub
            .where('title', 'like', term)
            .orWhere('filepath', 'like', term)
            .orWhere('url', 'like', term)
            .orWhere('summary_pt', 'like', term)
            .orWhere('details_pt', 'like', term)
            .orWhere('error_code', 'like', term)
        })
      }

      const rows = await q.limit(limit)
      return rows.map((r) => DownloadAuditService.toDto(r))
    } catch {
      return []
    }
  }

  static async clearLogs(jobId?: string): Promise<number> {
    try {
      if (jobId) {
        const res = await DownloadAuditLog.query().where('job_id', jobId).delete()
        return Array.isArray(res) ? Number(res[0] || 0) : Number(res || 0)
      }
      const res = await DownloadAuditLog.query().delete()
      return Array.isArray(res) ? Number(res[0] || 0) : Number(res || 0)
    } catch {
      return 0
    }
  }
}
