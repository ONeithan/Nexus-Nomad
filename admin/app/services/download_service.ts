import { inject } from '@adonisjs/core'
import { QueueService } from './queue_service.js'
import { RunDownloadJob } from '#jobs/run_download_job'
import { RunExtractPmtilesJob } from '#jobs/run_extract_pmtiles_job'
import type { RunExtractPmtilesJobParams } from '#jobs/run_extract_pmtiles_job'
import { DownloadModelJob } from '#jobs/download_model_job'
import { DownloadDrugDataJob } from '#jobs/download_drug_data_job'
import { DownloadJobWithProgress, DownloadProgressData, IncompleteDownloadItem, RunDownloadJobParams } from '../../types/downloads.js'
import type { Job, Queue } from 'bullmq'
import { normalize, join, basename, dirname, resolve } from 'node:path'
import { readdir, realpath, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { deleteFileIfExists, repairDownloadDirectory } from '../utils/fs.js'
import { diagnoseDownloadError } from '../utils/download_diagnostics.js'
import {
  evaluateBootRecoveryAction,
  sortDownloadJobsFifo,
} from '../utils/download_queue_policy.js'
import { DownloadAuditService } from './download_audit_service.js'
import transmit from '@adonisjs/transmit/services/main'
import { BROADCAST_CHANNELS } from '../../constants/broadcast.js'

type FileJobState = 'waiting' | 'active' | 'delayed' | 'failed'
type TaggedJob = { job: Job; state: FileJobState }

@inject()
export class DownloadService {
  constructor(private queueService: QueueService) {}

  private parseProgress(progress: any): { percent: number; downloadedBytes?: number; totalBytes?: number; lastProgressTime?: number } {
    if (typeof progress === 'object' && progress !== null && 'percent' in progress) {
      const p = progress as DownloadProgressData
      return {
        percent: p.percent,
        downloadedBytes: p.downloadedBytes,
        totalBytes: p.totalBytes,
        lastProgressTime: p.lastProgressTime,
      }
    }
    // Backward compat: plain integer from in-flight jobs during upgrade
    return { percent: parseInt(String(progress), 10) || 0 }
  }

  private async _syncWikipediaDownloadingState(url?: string): Promise<void> {
    if (!url || !url.includes('wikipedia_')) return
    try {
      const { default: WikipediaSelection } = await import('#models/wikipedia_selection')
      const selection = await WikipediaSelection.query().first()
      if (selection && (selection.url === url || selection.status === 'failed')) {
        selection.status = 'downloading'
        await selection.save()
      }
    } catch {
      // Non-fatal: Wikipedia selection status sync is best effort
    }
  }

  /** Fetch all non-completed jobs from a queue, tagged with their current BullMQ state */
  private async fetchJobsWithStates(queueName: string): Promise<TaggedJob[]> {
    const queue = this.queueService.getQueue(queueName)
    // Pass asc=true for waiting/active/delayed so BullMQ reverses Redis LRANGE (FIFO wait list
    // pushes via LPUSH and dequeues via RPOPLPUSH) into true execution order: #1 next -> #N tail.
    const [waiting, active, delayed, failed] = await Promise.all([
      queue.getJobs(['waiting'], 0, -1, true),
      queue.getJobs(['active'], 0, -1, true),
      queue.getJobs(['delayed'], 0, -1, true),
      queue.getJobs(['failed'], 0, -1, false),
    ])
    return [
      ...waiting.map((j) => ({ job: j, state: 'waiting' as const })),
      ...active.map((j) => ({ job: j, state: 'active' as const })),
      ...delayed.map((j) => ({ job: j, state: 'delayed' as const })),
      ...failed.map((j) => ({ job: j, state: 'failed' as const })),
      // A job id can outlive its payload hash — BullMQ still returns an entry for
      // it, with `data` empty. One of those in the failed set used to throw on
      // every poll of this endpoint (normalize(undefined)), and because failed
      // jobs are never evicted the endpoint stayed broken until Redis was cleared
      // by hand. Drop them: with no payload there is nothing to show anyway.
    ].filter(({ job }) => job?.id != null && job.data != null)
  }

  private async resolveDiskInfoMap(paths: string[]): Promise<
    Map<string, { realPath: string; diskLabel: string; diskPath: string }>
  > {
    const result = new Map<string, { realPath: string; diskLabel: string; diskPath: string }>()
    const validPaths = paths.filter((p) => Boolean(p && (p.startsWith('/') || /^[a-zA-Z]:/.test(p))))
    if (validPaths.length === 0) return result

    const { StorageManagerService } = await import('#services/storage_manager_service')
    const storageSvc = new StorageManagerService()
    const overview = await storageSvc.getStorageOverview().catch(() => null)
    const mountTargets = overview?.mountTargets || []
    const fallbackRoot = overview?.storageRoot

    await Promise.all(
      validPaths.map(async (rawPath) => {
        const absPath = resolve(rawPath)
        let realResolved = await realpath(absPath).catch(() => null)
        if (!realResolved) {
          const parentReal = await realpath(dirname(absPath)).catch(() => resolve(dirname(absPath)))
          realResolved = join(parentReal, basename(absPath))
        }
        const diskInfo = storageSvc.resolveDiskForRealPath(realResolved, mountTargets, fallbackRoot)
        result.set(rawPath, { realPath: realResolved, ...diskInfo })
      })
    )
    return result
  }

  async listDownloadJobs(filetype?: string): Promise<DownloadJobWithProgress[]> {
    const safeFetch = (queueName: string) =>
      this.fetchJobsWithStates(queueName).catch(() => [] as TaggedJob[])

    const [fileTagged, extractTagged, modelTagged, drugTagged] = await Promise.all([
      safeFetch(RunDownloadJob.queue),
      safeFetch(RunExtractPmtilesJob.queue),
      safeFetch(DownloadModelJob.queue),
      safeFetch(DownloadDrugDataJob.queue),
    ])

    const fileDownloads = fileTagged.map(({ job, state }, index) => {
      const parsed = this.parseProgress(job.progress)
      const data = (job.data || {}) as RunDownloadJobParams
      const attempt = Number(data.retryAttempt ?? 1)
      const maxAttempts = Number(data.maxRetries ?? 3)
      const diag =
        state === 'failed'
          ? diagnoseDownloadError(job.failedReason || data.lastErrorPt || 'Erro desconhecido', data.filepath)
          : null

      return {
        jobId: String(job.id ?? ''),
        url: data.url || '',
        progress: parsed.percent,
        filepath: data.filepath ? normalize(data.filepath) : '',
        filetype: data.filetype,
        title: data.title || undefined,
        downloadedBytes: parsed.downloadedBytes,
        totalBytes: parsed.totalBytes || data.totalBytes || undefined,
        lastProgressTime: parsed.lastProgressTime,
        status: state,
        failedReason: diag ? diag.summaryPt : job.failedReason || undefined,
        attempt,
        maxAttempts,
        errorCode: diag?.code ?? data.lastErrorCode,
        errorSummaryPt: diag?.summaryPt ?? data.lastErrorPt,
        errorDetailsPt: diag?.explanationPt ?? data.lastErrorDetailsPt,
        requeueReason:
          state !== 'failed' && attempt > 1 && data.lastErrorPt
            ? `Movido ao fim da fila (${attempt}/${maxAttempts}) — causa anterior: ${data.lastErrorPt}`
            : undefined,
        finalCancelledByRetryLimit: Boolean(data.finalCancelledByRetryLimit),
        _fifoIdx: index,
      }
    })

    const extractDownloads = extractTagged.map(({ job, state }, index) => {
      const parsed = this.parseProgress(job.progress)
      const diag =
        state === 'failed'
          ? diagnoseDownloadError(job.failedReason || 'Falha na extração de mapa', job.data?.outputFilepath)
          : null
      return {
        jobId: String(job.id ?? ''),
        url: job.data?.sourceUrl || '',
        progress: parsed.percent,
        filepath: job.data?.outputFilepath ? normalize(job.data.outputFilepath) : '',
        filetype: job.data?.filetype || 'map',
        title: job.data?.title || undefined,
        downloadedBytes: parsed.downloadedBytes,
        totalBytes: parsed.totalBytes || job.data?.estimatedBytes || undefined,
        lastProgressTime: parsed.lastProgressTime,
        status: state,
        failedReason: diag ? diag.summaryPt : job.failedReason || undefined,
        attempt: Number(job.data?.retryAttempt ?? 1),
        maxAttempts: Number(job.data?.maxRetries ?? 3),
        errorCode: diag?.code,
        errorSummaryPt: diag?.summaryPt,
        errorDetailsPt: diag?.explanationPt,
        finalCancelledByRetryLimit: Boolean(job.data?.finalCancelledByRetryLimit),
        _fifoIdx: index,
      }
    })

    const modelDownloads = modelTagged.map(({ job, state }, index) => {
      const parsed = this.parseProgress(job.progress)
      const isFailed = state === 'failed' || Boolean(job.failedReason)
      const diag = isFailed
        ? diagnoseDownloadError(job.failedReason || 'Falha ao baixar modelo de IA')
        : null
      return {
        jobId: String(job.id ?? ''),
        url: job.data?.modelName || 'Modelo Desconhecido',
        progress: parsed.percent,
        filepath: job.data?.modelName || 'Modelo Desconhecido',
        filetype: 'model',
        status: (isFailed ? 'failed' : state) as 'active' | 'waiting' | 'delayed' | 'failed',
        failedReason: diag ? diag.summaryPt : job.failedReason || undefined,
        errorCode: diag?.code,
        errorSummaryPt: diag?.summaryPt,
        errorDetailsPt: diag?.explanationPt,
        _fifoIdx: index,
      }
    })

    const drugInFlight =
      drugTagged.find(({ state }) => state === 'active') ??
      drugTagged.find(({ state }) => state === 'waiting' || state === 'delayed') ??
      drugTagged.find(({ state }) => state === 'failed')
    const drugDownloads = drugInFlight
      ? [drugInFlight].map(({ job, state }, index) => {
          const parsed = this.parseProgress(job.progress)
          const diag =
            state === 'failed'
              ? diagnoseDownloadError(job.failedReason || 'Falha na base farmacológica')
              : null
          return {
            jobId: DownloadDrugDataJob.jobId,
            url: 'https://api.fda.gov/download.json',
            progress: parsed.percent,
            filepath: job.data?.currentPartName || 'Base Farmacológica OpenFDA',
            filetype: 'drug-data',
            title: 'Guia Farmacológico Offline',
            downloadedBytes: parsed.downloadedBytes,
            totalBytes: parsed.totalBytes,
            lastProgressTime: parsed.lastProgressTime,
            status: state,
            failedReason: diag ? diag.summaryPt : job.failedReason || undefined,
            errorCode: diag?.code,
            errorSummaryPt: diag?.summaryPt,
            errorDetailsPt: diag?.explanationPt,
            _fifoIdx: index,
          }
        })
      : []

    const allDownloads = [...fileDownloads, ...extractDownloads, ...modelDownloads, ...drugDownloads]
    const filtered = allDownloads.filter((job) => !filetype || job.filetype === filetype)
    const sorted = sortDownloadJobsFifo(filtered)
    const diskMap = await this.resolveDiskInfoMap(
      sorted.map((j) => j.filepath).filter((fp): fp is string => Boolean(fp))
    ).catch(() => new Map())

    return sorted.map((job) => {
      const info = job.filepath ? diskMap.get(job.filepath) : undefined
      return info
        ? {
            ...job,
            realFilepath: info.realPath,
            diskLabel: info.diskLabel,
            diskPath: info.diskPath,
          }
        : job
    })
  }

  async removeFailedJob(jobId: string): Promise<void> {
    for (const queueName of [
      RunDownloadJob.queue,
      RunExtractPmtilesJob.queue,
      DownloadModelJob.queue,
      DownloadDrugDataJob.queue,
    ]) {
      const queue = this.queueService.getQueue(queueName)
      const job = await queue.getJob(jobId)
      if (job) {
        try {
          await job.remove()
        } catch {
          // Job may be locked by the worker after cancel. Remove the stale lock and retry.
          try {
            const client = await queue.client
            await client.del(`bull:${queueName}:${jobId}:lock`)
            await job.remove()
          } catch {
            // Last resort: already removed or truly stuck
          }
        }
        return
      }
    }
  }

  async retryFailedJob(jobId: string): Promise<{ success: boolean; message: string }> {
    // Search file download queue, map extract queue, and model download queue
    for (const queueName of [
      RunDownloadJob.queue,
      RunExtractPmtilesJob.queue,
      DownloadModelJob.queue,
    ]) {
      const queue = this.queueService.getQueue(queueName)
      const job = await queue.getJob(jobId)

      if (job) {
        if (queueName === DownloadModelJob.queue) {
          const modelName = job.data.modelName
          if (!modelName) {
            return { success: false, message: 'Não foi possível reiniciar: nome do modelo ausente.' }
          }
          await job.remove().catch(() => {})
          await DownloadModelJob.dispatch({ modelName })
          await DownloadAuditService.record({
            jobId,
            url: modelName,
            filepath: modelName,
            title: modelName,
            filetype: 'model',
            eventType: 'retried_manual',
            attempt: 1,
            maxAttempts: 3,
            summaryPt: `Download do modelo ${modelName} reenviado para o final da fila pelo operador`,
          })
          return { success: true, message: `Modelo ${modelName} enviado para o final da fila.` }
        }

        if (queueName === RunExtractPmtilesJob.queue) {
          const extractParams = job.data as RunExtractPmtilesJobParams
          await repairDownloadDirectory(extractParams.outputFilepath).catch(() => {})
          await job.remove().catch(() => {})
          await RunExtractPmtilesJob.dispatch(extractParams)
          await DownloadAuditService.record({
            jobId,
            url: extractParams.sourceUrl,
            filepath: extractParams.outputFilepath,
            title: extractParams.title,
            filetype: 'map',
            eventType: 'retried_manual',
            attempt: 1,
            maxAttempts: 3,
            summaryPt: 'Extração de mapa validada e reenviada ao final da fila',
          })
          return { success: true, message: 'Extração de mapa reenviada ao final da fila.' }
        }

        const params = job.data as RunDownloadJobParams
        if (!params.url || !params.filepath) {
          return {
            success: false,
            message: 'Não foi possível reiniciar: URL ou destino ausentes no registro.',
          }
        }

        const diag = diagnoseDownloadError(job.failedReason || params.lastErrorPt || '', params.filepath)
        const repair = await repairDownloadDirectory(params.filepath).catch(() => ({
          repaired: false,
          notePt: undefined,
        }))

        await DownloadAuditService.record({
          jobId,
          url: params.url,
          filepath: params.filepath,
          title: params.title,
          filetype: params.filetype,
          eventType: 'retried_manual',
          attempt: 1,
          maxAttempts: 3,
          errorCode: diag.code,
          rawError: diag.rawMessage,
          summaryPt: `Erro validado e enviado ao final da fila pelo operador (${diag.summaryPt})`,
          detailsPt: [diag.explanationPt, repair.notePt].filter(Boolean).join(' '),
        })

        // Remove failed entry cleanly (clearing stale lock if present), then push fresh to FIFO tail
        await this._removeJobWithLockFallback(job, queue, queueName, jobId)
        await RunDownloadJob.dispatch({
          ...params,
          forceNew: false,
          timeout: Math.max(Number(params.timeout || 0), 120_000),
          retryAttempt: 1,
          maxRetries: 3,
          retryPolicyVersion: 2,
          lastErrorCode: diag.code,
          lastErrorPt: diag.summaryPt,
          lastErrorDetailsPt: diag.explanationPt,
          requeuedFromTailAt: new Date().toISOString(),
          finalCancelledByRetryLimit: false,
        })
        await this._syncWikipediaDownloadingState(params.url)
        return {
          success: true,
          message: `Erro validado (${diag.summaryPt}) e download enviado ao final da fila.`,
        }
      }
    }

    return {
      success: false,
      message: 'Registro de download com falha não encontrado (já pode ter sido removido).',
    }
  }

  /**
   * Preserves all active/waiting items ahead in the queue, recovers stale-lock active jobs,
   * promotes legacy delayed backoff jobs, and validates/re-queues failed downloads to the TAIL
   * of the queue (respecting active + waiting items ahead).
   */
  async resumeAllInterruptedDownloads(options?: {
    includePermanentMaxRetries?: boolean
    source?: 'boot' | 'manual'
  }): Promise<{ success: boolean; resumedCount: number; message: string }> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const extractQueue = this.queueService.getQueue(RunExtractPmtilesJob.queue)
    const includeFinal = options?.includePermanentMaxRetries ?? true
    const source = options?.source ?? 'manual'
    let resumedCount = 0

    // 1. Recover active jobs left with stale worker locks without discarding .tmp progress
    const activeJobs = await queue.getJobs(['active'])
    for (const job of activeJobs) {
      const params = job.data as RunDownloadJobParams
      if (!params?.url || !params?.filepath) continue
      const jobId = String(job.id ?? RunDownloadJob.getJobId(params.url))
      try {
        await repairDownloadDirectory(params.filepath).catch(() => {})
        await this._removeJobWithLockFallback(job, queue, RunDownloadJob.queue, jobId)
        await RunDownloadJob.dispatch({
          ...params,
          forceNew: false,
          timeout: Math.max(Number(params.timeout || 0), 120_000),
          retryAttempt: Number(params.retryAttempt || 1),
          maxRetries: Number(params.maxRetries || 3),
          retryPolicyVersion: 2,
          requeuedFromTailAt: new Date().toISOString(),
        })
        await DownloadAuditService.record({
          jobId,
          url: params.url,
          filepath: params.filepath,
          title: params.title,
          filetype: params.filetype,
          eventType: source === 'boot' ? 'boot_recovery' : 'retried_manual',
          attempt: Number(params.retryAttempt || 1),
          maxAttempts: 3,
          summaryPt:
            source === 'boot'
              ? 'Download ativo preservado após atualização/reinício do N.O.M.A.D.'
              : 'Download com trava órfã destravado e retomado',
          detailsPt: 'Arquivo parcial (.tmp) preservado. Retomando sem reiniciar do zero.',
        })
        resumedCount++
      } catch {}
    }

    // 2. Promote any old delayed backoff jobs so they don't sit hours idle
    const delayedJobs = await queue.getJobs(['delayed'])
    for (const job of delayedJobs) {
      try {
        await job.promote()
        resumedCount++
      } catch {}
    }

    // 3. Validate failed jobs and append them to the TAIL of the queue (after waiting items)
    const failedJobs = await queue.getJobs(['failed'])
    for (const job of failedJobs) {
      const params = job.data as RunDownloadJobParams
      if (!params?.url || !params?.filepath) continue
      const recovery = evaluateBootRecoveryAction(
        params,
        job.failedReason || params.lastErrorPt || '',
        includeFinal
      )
      if (recovery.action !== 'requeue_tail') continue
      const diag = recovery.diagnosis
      const jobId = String(job.id ?? RunDownloadJob.getJobId(params.url))

      try {
        const repair = await repairDownloadDirectory(params.filepath).catch((err: any) => ({
          repaired: false,
          notePt: `Aviso ao verificar pasta: ${err?.message || err}`,
        }))

        await DownloadAuditService.record({
          jobId,
          url: params.url,
          filepath: params.filepath,
          title: params.title,
          filetype: params.filetype,
          eventType: source === 'boot' ? 'boot_recovery' : 'retried_manual',
          attempt: 1,
          maxAttempts: 3,
          errorCode: diag.code,
          rawError: diag.rawMessage,
          summaryPt:
            source === 'boot'
              ? `Pós-atualização: falha validada (${diag.summaryPt}) e enviado ao final da fila`
              : `Validação manual: falha validada (${diag.summaryPt}) e enviado ao final da fila`,
          detailsPt: [
            `Causa identificada: ${diag.explanationPt}`,
            repair.notePt || 'Diretório de destino validado.',
            'Respeitando downloads ativos/na fila à frente; nova série de até 3 tentativas iniciada.',
          ].join(' '),
        })

        await this._removeJobWithLockFallback(job, queue, RunDownloadJob.queue, jobId)
        await RunDownloadJob.dispatch({
          ...params,
          forceNew: false,
          timeout: Math.max(Number(params.timeout || 0), 120_000),
          retryAttempt: 1,
          maxRetries: 3,
          retryPolicyVersion: 2,
          lastErrorCode: diag.code,
          lastErrorPt: diag.summaryPt,
          lastErrorDetailsPt: diag.explanationPt,
          requeuedFromTailAt: new Date().toISOString(),
          finalCancelledByRetryLimit: false,
        })
        await this._syncWikipediaDownloadingState(params.url)
        resumedCount++
      } catch {}
    }

    // 4. Also recover failed map extract jobs if eligible
    const failedExtracts = await extractQueue.getJobs(['failed'])
    for (const job of failedExtracts) {
      const params = job.data as RunExtractPmtilesJobParams
      if (!params?.sourceUrl || !params?.outputFilepath) continue
      const diag = diagnoseDownloadError(job.failedReason || '', params.outputFilepath)
      if (diag.code === 'USER_CANCELLED') continue
      try {
        await repairDownloadDirectory(params.outputFilepath).catch(() => {})
        await this._removeJobWithLockFallback(job, extractQueue, RunExtractPmtilesJob.queue, String(job.id ?? ''))
        await RunExtractPmtilesJob.dispatch(params)
        await DownloadAuditService.record({
          jobId: String(job.id ?? ''),
          url: params.sourceUrl,
          filepath: params.outputFilepath,
          title: params.title,
          filetype: 'map',
          eventType: source === 'boot' ? 'boot_recovery' : 'retried_manual',
          attempt: 1,
          maxAttempts: 3,
          errorCode: diag.code,
          rawError: diag.rawMessage,
          summaryPt: `Extração de mapa validada (${diag.summaryPt}) e enviada ao final da fila`,
          detailsPt: diag.explanationPt,
        })
        resumedCount++
      } catch {}
    }

    return {
      success: true,
      resumedCount,
      message:
        resumedCount > 0
          ? `${resumedCount} download(s) validado(s) e enfileirado(s) ao final da fila com sucesso.`
          : 'Nenhum download interrompido ou com erro pendente para retomada.',
    }
  }

  async getJobAuditLogs(jobId: string) {
    return DownloadAuditService.getLogsForJob(jobId)
  }

  async listGlobalAuditLogs(options?: {
    limit?: number
    filter?: 'all' | 'errors' | 'recovery' | 'completed'
    search?: string
  }) {
    return DownloadAuditService.listGlobalLogs(options)
  }

  async clearAuditLogs(jobId?: string) {
    return DownloadAuditService.clearLogs(jobId)
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const job = await queue.getJob(jobId)

    if (job) {
      return await this._cancelFileDownloadJob(jobId, job, queue)
    }

    const extractQueue = this.queueService.getQueue(RunExtractPmtilesJob.queue)
    const extractJob = await extractQueue.getJob(jobId)

    if (extractJob) {
      return await this._cancelExtractJob(jobId, extractJob, extractQueue)
    }

    const modelQueue = this.queueService.getQueue(DownloadModelJob.queue)
    const modelJob = await modelQueue.getJob(jobId)

    if (modelJob) {
      return await this._cancelModelDownloadJob(jobId, modelJob, modelQueue)
    }

    // FDA drug dataset: cancel is matched on the deterministic jobId only (the
    // single card the aggregator shows). The continuation parts run under
    // auto-generated ids, so cancelling must stop the whole CHAIN, not just the
    // current part — otherwise the next continuation fires after we remove one.
    if (jobId === DownloadDrugDataJob.jobId) {
      return await this._cancelDrugDownloadJob()
    }

    return { success: true, message: 'Job not found (may have already completed)' }
  }

  /**
   * Cancel the FDA drug-data download.
   *
   * The drug job has no Redis cancel-signal / AbortController (unlike
   * RunDownloadJob), and it self-continues into the next part under a fresh jobId.
   * So a v1 cancel that only removed the current job would leave the next
   * continuation to fire. Instead we obliterate the single-purpose drug-download
   * queue (force = removes the active/locked job too), which drops the current
   * part AND every queued continuation in one shot. Scoped to the drug-download
   * queue only — the ingest queue and everything else are untouched. The on-disk
   * parts are intentionally LEFT in place: they're resumable, and a re-trigger
   * picks up from the .tmp rather than re-downloading. (Tracked as the v1 choice
   * for cancel depth — full cross-process signal cancel is a follow-up.)
   */
  private async _cancelDrugDownloadJob(): Promise<{ success: boolean; message: string }> {
    const queue = this.queueService.getQueue(DownloadDrugDataJob.queue)
    try {
      await queue.obliterate({ force: true })
      return { success: true, message: 'Drug data download cancelled' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: `Could not cancel drug data download: ${msg}` }
    }
  }

  private async _cancelExtractJob(
    jobId: string,
    job: Job<RunExtractPmtilesJobParams>,
    queue: Queue<RunExtractPmtilesJobParams>
  ): Promise<{ success: boolean; message: string }> {
    const outputFilepath = job.data.outputFilepath

    await RunExtractPmtilesJob.signalCancel(jobId)

    // Same-process fallback when worker and API share a process
    RunExtractPmtilesJob.childProcesses.get(jobId)?.kill('SIGTERM')
    RunExtractPmtilesJob.childProcesses.delete(jobId)

    await this._pollForTerminalState(job, jobId)
    await this._removeJobWithLockFallback(job, queue, RunExtractPmtilesJob.queue, jobId)

    if (outputFilepath) {
      try {
        await deleteFileIfExists(outputFilepath)
      } catch {
        // File may not exist yet (subprocess may not have opened it)
      }
    }

    return { success: true, message: 'Extract cancelled and partial file deleted' }
  }

  /** Cancel a content download (zim, map, pmtiles, etc.) */
  private async _cancelFileDownloadJob(
    jobId: string,
    job: any,
    queue: any
  ): Promise<{ success: boolean; message: string }> {
    const filepath = job.data.filepath

    // Signal the worker process to abort the download via Redis
    await RunDownloadJob.signalCancel(jobId)

    // Also try in-memory abort (works if worker is in same process)
    RunDownloadJob.abortControllers.get(jobId)?.abort('user-cancel')
    RunDownloadJob.abortControllers.delete(jobId)

    await this._pollForTerminalState(job, jobId)
    await this._removeJobWithLockFallback(job, queue, RunDownloadJob.queue, jobId)

    await DownloadAuditService.record({
      jobId,
      url: job.data?.url,
      filepath,
      title: job.data?.title,
      filetype: job.data?.filetype,
      eventType: 'cancelled_user',
      attempt: Number(job.data?.retryAttempt ?? 1),
      maxAttempts: Number(job.data?.maxRetries ?? 3),
      errorCode: 'USER_CANCELLED',
      summaryPt: 'Download cancelado manualmente pelo operador',
      detailsPt: 'O download foi cancelado na fila e o arquivo parcial removido do disco.',
    })

    // Delete the partial file from disk
    if (filepath) {
      try {
        await deleteFileIfExists(filepath)
        // Also try .tmp in case PR #448 staging is merged
        await deleteFileIfExists(filepath + '.tmp')
      } catch {
        // File may not exist yet (waiting job)
      }
    }

    // If this was a Wikipedia download, update selection status to failed
    // (the worker's failed event may not fire if we removed the job first)
    if (job.data.filetype === 'zim' && job.data.url?.includes('wikipedia_')) {
      try {
        const { DockerService } = await import('#services/docker_service')
        const { ZimService } = await import('#services/zim_service')
        const dockerService = new DockerService()
        const zimService = new ZimService(dockerService)
        await zimService.onWikipediaDownloadComplete(job.data.url, false)
      } catch {
        // Best effort
      }
    }

    return { success: true, message: 'Download cancelled and partial file deleted' }
  }

  /** Cancel an Ollama model download — mirrors the file cancel pattern but skips file cleanup */
  private async _cancelModelDownloadJob(
    jobId: string,
    job: any,
    queue: any
  ): Promise<{ success: boolean; message: string }> {
    const modelName: string = job.data?.modelName ?? 'unknown'

    // Signal the worker process to abort the pull via Redis
    await DownloadModelJob.signalCancel(jobId)

    // Also try in-memory abort (works if worker is in same process)
    DownloadModelJob.abortControllers.get(jobId)?.abort('user-cancel')
    DownloadModelJob.abortControllers.delete(jobId)

    await this._pollForTerminalState(job, jobId)
    await this._removeJobWithLockFallback(job, queue, DownloadModelJob.queue, jobId)

    // Broadcast a cancelled event so the frontend hook clears the entry. We use percent: -2
    // (distinct from -1 = error) so the hook can route it to a 2s auto-clear instead of the
    // 15s error display. The frontend ALSO removes the entry optimistically from the API
    // response, so this is belt-and-suspenders for cases where the SSE arrives first.
    transmit.broadcast(BROADCAST_CHANNELS.OLLAMA_MODEL_DOWNLOAD, {
      model: modelName,
      jobId,
      percent: -2,
      status: 'cancelled',
      timestamp: new Date().toISOString(),
    })

    // Note on partial blob cleanup: Ollama manages model blobs internally at
    // /root/.ollama/models/blobs/. We deliberately do NOT call /api/delete here — Ollama's
    // expected behavior is to retain partial blobs so a re-pull resumes from where it left
    // off. If the user wants to reclaim that space, they can re-pull and let it complete,
    // or delete the partially-downloaded model from the AI Settings page.
    return { success: true, message: 'Model download cancelled' }
  }

  /** Wait up to 4s (250ms intervals) for the job to reach a terminal state */
  private async _pollForTerminalState(job: any, jobId: string): Promise<void> {
    const POLL_INTERVAL_MS = 250
    const POLL_TIMEOUT_MS = 4000
    const deadline = Date.now() + POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      try {
        const state = await job.getState()
        if (state === 'failed' || state === 'completed' || state === 'unknown') {
          return
        }
      } catch {
        return // getState() throws if job is already gone
      }
    }

    console.warn(
      `[DownloadService] cancelJob: job ${jobId} did not reach terminal state within timeout, removing anyway`
    )
  }

  /** Remove a BullMQ job, clearing a stale worker lock if the first attempt fails */
  private async _removeJobWithLockFallback(
    job: any,
    queue: any,
    queueName: string,
    jobId: string
  ): Promise<void> {
    try {
      await job.remove()
    } catch {
      // Lock contention fallback: clear lock and retry once
      try {
        const client = await queue.client
        await client.del(`bull:${queueName}:${jobId}:lock`)
        const updatedJob = await queue.getJob(jobId)
        if (updatedJob) await updatedJob.remove()
      } catch {
        // Best effort - job will be cleaned up on next dismiss attempt
      }
    }
  }

  private async _scanDirectoryForTemp(
    dirPath: string,
    category: string
  ): Promise<Array<{ name: string; tempPath: string; sizeBytes: number; modifiedAt: string; category: string }>> {
    const list: Array<{ name: string; tempPath: string; sizeBytes: number; modifiedAt: string; category: string }> = []
    if (!existsSync(dirPath)) return list
    try {
      const items = await readdir(dirPath, { withFileTypes: true })
      for (const item of items) {
        if (item.isFile()) {
          const lower = item.name.toLowerCase()
          if (lower.endsWith('.tmp') || lower.endsWith('.part') || lower.endsWith('.crdownload')) {
            const fullPath = join(dirPath, item.name)
            try {
              const fileStats = await stat(fullPath)
              const cleanName = item.name.replace(/\.(tmp|part|crdownload)$/i, '')
              list.push({
                name: cleanName,
                tempPath: fullPath,
                sizeBytes: Number(fileStats.size),
                modifiedAt: fileStats.mtime.toISOString(),
                category,
              })
            } catch {}
          }
        }
      }
    } catch {}
    return list
  }

  async listIncompleteDownloads(): Promise<{ files: IncompleteDownloadItem[]; totalBytes: number }> {
    const currentJobs = await this.listDownloadJobs()
    const baseRoots = new Set<string>([
      resolve(process.cwd(), 'storage'),
      '/storage',
      '/app/storage',
    ])
    if (process.env.STORAGE_PATH) {
      baseRoots.add(resolve(process.env.STORAGE_PATH))
    }
    try {
      const KVStore = (await import('#models/kv_store')).default
      const preferred = await KVStore.getValue('storage.preferredDownloadDisk')
      if (preferred && typeof preferred === 'string') {
        baseRoots.add(resolve(preferred))
      }
    } catch {}

    // Dynamically discover secondary disks mounted under /mnt, /media, /run/media
    for (const parent of ['/mnt', '/media', '/run/media']) {
      if (!existsSync(parent)) continue
      try {
        const subEntries = await readdir(parent, { withFileTypes: true })
        for (const sub of subEntries) {
          if (sub.isDirectory() || sub.isSymbolicLink()) {
            baseRoots.add(join(parent, sub.name))
          }
        }
      } catch {}
    }

    const categories = ['zim', 'maps', 'kb_uploads', 'books', 'media'] as const
    const candidateDirs: Array<{ path: string; category: string }> = []
    const seenCandidateRealPaths = new Set<string>()

    const addCandidate = async (dirPath: string, category: string) => {
      const resolvedDir = resolve(dirPath)
      const canonicalDir = await realpath(resolvedDir).catch(() => resolvedDir)
      if (!seenCandidateRealPaths.has(canonicalDir)) {
        seenCandidateRealPaths.add(canonicalDir)
        candidateDirs.push({ path: canonicalDir, category })
      }
    }

    for (const root of baseRoots) {
      for (const category of categories) {
        await addCandidate(join(root, category), category)
      }
    }

    // Include directories of any queued, active or failed download jobs
    for (const job of currentJobs) {
      const jobPath = job.realFilepath || job.filepath
      if (jobPath) {
        const jobDir = dirname(resolve(jobPath))
        const cat = categories.find((c) => jobDir.toLowerCase().includes(c)) || 'downloads'
        await addCandidate(jobDir, cat)
      }
    }

    const scannedFilesMap = new Map<
      string,
      { name: string; tempPath: string; realPath: string; sizeBytes: number; modifiedAt: string; category: string }
    >()

    for (const { path: dir, category } of candidateDirs) {
      const files = await this._scanDirectoryForTemp(dir, category)
      for (const f of files) {
        const canonicalTemp = await realpath(f.tempPath).catch(() => normalize(f.tempPath))
        const existing = scannedFilesMap.get(canonicalTemp)
        const isDirectPath = normalize(f.tempPath) === canonicalTemp
        if (!existing || isDirectPath) {
          scannedFilesMap.set(canonicalTemp, {
            ...f,
            tempPath: canonicalTemp,
            realPath: canonicalTemp,
          })
        }
      }
    }

    const diskMap = await this.resolveDiskInfoMap(Array.from(scannedFilesMap.keys())).catch(
      () => new Map()
    )

    const files: IncompleteDownloadItem[] = []
    let totalBytes = 0

    for (const rawFile of scannedFilesMap.values()) {
      const normPath = normalize(rawFile.realPath)
      const baseName = basename(normPath)

      // Check matching job in BullMQ
      const matchingJob = currentJobs.find((job) => {
        if (!job.filepath) return false
        const expectedTempRaw = normalize(job.filepath + '.tmp')
        const expectedTempReal = job.realFilepath ? normalize(job.realFilepath + '.tmp') : expectedTempRaw
        return (
          normPath === expectedTempReal ||
          normPath === expectedTempRaw ||
          baseName === basename(expectedTempRaw) ||
          baseName.startsWith(basename(job.filepath))
        )
      })

      let status: 'active' | 'queued' | 'orphaned' = 'orphaned'
      if (matchingJob) {
        if (matchingJob.status === 'active') {
          status = 'active'
        } else if (matchingJob.status === 'waiting' || matchingJob.status === 'delayed') {
          status = 'queued'
        } else {
          status = 'orphaned'
        }
      }

      const diskInfo = diskMap.get(rawFile.realPath)
      totalBytes += rawFile.sizeBytes
      files.push({
        name: rawFile.name,
        tempPath: rawFile.tempPath,
        realPath: diskInfo?.realPath || rawFile.realPath,
        diskLabel: diskInfo?.diskLabel,
        diskPath: diskInfo?.diskPath,
        sizeBytes: rawFile.sizeBytes,
        modifiedAt: rawFile.modifiedAt,
        category: rawFile.category,
        status,
        jobId: matchingJob?.jobId,
      })
    }

    // Sort: orphaned first, then descending by size
    files.sort((a, b) => {
      if (a.status === 'orphaned' && b.status !== 'orphaned') return -1
      if (a.status !== 'orphaned' && b.status === 'orphaned') return 1
      return b.sizeBytes - a.sizeBytes
    })

    return { files, totalBytes }
  }

  async deleteIncompleteDownload(tempPath: string): Promise<{ success: boolean; message: string }> {
    if (!tempPath) {
      return { success: false, message: 'Caminho do arquivo não fornecido.' }
    }

    const norm = resolve(tempPath)
    const realNorm = await realpath(norm).catch(() => norm)
    const lower = norm.toLowerCase()
    if (!lower.endsWith('.tmp') && !lower.endsWith('.part') && !lower.endsWith('.crdownload')) {
      return { success: false, message: 'Operação recusada: apenas arquivos temporários (.tmp, .part) podem ser excluídos.' }
    }

    const allowedRoots = [
      resolve(process.cwd(), 'storage'),
      resolve('/storage'),
      resolve('/app/storage'),
      resolve('/mnt'),
      resolve('/media'),
      resolve('/run/media'),
      ...(process.env.STORAGE_PATH ? [resolve(process.env.STORAGE_PATH)] : []),
    ]
    const inAllowedRoot = allowedRoots.some(
      (root) =>
        norm.startsWith(root + '/') ||
        norm.startsWith(root + '\\') ||
        realNorm.startsWith(root + '/') ||
        realNorm.startsWith(root + '\\')
    )
    if (!inAllowedRoot) {
      return {
        success: false,
        message: 'Operação recusada: caminho fora dos diretórios de armazenamento permitidos.',
      }
    }

    // Check if an active job is writing to this file
    const currentJobs = await this.listDownloadJobs()
    const activeMatch = currentJobs.find((j) => {
      if (!j.filepath || j.status !== 'active') return false
      const expected = resolve(j.filepath + '.tmp')
      const expectedReal = j.realFilepath ? resolve(j.realFilepath + '.tmp') : expected
      return (
        norm === expected ||
        realNorm === expectedReal ||
        basename(norm) === basename(expected)
      )
    })

    if (activeMatch) {
      return {
        success: false,
        message: 'Este arquivo está sendo baixado ativamente no momento. Cancele o download antes de excluí-lo.',
      }
    }

    try {
      await deleteFileIfExists(norm)
      return { success: true, message: 'Arquivo temporário excluído com sucesso.' }
    } catch (err: any) {
      return { success: false, message: `Erro ao excluir: ${err?.message || String(err)}` }
    }
  }

  async clearOrphanedIncompleteDownloads(): Promise<{ success: boolean; count: number; freedBytes: number; message: string }> {
    const { files } = await this.listIncompleteDownloads()
    const orphaned = files.filter((f) => f.status === 'orphaned')

    let count = 0
    let freedBytes = 0

    for (const f of orphaned) {
      try {
        await deleteFileIfExists(f.tempPath)
        count++
        freedBytes += f.sizeBytes
      } catch {}
    }

    return {
      success: true,
      count,
      freedBytes,
      message: `${count} arquivo(s) temporário(s) órfão(s) excluído(s). Espaço liberado.`,
    }
  }
}
