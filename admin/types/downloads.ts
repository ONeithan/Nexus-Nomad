export type DoResumableDownloadParams = {
  url: string
  filepath: string
  timeout: number
  allowedMimeTypes: string[]
  signal?: AbortSignal
  onProgress?: (progress: DoResumableDownloadProgress) => void
  onComplete?: (url: string, path: string) => void | Promise<void>
  forceNew?: boolean
  /**
   * Extra HTTP request headers sent on BOTH the HEAD probe and the GET stream.
   * Used by Creator Packs to carry the `Authorization: Bearer <APP_KEY>` the
   * entitlement Worker requires; the Range header still composes on top for
   * resumed downloads. Kept generic so any gated source can reuse it.
   */
  requestHeaders?: Record<string, string>
}

export type DoResumableDownloadWithRetryParams = DoResumableDownloadParams & {
  max_retries?: number
  retry_delay?: number
  onAttemptError?: (error: Error, attempt: number) => void
}

export type DoResumableDownloadProgress = {
  downloadedBytes: number
  totalBytes: number
  lastProgressTime: number
  lastDownloadedBytes: number
  url: string
}

export type DownloadProgressData = {
  percent: number
  downloadedBytes: number
  totalBytes: number
  lastProgressTime: number
}

export type RunDownloadJobParams = Omit<
  DoResumableDownloadParams,
  'onProgress' | 'onComplete' | 'signal'
> & {
  filetype: string
  title?: string
  totalBytes?: number
  /** Smart tail-requeue retry tracking (max 3 attempts). */
  retryAttempt?: number
  maxRetries?: number
  /** Marks jobs managed under v1.0.36 smart-queue policy (2) so legacy failed jobs recover once on boot. */
  retryPolicyVersion?: number
  lastErrorCode?: string
  lastErrorPt?: string
  lastErrorDetailsPt?: string
  requeuedFromTailAt?: string
  finalCancelledByRetryLimit?: boolean
  resourceMetadata?: {
    resource_id: string
    version: string
    collection_ref: string | null
    /**
     * True only when this download was initiated by the content auto-updater.
     * Gates the per-resource auto-update backoff (success reset in
     * RunDownloadJob.onComplete, terminal-failure increment in the worker
     * `failed` handler) so manual downloads never touch the counter.
     */
    auto?: boolean
    /**
     * Skip the RAG/knowledge-base ingestion branch in RunDownloadJob.onComplete.
     * Set for video ZIMs (Creator Packs) — they are media galleries, not text,
     * and must never be dispatched to EmbedFileJob or the replacement-reconcile
     * path. The Kiwix rebuild still runs so the pack appears in the grid.
     */
    skip_embedding?: boolean
  }
}

export type DownloadJobWithProgress = {
  jobId: string
  url: string
  progress: number
  filepath: string
  filetype: string
  title?: string
  downloadedBytes?: number
  totalBytes?: number
  lastProgressTime?: number
  status?: 'active' | 'waiting' | 'delayed' | 'failed'
  failedReason?: string
  /** Smart retry + PT-BR diagnostics */
  attempt?: number
  maxAttempts?: number
  errorCode?: string
  errorSummaryPt?: string
  errorDetailsPt?: string
  requeueReason?: string
  finalCancelledByRetryLimit?: boolean
}

export type DownloadAuditLogEntry = {
  id: number
  jobId: string
  url?: string
  filepath?: string
  title?: string
  filetype?: string
  eventType: string
  attempt: number
  maxAttempts: number
  errorCode?: string
  rawError?: string
  summaryPt: string
  detailsPt?: string
  createdAt: string
}

export type IncompleteDownloadItem = {
  name: string
  tempPath: string
  sizeBytes: number
  modifiedAt: string
  category: string
  status: 'active' | 'queued' | 'orphaned'
  jobId?: string
}

// Wikipedia selector types
export type WikipediaOption = {
  id: string
  name: string
  description: string
  size_mb: number
  url: string | null
}

export type WikipediaOptionsFile = {
  options: WikipediaOption[]
}

export type WikipediaCurrentSelection = {
  optionId: string
  status: 'none' | 'downloading' | 'installed' | 'failed'
  filename: string | null
  url: string | null
}

export type WikipediaState = {
  options: WikipediaOption[]
  currentSelection: WikipediaCurrentSelection | null
}
