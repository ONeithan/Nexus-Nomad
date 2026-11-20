import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'
import queueConfig from '#config/queue'
import { RunDownloadJob } from '#jobs/run_download_job'
import { RunExtractPmtilesJob } from '#jobs/run_extract_pmtiles_job'
import { DownloadModelJob } from '#jobs/download_model_job'
import { RunBenchmarkJob } from '#jobs/run_benchmark_job'
import { EmbedFileJob } from '#jobs/embed_file_job'
import { CheckUpdateJob } from '#jobs/check_update_job'
import { CheckServiceUpdatesJob } from '#jobs/check_service_updates_job'
import { AutoUpdateJob } from '#jobs/auto_update_job'
import { AppAutoUpdateJob } from '#jobs/app_auto_update_job'
import { ContentAutoUpdateJob } from '#jobs/content_auto_update_job'
import { DownloadDrugDataJob } from '#jobs/download_drug_data_job'
import { IngestDrugDataJob } from '#jobs/ingest_drug_data_job'
import { stallOptionsForQueue, type StallOptions } from '../../app/utils/queue_stall_options.js'
import { diagnoseDownloadError } from '../../app/utils/download_diagnostics.js'
import { repairDownloadDirectory } from '../../app/utils/fs.js'
import { DownloadAuditService } from '#services/download_audit_service'
import type { RunDownloadJobParams } from '../../types/downloads.js'

export default class QueueWork extends BaseCommand {
  static commandName = 'queue:work'
  static description = 'Start processing jobs from the queue'

  @flags.string({ description: 'Queue name to process' })
  declare queue: string

  @flags.boolean({ description: 'Process all queues automatically' })
  declare all: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    // Validate that either --queue or --all is provided
    if (!this.queue && !this.all) {
      this.logger.error('You must specify either --queue=<name> or --all')
      process.exit(1)
    }

    if (this.queue && this.all) {
      this.logger.error('Cannot specify both --queue and --all flags')
      process.exit(1)
    }

    const [jobHandlers, allQueues] = await this.loadJobHandlers()

    // Determine which queues to process
    const queuesToProcess = this.all ? Array.from(allQueues.values()) : [this.queue]

    this.logger.info(`Starting workers for queues: ${queuesToProcess.join(', ')}`)

    // Recover active/interrupted items and validate legacy failed downloads BEFORE starting workers,
    // so queued items stay at the head and validated failed items enter cleanly at the tail.
    await this.autoResumeInterruptedDownloads()

    const workers: Worker[] = []

