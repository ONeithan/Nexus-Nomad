import type { DownloadJobWithProgress, RunDownloadJobParams } from '../../types/downloads.js'
import { diagnoseDownloadError, type DownloadErrorDiagnosis } from './download_diagnostics.js'

export const DOWNLOAD_MAX_ATTEMPTS = 3
export const DOWNLOAD_RETRY_POLICY_VERSION = 2

export type IndexedDownloadJob = DownloadJobWithProgress & { _fifoIdx: number }

export function getDownloadQueueRank(status?: string): number {
  if (status === 'active') return 0
  if (status === 'waiting' || status === 'delayed') return 1
  return 2
}

/**
 * Sorts active transfers (highest progress first), followed by waiting/delayed
 * items in strict BullMQ FIFO execution order (so tail-requeued items remain
 * at the back behind pre-existing items), followed by failed items.
 */
export function sortDownloadJobsFifo(jobs: IndexedDownloadJob[]): DownloadJobWithProgress[] {
  return [...jobs]
    .sort((a, b) => {
      const rankDiff = getDownloadQueueRank(a.status) - getDownloadQueueRank(b.status)
      if (rankDiff !== 0) return rankDiff
      if (a.status === 'active' && b.status === 'active') {
        return b.progress - a.progress
      }
      return a._fifoIdx - b._fifoIdx
    })
    .map(({ _fifoIdx: _, ...rest }) => rest)
}

export type BootRecoveryDecision =
  | { action: 'requeue_tail'; diagnosis: DownloadErrorDiagnosis }
  | { action: 'skip_max_retries'; diagnosis: DownloadErrorDiagnosis }
  | { action: 'skip_cancelled'; diagnosis: DownloadErrorDiagnosis }
  | { action: 'skip_auth'; diagnosis: DownloadErrorDiagnosis }

/**
 * Evaluates whether a failed download found on boot/manual validation should be
 * diagnosed, repaired, and appended to the FIFO queue tail or left untouched.
 */
export function evaluateBootRecoveryAction(
  params: Partial<RunDownloadJobParams>,
  rawReason: string,
  includePermanentMaxRetries: boolean
): BootRecoveryDecision {
  const diagnosis = diagnoseDownloadError(rawReason || params.lastErrorPt || '', params.filepath)

  if (
    !includePermanentMaxRetries &&
    params.retryPolicyVersion === DOWNLOAD_RETRY_POLICY_VERSION &&
    (params.finalCancelledByRetryLimit || Number(params.retryAttempt || 1) >= DOWNLOAD_MAX_ATTEMPTS)
  ) {
    return { action: 'skip_max_retries', diagnosis }
  }

  if (diagnosis.code === 'USER_CANCELLED') {
    return { action: 'skip_cancelled', diagnosis }
  }

  if (diagnosis.category === 'auth') {
    return { action: 'skip_auth', diagnosis }
  }

  return { action: 'requeue_tail', diagnosis }
}
