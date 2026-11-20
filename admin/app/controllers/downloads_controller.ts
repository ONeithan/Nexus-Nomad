import type { HttpContext } from '@adonisjs/core/http'
import { DownloadService } from '#services/download_service'
import { downloadJobsByFiletypeSchema } from '#validators/download'
import { inject } from '@adonisjs/core'

@inject()
export default class DownloadsController {
  constructor(private downloadService: DownloadService) {}

  async index() {
    return this.downloadService.listDownloadJobs()
  }

  async filetype({ request }: HttpContext) {
    const payload = await request.validateUsing(downloadJobsByFiletypeSchema)
    return this.downloadService.listDownloadJobs(payload.params.filetype)
  }

  async removeJob({ params }: HttpContext) {
    await this.downloadService.removeFailedJob(params.jobId)
    return { success: true }
  }

  async cancelJob({ params }: HttpContext) {
    return this.downloadService.cancelJob(params.jobId)
  }

  async retryJob({ params }: HttpContext) {
    return this.downloadService.retryFailedJob(params.jobId)
  }

  async resumeAll() {
    return this.downloadService.resumeAllInterruptedDownloads({
      includePermanentMaxRetries: true,
      source: 'manual',
    })
  }

  async jobLogs({ params }: HttpContext) {
    return await this.downloadService.getJobAuditLogs(params.jobId)
  }

  async listLogs({ request }: HttpContext) {
    const limit = Number(request.input('limit', 200)) || 200
    const filterRaw = String(request.input('filter', 'all'))
    const filter = (['all', 'errors', 'recovery', 'completed'].includes(filterRaw)
      ? filterRaw
      : 'all') as 'all' | 'errors' | 'recovery' | 'completed'
    const search = String(request.input('search', '') || '')
    return await this.downloadService.listGlobalAuditLogs({ limit, filter, search })
  }

  async clearLogs({ request }: HttpContext) {
    const jobId = request.input('jobId') ? String(request.input('jobId')) : undefined
    const deletedCount = await this.downloadService.clearAuditLogs(jobId)
    return { success: true, deletedCount }
  }

  async incomplete() {
    return this.downloadService.listIncompleteDownloads()
  }

  async deleteIncomplete({ request }: HttpContext) {
    const tempPath = request.input('tempPath')
    return this.downloadService.deleteIncompleteDownload(tempPath)
  }

  async clearOrphaned() {
    return this.downloadService.clearOrphanedIncompleteDownloads()
  }
}