    // Create a worker for each queue
    for (const queueName of queuesToProcess) {
      const stall = this.getStallOptionsForQueue(queueName)
      const worker = new Worker(
        queueName,
        async (job) => {
          this.logger.info(`[${queueName}] Processing job: ${job.id} of type: ${job.name}`)
          const jobHandler = jobHandlers.get(job.name)
          if (!jobHandler) {
            throw new Error(`No handler found for job: ${job.name}`)
          }

          return await jobHandler.handle(job)
        },
        {
          connection: queueConfig.connection,
          concurrency: this.getConcurrencyForQueue(queueName),
          // lockDuration/maxStalledCount are per-queue — see
          // getStallOptionsForQueue for which queues override the default
          // (300000, BullMQ's default maxStalledCount) and why. Queues without
          // an entry there are unaffected.
          lockDuration: stall.lockDuration,
          ...(stall.maxStalledCount !== undefined
            ? { maxStalledCount: stall.maxStalledCount }
            : {}),
          autorun: true,
        }
      )

      // Required to prevent Node from treating BullMQ internal errors as unhandled
      // EventEmitter errors that crash the process.
      worker.on('error', (err) => {
        this.logger.error(`[${queueName}] Worker error: ${err.message}`)
      })

      worker.on('failed', async (job, err) => {
        this.logger.error(`[${queueName}] Job failed: ${job?.id}, Error: ${err.message}`)

        let isTerminal = (job?.attemptsMade ?? 0) >= (job?.opts?.attempts ?? 1)

        if (job?.name === RunDownloadJob.key && job?.data) {
          const params = job.data as RunDownloadJobParams
          const jobId = String(job.id ?? RunDownloadJob.getJobId(params.url || ''))
          const attempt = Number(params.retryAttempt ?? 1)
          const maxRetries = Number(params.maxRetries ?? 3)
          const diag = diagnoseDownloadError(err, params.filepath)

          if (diag.retryable && attempt < maxRetries && params.url && params.filepath) {
            // Do not fire terminal DB failure callbacks while retries remain
            isTerminal = false
            try {
              const repair = diag.autoReparable
                ? await repairDownloadDirectory(params.filepath).catch(() => ({
                    repaired: false,
                    notePt: undefined,
                  }))
                : { repaired: false, notePt: undefined }

              const nextAttempt = attempt + 1
              await DownloadAuditService.record({
                jobId,
                url: params.url,
                filepath: params.filepath,
                title: params.title,
                filetype: params.filetype,
                eventType: 'failed_attempt',
                attempt,
                maxAttempts: maxRetries,
                errorCode: diag.code,
                rawError: diag.rawMessage,
                summaryPt: `Falha na tentativa ${attempt}/${maxRetries}: ${diag.summaryPt}`,
                detailsPt: [diag.explanationPt, repair.notePt].filter(Boolean).join(' '),
              })

              const { QueueService } = await import('#services/queue_service')
              const dlQueue = QueueService.getInstance().getQueue(RunDownloadJob.queue)
              try {
                await job.remove()
              } catch {
                const client = await dlQueue.client
                await client.del(`bull:${RunDownloadJob.queue}:${jobId}:lock`).catch(() => {})
                const freshJob = await dlQueue.getJob(jobId)
                await freshJob?.remove().catch(() => {})
              }

              await RunDownloadJob.dispatch({
                ...params,
                timeout: Math.max(Number(params.timeout || 0), 120_000),
                forceNew: false,
                retryAttempt: nextAttempt,
                maxRetries,
                retryPolicyVersion: 2,
                lastErrorCode: diag.code,
                lastErrorPt: diag.summaryPt,
                lastErrorDetailsPt: diag.explanationPt,
                requeuedFromTailAt: new Date().toISOString(),
                finalCancelledByRetryLimit: false,
              })

              await DownloadAuditService.record({
                jobId,
                url: params.url,
                filepath: params.filepath,
                title: params.title,
                filetype: params.filetype,
                eventType: 'requeued_tail',
                attempt: nextAttempt,
                maxAttempts: maxRetries,
                errorCode: diag.code,
                summaryPt: `Enviado ao final da fila (Tentativa ${nextAttempt}/${maxRetries}) — ${diag.summaryPt}`,
                detailsPt: `Causa do desvio para o fim da fila: ${diag.explanationPt} Os downloads já presentes na fila continuarão normalmente antes desta nova tentativa.`,
              })
              this.logger.info(
                `[downloads] Requeued ${jobId} to tail (${nextAttempt}/${maxRetries}) after: ${diag.code}`
              )
              return
            } catch (requeueErr: any) {
              this.logger.error(
                `[downloads] Failed to requeue ${jobId} to tail: ${requeueErr?.message}`
              )
            }
          }

          // Reached max 3 attempts OR non-retryable error (user cancel / auth / ENOSPC)
          isTerminal = true
          await job
            .updateData({
              ...params,
              retryAttempt: attempt,
              maxRetries,
              retryPolicyVersion: 2,
              lastErrorCode: diag.code,
              lastErrorPt: diag.summaryPt,
              lastErrorDetailsPt: diag.explanationPt,
              finalCancelledByRetryLimit: diag.retryable && attempt >= maxRetries,
            })
            .catch(() => {})

          await DownloadAuditService.record({
            jobId,
            url: params.url,
            filepath: params.filepath,
            title: params.title,
            filetype: params.filetype,
            eventType: diag.code === 'USER_CANCELLED' ? 'cancelled_user' : 'cancelled_max_retries',
            attempt,
            maxAttempts: maxRetries,
            errorCode: diag.code,
            rawError: diag.rawMessage,
            summaryPt:
              diag.code === 'USER_CANCELLED'
                ? 'Download cancelado pelo operador'
                : diag.retryable
                  ? `Cancelado definitivamente após ${attempt}/${maxRetries} tentativas — ${diag.summaryPt}`
                  : `Interrompido (${diag.summaryPt})`,
            detailsPt: `${diag.explanationPt} ${diag.actionHintPt}`,
          })
        }

        // If this was a Wikipedia download and all retries are exhausted, mark failed in DB
        if (isTerminal && job?.data?.filetype === 'zim' && job?.data?.url?.includes('wikipedia_')) {
          try {
            const { DockerService } = await import('#services/docker_service')
            const { ZimService } = await import('#services/zim_service')
            const dockerService = new DockerService()
            const zimService = new ZimService(dockerService)
            await zimService.onWikipediaDownloadComplete(job.data.url, false)
          } catch (e: any) {
            this.logger.error(
              `[${queueName}] Failed to update Wikipedia status: ${e.message}`
            )
          }
        }

        // Terminal failure of an AUTO content update → advance that resource's backoff
        const meta = job?.data?.resourceMetadata
        if (job?.name === RunDownloadJob.key && meta?.auto === true && isTerminal) {
          try {
            const { default: InstalledResource } = await import('#models/installed_resource')
            const { recordResourceUpdateFailure } = await import(
              '../../app/utils/content_auto_update_backoff.js'
            )
            const resource = await InstalledResource.query()
              .where('resource_id', meta.resource_id)
              .where('resource_type', job.data.filetype)
              .first()
            if (resource) {
              await recordResourceUpdateFailure(
                resource,
                err instanceof Error ? err.message : String(err)
              )
            }
          } catch (e: any) {
            this.logger.error(
              `[${queueName}] Failed to record content auto-update backoff: ${e.message}`
            )
          }
        }
      })

      worker.on('completed', (job) => {
        this.logger.info(`[${queueName}] Job completed: ${job.id}`)
      })

      workers.push(worker)
      this.logger.info(`Worker started for queue: ${queueName}`)
    }

