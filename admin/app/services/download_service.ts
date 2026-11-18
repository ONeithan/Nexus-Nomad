import { inject } from '@adonisjs/core'
import { QueueService } from './queue_service.js'
import { RunDownloadJob } from '#jobs/run_download_job'
import { RunExtractPmtilesJob } from '#jobs/run_extract_pmtiles_job'
import type { RunExtractPmtilesJobParams } from '#jobs/run_extract_pmtiles_job'
import { DownloadModelJob } from '#jobs/download_model_job'
import { DownloadDrugDataJob } from '#jobs/download_drug_data_job'
import { DownloadJobWithProgress, DownloadProgressData, IncompleteDownloadItem, RunDownloadJobParams } from '../../types/downloads.js'
import type { Job, Queue } from 'bullmq'
import { normalize, join, basename, resolve } from 'node:path'
import { readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { deleteFileIfExists } from '../utils/fs.js'
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

  /** Fetch all non-completed jobs from a queue, tagged with their current BullMQ state */
  private async fetchJobsWithStates(queueName: string): Promise<TaggedJob[]> {
    const queue = this.queueService.getQueue(queueName)
    const [waiting, active, delayed, failed] = await Promise.all([
      queue.getJobs(['waiting']),
      queue.getJobs(['active']),
      queue.getJobs(['delayed']),
      queue.getJobs(['failed']),
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

  async listDownloadJobs(filetype?: string): Promise<DownloadJobWithProgress[]> {
    const safeFetch = (queueName: string) =>
      this.fetchJobsWithStates(queueName).catch(() => [] as TaggedJob[])

    const [fileTagged, extractTagged, modelTagged, drugTagged] = await Promise.all([
      safeFetch(RunDownloadJob.queue),
      safeFetch(RunExtractPmtilesJob.queue),
      safeFetch(DownloadModelJob.queue),
      safeFetch(DownloadDrugDataJob.queue),
    ])

    const fileDownloads = fileTagged.map(({ job, state }) => {
      const parsed = this.parseProgress(job.progress)
      return {
        jobId: String(job.id ?? ''),
        url: job.data?.url || '',
        progress: parsed.percent,
        filepath: job.data?.filepath ? normalize(job.data.filepath) : '',
        filetype: job.data?.filetype,
        title: job.data?.title || undefined,
        downloadedBytes: parsed.downloadedBytes,
        totalBytes: parsed.totalBytes || job.data?.totalBytes || undefined,
        lastProgressTime: parsed.lastProgressTime,
        status: state,
        failedReason: job.failedReason || undefined,
      }
    })

    const extractDownloads = extractTagged.map(({ job, state }) => {
      const parsed = this.parseProgress(job.progress)
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
        failedReason: job.failedReason || undefined,
      }
    })

    const modelDownloads = modelTagged.map(({ job, state }) => {
      const parsed = this.parseProgress(job.progress)
      return {
        jobId: String(job.id ?? ''),
        url: job.data?.modelName || 'Unknown Model',
        progress: parsed.percent,
        filepath: job.data?.modelName || 'Unknown Model',
        filetype: 'model',
        status: (state === 'failed' || job.failedReason ? 'failed' : 'active') as 'active' | 'failed',
        failedReason: job.failedReason || undefined,
      }
    })

    const drugInFlight =
      drugTagged.find(({ state }) => state === 'active') ??
      drugTagged.find(({ state }) => state === 'waiting' || state === 'delayed') ??
      drugTagged.find(({ state }) => state === 'failed')
    const drugDownloads = drugInFlight
      ? [drugInFlight].map(({ job, state }) => {
          const parsed = this.parseProgress(job.progress)
          return {
            jobId: DownloadDrugDataJob.jobId,
            url: 'https://api.fda.gov/download.json',
            progress: parsed.percent,
            filepath: job.data?.currentPartName || 'FDA Drug Reference',
            filetype: 'drug-data',
            title: 'FDA Drug Reference',
            downloadedBytes: parsed.downloadedBytes,
            totalBytes: parsed.totalBytes,
            lastProgressTime: parsed.lastProgressTime,
            status: state,
            failedReason: job.failedReason || undefined,
          }
        })
      : []

    const allDownloads = [...fileDownloads, ...extractDownloads, ...modelDownloads, ...drugDownloads]
    const filtered = allDownloads.filter((job) => !filetype || job.filetype === filetype)

    return filtered.sort((a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return 1
      if (a.status !== 'failed' && b.status === 'failed') return -1
      return b.progress - a.progress
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
    // Search both the file download queue and the model download queue
    for (const queueName of [RunDownloadJob.queue, DownloadModelJob.queue]) {
      const queue = this.queueService.getQueue(queueName)
      const job = await queue.getJob(jobId)

      if (job) {
        // For Ollama model downloads, re-dispatch with the model name
        if (queueName === DownloadModelJob.queue) {
          const modelName = job.data.modelName
          if (!modelName) {
            return { success: false, message: 'Cannot retry: model name not found in job data' }
          }
          // Remove the old failed job first, then dispatch a fresh one. The
          // model jobId is a hash of the model name, so dispatching first meant
          // this remove() targeted the job we had just enqueued under that same
          // id rather than the old record, deleting the retry we were creating.
          // Matches the file-download branch below.
          await job.remove().catch(() => {})
          await DownloadModelJob.dispatch({ modelName })
          return { success: true, message: `Retrying download for model ${modelName}` }
        }

        // For file downloads (zim, map, etc.), re-dispatch with original params
        const params = job.data as RunDownloadJobParams
        if (!params.url || !params.filepath) {
          return { success: false, message: 'Cannot retry: missing URL or filepath in job data' }
        }

        // Remove the old failed job, then dispatch a fresh one
        await job.remove().catch(() => {})
        await RunDownloadJob.dispatch(params)
        return { success: true, message: `Retrying download for ${params.url}` }
      }
    }

    return { success: false, message: 'Failed job not found. It may have already been dismissed.' }
  }

  async resumeAllInterruptedDownloads(): Promise<{ success: boolean; resumedCount: number; message: string }> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    let resumedCount = 0

    // 1. Recover active jobs with stale locks
    const activeJobs = await queue.getJobs(['active'])
    for (const job of activeJobs) {
      const params = job.data as RunDownloadJobParams
      if (params && params.url && params.filepath) {
        try {
          const client = await queue.client
          await client.del(`bull:${RunDownloadJob.queue}:${job.id}:lock`)
          await job.remove().catch(() => {})
          await RunDownloadJob.dispatch(params)
          resumedCount++
        } catch {}
      }
    }

    // 2. Recover failed jobs
    const failedJobs = await queue.getJobs(['failed'])
    for (const job of failedJobs) {
      const params = job.data as RunDownloadJobParams
      if (params && params.url && params.filepath) {
        try {
          await job.remove().catch(() => {})
          await RunDownloadJob.dispatch(params)
          resumedCount++
        } catch {}
      }
    }

    return {
      success: true,
      resumedCount,
      message: `${resumedCount} download(s) retomado(s) com sucesso.`,
    }
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
    if (job.data.filetype === 'zim' && job.data.url?.includes('wikipedia_en_')) {
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
    const seenCandidatePaths = new Set<string>()
    const { dirname } = await import('node:path')
    const { realpath } = await import('node:fs/promises')

    const addCandidate = async (dirPath: string, category: string) => {
      const resolvedDir = resolve(dirPath)
      if (!seenCandidatePaths.has(resolvedDir)) {
        seenCandidatePaths.add(resolvedDir)
        candidateDirs.push({ path: resolvedDir, category })
      }
      try {
        const real = await realpath(resolvedDir)
        if (real && !seenCandidatePaths.has(real)) {
          seenCandidatePaths.add(real)
          candidateDirs.push({ path: real, category })
        }
      } catch {}
    }

    for (const root of baseRoots) {
      for (const category of categories) {
        await addCandidate(join(root, category), category)
      }
    }

    // Include directories of any queued, active or failed download jobs
    for (const job of currentJobs) {
      if (job.filepath) {
        const jobDir = dirname(resolve(job.filepath))
        const cat = categories.find((c) => jobDir.toLowerCase().includes(c)) || 'downloads'
        await addCandidate(jobDir, cat)
      }
    }

    const scannedFilesMap = new Map<string, { name: string; tempPath: string; sizeBytes: number; modifiedAt: string; category: string }>()

    for (const { path: dir, category } of candidateDirs) {
      const files = await this._scanDirectoryForTemp(dir, category)
      for (const f of files) {
        const normKey = normalize(f.tempPath)
        if (!scannedFilesMap.has(normKey)) {
          scannedFilesMap.set(normKey, f)
        }
      }
    }

    const files: IncompleteDownloadItem[] = []
    let totalBytes = 0

    for (const rawFile of scannedFilesMap.values()) {
      const normPath = normalize(rawFile.tempPath)
      const baseName = basename(normPath)

      // Check matching job in BullMQ
      const matchingJob = currentJobs.find((job) => {
        if (!job.filepath) return false
        const expectedTemp = normalize(job.filepath + '.tmp')
        return (
          normPath === expectedTemp ||
          baseName === basename(expectedTemp) ||
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

      totalBytes += rawFile.sizeBytes
      files.push({
        ...rawFile,
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
      (root) => norm.startsWith(root + '/') || norm.startsWith(root + '\\')
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
      return norm === expected || basename(norm) === basename(expected)
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
