import { useRef, useState, useCallback } from 'react'
import useDownloads, { useDownloadsProps } from '~/hooks/useDownloads'
import { extractFileName, formatBytes } from '~/lib/util'
import StyledSectionHeader from './StyledSectionHeader'
import DownloadLogModal from './DownloadLogModal'
import {
  IconAlertTriangle,
  IconArrowForwardUp,
  IconExternalLink,
  IconFileText,
  IconLoader2,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import api from '~/lib/api'
import type { DownloadJobWithProgress } from '../../types/downloads'

interface ActiveDownloadProps {
  filetype?: useDownloadsProps['filetype']
  filetypes?: string[]
  withHeader?: boolean
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '0 B/s'
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
}

type DownloadStatus = 'queued' | 'active' | 'stalled' | 'failed'

function getDownloadStatus(download: {
  progress: number
  lastProgressTime?: number
  status?: string
}): DownloadStatus {
  if (download.status === 'failed') return 'failed'
  if (download.status === 'waiting' || download.status === 'delayed') return 'queued'
  if (download.progress === 0 && !download.lastProgressTime) return 'queued'
  if (download.lastProgressTime) {
    const elapsed = Date.now() - download.lastProgressTime
    if (elapsed > 60_000) return 'stalled'
  }
  return 'active'
}

const ActiveDownloads = ({ filetype, filetypes, withHeader = false }: ActiveDownloadProps) => {
  const { data: rawDownloads, invalidate } = useDownloads({
    filetype: filetypes && filetypes.length > 0 ? undefined : filetype,
  })
  const safeRawDownloads = Array.isArray(rawDownloads) ? rawDownloads : []
  const downloads =
    filetypes && filetypes.length > 0
      ? safeRawDownloads.filter((d) => d.filetype && filetypes.includes(d.filetype))
      : safeRawDownloads
  const [cancellingJobs, setCancellingJobs] = useState<Set<string>>(new Set())
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null)
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set())
  const [selectedLogJob, setSelectedLogJob] = useState<DownloadJobWithProgress | null>(null)

  const prevBytesRef = useRef<Map<string, { bytes: number; time: number }>>(new Map())
  const speedRef = useRef<Map<string, number[]>>(new Map())

  const getSpeed = useCallback((jobId: string, currentBytes?: number): number => {
    if (!currentBytes || currentBytes <= 0) return 0

    const prev = prevBytesRef.current.get(jobId)
    const now = Date.now()

    if (prev && prev.bytes > 0 && currentBytes > prev.bytes) {
      const deltaBytes = currentBytes - prev.bytes
      const deltaSec = (now - prev.time) / 1000
      if (deltaSec > 0) {
        const instantSpeed = deltaBytes / deltaSec

        const samples = speedRef.current.get(jobId) || []
        samples.push(instantSpeed)
        if (samples.length > 5) samples.shift()
        speedRef.current.set(jobId, samples)

        const avg = samples.reduce((a, b) => a + b, 0) / samples.length
        prevBytesRef.current.set(jobId, { bytes: currentBytes, time: now })
        return avg
      }
    }

    if (!prev) {
      prevBytesRef.current.set(jobId, { bytes: currentBytes, time: now })
    }
    return speedRef.current.get(jobId)?.at(-1) || 0
  }, [])

  const handleDismiss = async (jobId: string) => {
    await api.removeDownloadJob(jobId)
    invalidate()
  }

  const handleRetry = async (jobId: string) => {
    setRetryingJobs((prev) => new Set(prev).add(jobId))
    try {
      await api.retryDownloadJob(jobId)
      if (selectedLogJob?.jobId === jobId) {
        setSelectedLogJob(null)
      }
    } finally {
      setRetryingJobs((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
      invalidate()
    }
  }

  const handleCancel = async (jobId: string) => {
    setCancellingJobs((prev) => new Set(prev).add(jobId))
    setConfirmingCancel(null)
    try {
      await api.cancelDownloadJob(jobId)
      prevBytesRef.current.delete(jobId)
      speedRef.current.delete(jobId)
    } finally {
      setCancellingJobs((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
      invalidate()
    }
  }

  return (
    <>
      {withHeader && <StyledSectionHeader title="Downloads Ativos" className="mt-12 mb-4" />}
      <div className="space-y-4">
        {downloads && downloads.length > 0 ? (
          downloads.map((download) => {
            const filename = extractFileName(download.filepath) || download.url
            const status = getDownloadStatus(download)
            const speed = getSpeed(download.jobId, download.downloadedBytes)
            const isCancelling = cancellingJobs.has(download.jobId)
            const isConfirming = confirmingCancel === download.jobId
            const queueIndex =
              status === 'queued'
                ? downloads.filter((d) => getDownloadStatus(d) === 'queued').indexOf(download) + 1
                : 0
            const storageDirHint = download.filepath
              ? download.filepath.startsWith('/mnt/')
                ? download.filepath.split('/').slice(0, 3).join('/')
                : download.filepath.includes('/storage/')
                  ? 'Armazenamento Interno NOMAD'
                  : ''
              : ''

            const isRetrying = retryingJobs.has(download.jobId)
            const attempt = download.attempt || 1
            const maxAttempts = download.maxAttempts || 3
            const reachedRetryLimit = Boolean(
              download.finalCancelledByRetryLimit || (status === 'failed' && attempt >= maxAttempts)
            )

            return (
              <div
                key={download.jobId}
                className={`nomad-interactive-card rounded-xl p-4 border shadow-sm transition-all ${
                  status === 'failed'
                    ? 'bg-surface-primary border-red-500/45'
                    : download.requeueReason
                      ? 'bg-surface-primary border-amber-500/40'
                      : 'bg-surface-primary border-default'
                }`}
              >
                {status === 'failed' ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {download.title || filename}
                          </p>
                          <span className="text-[0.6875rem] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                            {reachedRetryLimit
                              ? `Cancelado após ${attempt}/${maxAttempts} tentativas`
                              : `Falha (Tentativa ${attempt}/${maxAttempts})`}
                          </span>
                        </div>
                        {download.title && (
                          <p className="text-xs text-text-muted truncate font-mono">{filename}</p>
                        )}
                        <p className="text-xs text-red-400 font-medium">
                          {download.errorSummaryPt ||
                            (download.failedReason
                              ? `Falha no download: ${download.failedReason}`
                              : 'Falha no download')}
                        </p>
                        {download.errorDetailsPt && (
                          <p className="text-[0.7rem] text-text-secondary leading-relaxed">
                            {download.errorDetailsPt}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDismiss(download.jobId)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-500/15 transition-colors cursor-pointer"
                        title="Dispensar download com falha"
                      >
                        <IconX className="w-4 h-4 text-red-400 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-7">
                      <button
                        type="button"
                        onClick={() => handleRetry(download.jobId)}
                        disabled={isRetrying}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-desert-green text-white hover:bg-btn-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
                        title="Validar erro, reparar pasta se necessário e enviar para o final da fila"
                      >
                        {isRetrying ? (
                          <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <IconRefresh className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isRetrying ? 'Validando...' : 'Validar e Tentar Novamente'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLogJob(download)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-text-primary hover:border-desert-orange hover:text-desert-orange transition-colors font-semibold cursor-pointer"
                        title="Abrir log detalhado em PT-BR deste download"
                      >
                        <IconFileText className="w-3.5 h-3.5" />
                        <span>Ver Log (PT-BR)</span>
                      </button>

                      {download.url && download.url.startsWith('http') && (
                        <a
                          href={download.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                          title="Abrir página de download do recurso"
                        >
                          <IconExternalLink className="w-3.5 h-3.5" />
                          <span>Página de download</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Title + Attempt/Log/Cancel buttons row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-desert-green-foreground truncate">
                            {download.title || filename}
                          </p>
                          <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-secondary shrink-0">
                            Tentativa {attempt}/{maxAttempts}
                          </span>
                        </div>
                        {download.title && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-text-muted truncate font-mono">
                              {filename}
                            </span>
                            {download.filetype && (
                              <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-secondary font-mono flex-shrink-0">
                                {download.filetype}
                              </span>
                            )}
                          </div>
                        )}
                        {!download.title && download.filetype && (
                          <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-secondary font-mono">
                            {download.filetype}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLogJob(download)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border-subtle bg-surface-secondary hover:border-desert-orange text-[0.7rem] font-semibold text-text-secondary hover:text-desert-orange transition-colors cursor-pointer"
                          title="Ver log detalhado deste download em PT-BR"
                        >
                          <IconFileText size={13} />
                          <span className="hidden sm:inline">Ver Log</span>
                        </button>

                        {isConfirming ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCancel(download.jobId)}
                              className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 transition-colors cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingCancel(null)}
                              className="text-xs px-2 py-1 rounded bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            >
                              Manter
                            </button>
                          </div>
                        ) : isCancelling ? (
                          <IconLoader2 className="w-4 h-4 text-text-muted animate-spin flex-shrink-0" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingCancel(download.jobId)}
                            className="flex-shrink-0 p-1 rounded hover:bg-red-500/15 transition-colors cursor-pointer"
                            title="Cancelar download"
                          >
                            <IconX className="w-4 h-4 text-text-muted hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tail-requeue notice if item returned from an error */}
                    {download.requeueReason && (
                      <div className="px-2.5 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 text-[0.7rem] text-amber-400 flex items-start gap-1.5">
                        <IconArrowForwardUp size={14} className="shrink-0 mt-0.5" />
                        <span>{download.requeueReason}</span>
                      </div>
                    )}

                    {/* Size info */}
                    <div className="flex flex-wrap justify-between items-baseline gap-2 text-xs sm:text-sm text-text-muted font-mono">
                      <span>
                        {download.totalBytes && download.totalBytes > 0
                          ? `${formatBytes(download.downloadedBytes || 0, 1)} / ${formatBytes(download.totalBytes, 1)}`
                          : `${Math.round(download.progress || 0)}% / 100%`}
                      </span>
                      {storageDirHint && (
                        <span className="text-[0.6875rem] px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-secondary">
                          Destino: {storageDirHint}
                        </span>
                      )}
                    </div>

                    {/* Progress bar with fluid shimmer when active */}
                    <div className="relative">
                      <div className="h-6 bg-desert-green-lighter/30 rounded-lg border border-default overflow-hidden">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 ease-out bg-desert-green ${
                            status === 'active' ? 'nomad-progress-shimmer' : ''
                          }`}
                          style={{ width: `${Math.max(download.progress, status === 'active' ? 2 : 0)}%` }}
                        />
                      </div>
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 font-bold text-xs ${
                          download.progress > 15
                            ? 'left-2 text-white drop-shadow-md'
                            : 'right-2 text-text-primary'
                        }`}
                      >
                        {Math.round(download.progress)}%
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2">
                      {status === 'queued' && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-desert-tan" />
                          <span className="text-xs text-text-secondary">
                            {queueIndex > 0
                              ? `Na fila (#${queueIndex}) — aguardando vaga no carregador`
                              : 'Na fila — preparando download...'}
                          </span>
                        </>
                      )}
                      {status === 'active' && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-emerald-400 font-medium">
                            Baixando agora...{speed > 0 ? ` ${formatSpeed(speed)}` : ''}
                          </span>
                        </>
                      )}
                      {status === 'stalled' && download.lastProgressTime && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-xs text-orange-400">
                            Nenhum dado recebido há{' '}
                            {Math.floor((Date.now() - download.lastProgressTime) / 60_000)}min (retomará automaticamente se expirar)...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <p className="text-text-muted">Nenhum download ativo</p>
        )}
      </div>

      {/* Modal de Log Detalhado Individual */}
      <DownloadLogModal
        isOpen={Boolean(selectedLogJob)}
        onClose={() => setSelectedLogJob(null)}
        download={selectedLogJob}
        onRetryJob={handleRetry}
        isRetrying={selectedLogJob ? retryingJobs.has(selectedLogJob.jobId) : false}
      />
    </>
  )
}

export default ActiveDownloads