    // Schedule nightly update checks (idempotent, will persist over restarts)
    await CheckUpdateJob.scheduleNightly()
    await CheckServiceUpdatesJob.scheduleNightly()
    await AutoUpdateJob.schedule()
    await AppAutoUpdateJob.schedule()
    await ContentAutoUpdateJob.schedule()

    // Safety net: log unhandled rejections instead of crashing the worker process.
    // Individual job errors are already caught by BullMQ; this catches anything that
    // escapes (e.g. a fire-and-forget promise in a callback that rejects unexpectedly).
    process.on('unhandledRejection', (reason) => {
      this.logger.error(
        `Unhandled promise rejection in worker process: ${reason instanceof Error ? reason.message : String(reason)}`
      )
    })

    // Graceful shutdown for all workers
    process.on('SIGTERM', async () => {
      this.logger.info('SIGTERM received. Shutting down workers...')
      await Promise.all(workers.map((worker) => worker.close()))
      this.logger.info('All workers shut down gracefully.')
      process.exit(0)
    })
  }

  private async loadJobHandlers(): Promise<[Map<string, any>, Map<string, string>]> {
    const handlers = new Map<string, any>()
    const queues = new Map<string, string>()

    handlers.set(RunDownloadJob.key, new RunDownloadJob())
    handlers.set(RunExtractPmtilesJob.key, new RunExtractPmtilesJob())
    handlers.set(DownloadModelJob.key, new DownloadModelJob())
    handlers.set(RunBenchmarkJob.key, new RunBenchmarkJob())
    handlers.set(EmbedFileJob.key, new EmbedFileJob())
    handlers.set(CheckUpdateJob.key, new CheckUpdateJob())
    handlers.set(CheckServiceUpdatesJob.key, new CheckServiceUpdatesJob())
    handlers.set(AutoUpdateJob.key, new AutoUpdateJob())
    handlers.set(AppAutoUpdateJob.key, new AppAutoUpdateJob())
    handlers.set(ContentAutoUpdateJob.key, new ContentAutoUpdateJob())
    handlers.set(DownloadDrugDataJob.key, new DownloadDrugDataJob())
    handlers.set(IngestDrugDataJob.key, new IngestDrugDataJob())

    queues.set(RunDownloadJob.key, RunDownloadJob.queue)
    queues.set(RunExtractPmtilesJob.key, RunExtractPmtilesJob.queue)
    queues.set(DownloadModelJob.key, DownloadModelJob.queue)
    queues.set(RunBenchmarkJob.key, RunBenchmarkJob.queue)
    queues.set(EmbedFileJob.key, EmbedFileJob.queue)
    queues.set(CheckUpdateJob.key, CheckUpdateJob.queue)
    queues.set(CheckServiceUpdatesJob.key, CheckServiceUpdatesJob.queue)
    queues.set(AutoUpdateJob.key, AutoUpdateJob.queue)
    queues.set(AppAutoUpdateJob.key, AppAutoUpdateJob.queue)
    queues.set(ContentAutoUpdateJob.key, ContentAutoUpdateJob.queue)
    queues.set(DownloadDrugDataJob.key, DownloadDrugDataJob.queue)
    queues.set(IngestDrugDataJob.key, IngestDrugDataJob.queue)

    return [handlers, queues]
  }

  /**
   * Per-queue BullMQ stall-recovery options. See `queue_stall_options.ts` for
   * the reasoning behind each queue's entry; the decision itself is kept pure
   * and unit-tested there.
   */
  private getStallOptionsForQueue(queueName: string): StallOptions {
    return stallOptionsForQueue(queueName, {
      embedFile: EmbedFileJob.queue,
      download: RunDownloadJob.queue,
      drugDownload: DownloadDrugDataJob.queue,
      drugIngest: IngestDrugDataJob.queue,
    })
  }

  /**
   * Get concurrency setting for a specific queue
   * Can be customized per queue based on workload characteristics
   */
  private getConcurrencyForQueue(queueName: string): number {
    const concurrencyMap: Record<string, number> = {
      [RunDownloadJob.queue]: 3,
      // pmtiles extract hits the Protomaps CDN with many parallel range reads per job;
      // cap concurrency at 2 so a second extract doesn't starve the first.
      [RunExtractPmtilesJob.queue]: 2,
      [DownloadModelJob.queue]: 2, // Lower concurrency for resource-intensive model downloads
      [RunBenchmarkJob.queue]: 1, // Run benchmarks one at a time for accurate results
      [EmbedFileJob.queue]: 2, // Lower concurrency for embedding jobs, can be resource intensive
      [CheckUpdateJob.queue]: 1, // No need to run more than one update check at a time
      // Drug download: one part at a time — a ~150 MB resumable HTTP pull per
      // part, no benefit to parallelism and easier on the storage volume.
      [DownloadDrugDataJob.queue]: 1,
      // Drug ingest: one heavy stream at a time — unzipping + parsing ~150 MB
      // of JSON into batched DB inserts; serial keeps memory bounded.
      [IngestDrugDataJob.queue]: 1,
      default: 3,
    }

    return concurrencyMap[queueName] || concurrencyMap.default
  }

  private async autoResumeInterruptedDownloads(): Promise<void> {
    try {
      const { QueueService } = await import('#services/queue_service')
      const { DownloadService } = await import('#services/download_service')
      const downloadService = new DownloadService(QueueService.getInstance())
      const result = await downloadService.resumeAllInterruptedDownloads({
        includePermanentMaxRetries: false,
        source: 'boot',
      })
      if (result.resumedCount > 0) {
        this.logger.info(`[QueueWork] ${result.message}`)
      }
    } catch (err: any) {
      this.logger.error(`[QueueWork] Error during auto-resume on startup: ${err?.message}`)
    }
  }
}
