import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import {
  IconAlertTriangle,
  IconArrowForwardUp,
  IconCheck,
  IconClock,
  IconFileText,
  IconFolderCheck,
  IconLoader2,
  IconPlayerPlay,
  IconRefresh,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react'
import api from '~/lib/api'
import { extractFileName } from '~/lib/util'
import type { DownloadAuditLogEntry, DownloadJobWithProgress } from '../../types/downloads'

export type DownloadLogModalSubject = Partial<DownloadJobWithProgress> & {
  jobId: string
}

interface DownloadLogModalProps {
  isOpen: boolean
  onClose: () => void
  download: DownloadLogModalSubject | null
  onRetryJob?: (jobId: string) => Promise<void> | void
  isRetrying?: boolean
}

function getEventBadgeStyle(eventType: string): {
  label: string
  classes: string
  Icon: typeof IconFileText
} {
  switch (eventType) {
    case 'completed':
      return {
        label: 'Concluído',
        classes: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        Icon: IconCheck,
      }
    case 'directory_repaired':
      return {
        label: 'Pasta / Link Reparado',
        classes: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
        Icon: IconFolderCheck,
      }
    case 'boot_recovery':
      return {
        label: 'Recuperado Pós-Atualização',
        classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        Icon: IconShieldCheck,
      }
    case 'requeued_tail':
      return {
        label: 'Enviado ao Fim da Fila',
        classes: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        Icon: IconArrowForwardUp,
      }
    case 'retried_manual':
      return {
        label: 'Reenvio Manual',
        classes: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        Icon: IconRefresh,
      }
    case 'failed_attempt':
      return {
        label: 'Falha na Tentativa',
        classes: 'bg-desert-orange/15 text-desert-orange border-desert-orange/35',
        Icon: IconAlertTriangle,
      }
    case 'cancelled_max_retries':
      return {
        label: 'Cancelado (3/3 Tentativas)',
        classes: 'bg-red-500/15 text-red-500 border-red-500/30',
        Icon: IconAlertTriangle,
      }
    case 'cancelled_user':
      return {
        label: 'Cancelado pelo Operador',
        classes: 'bg-surface-secondary text-text-muted border-border-default',
        Icon: IconX,
      }
    case 'resumed':
      return {
        label: 'Retomado (.tmp)',
        classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        Icon: IconPlayerPlay,
      }
    case 'started':
      return {
        label: 'Iniciado',
        classes: 'bg-desert-green/15 text-desert-green border-desert-green/35',
        Icon: IconPlayerPlay,
      }
    case 'queued':
    default:
      return {
        label: 'Na Fila',
        classes: 'bg-surface-secondary text-text-secondary border-border-default',
        Icon: IconClock,
      }
  }
}

export function formatLogTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function DownloadLogModal({
  isOpen,
  onClose,
  download,
  onRetryJob,
  isRetrying = false,
}: DownloadLogModalProps) {
  const jobId = download?.jobId || ''

  const {
    data: logs = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<DownloadAuditLogEntry[]>({
    queryKey: ['download-job-logs', jobId],
    queryFn: () => api.getDownloadJobLogs(jobId),
    enabled: isOpen && Boolean(jobId),
    refetchInterval: isOpen ? 3000 : false,
  })

  if (!isOpen || !download) return null

  const filename = extractFileName(download.filepath || '') || download.url || download.jobId
  const displayTitle = download.title || filename

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150"
      />

      <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
        <DialogPanel
          transition
          className="nomad-modal-animate w-full max-w-3xl rounded-2xl bg-surface-primary border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary/75 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <IconFileText size={20} className="text-desert-orange shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-text-primary truncate">
                  Log Detalhado: {displayTitle}
                </h3>
                <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-surface-primary border border-border-default text-text-secondary">
                  Tentativa {download.attempt || 1}/{download.maxAttempts || 3}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted font-mono">
                <span className="truncate max-w-md" title={filename}>
                  Arquivo: <strong className="text-text-secondary">{filename}</strong>
                </span>
                <span>•</span>
                <span>ID: {download.jobId}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void refetch()}
                className="p-1.5 rounded-lg border border-border-default bg-surface-primary hover:border-desert-orange text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Atualizar linha do tempo"
              >
                <IconRefresh size={16} className={isFetching ? 'animate-spin text-desert-orange' : ''} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-border-default bg-surface-primary hover:border-red-500 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                title="Fechar log"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          {/* Current Diagnosis Summary Banner */}
          {(download.errorSummaryPt || download.failedReason) && (
            <div
              className={`mx-6 mt-4 p-3.5 rounded-xl border text-xs space-y-1 ${
                download.status === 'failed'
                  ? 'bg-red-500/10 border-red-500/35 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/35 text-amber-400'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <IconAlertTriangle size={15} className="shrink-0" />
                <span>
                  {download.status === 'failed'
                    ? `Motivo Atual da Falha: ${download.errorSummaryPt || download.failedReason}`
                    : `Desvio Anterior (Reenfileirado): ${download.errorSummaryPt}`}
                </span>
              </div>
              {download.errorDetailsPt && (
                <p className="text-text-secondary leading-relaxed pl-5">
                  {download.errorDetailsPt}
                </p>
              )}
            </div>
          )}

          {/* Destination & URL Info */}
          <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-lg border border-border-subtle bg-surface-secondary/50 text-[0.7rem] font-mono text-text-secondary space-y-1">
            {download.filepath && (
              <div className="truncate" title={download.filepath}>
                <span className="text-text-muted">Destino:</span> {download.filepath}
              </div>
            )}
            {download.url && (
              <div className="truncate" title={download.url}>
                <span className="text-text-muted">Origem:</span> {download.url}
              </div>
            )}
          </div>

          {/* Timeline Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 themed-scrollbar">
            {isLoading ? (
              <div className="py-10 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                <IconLoader2 size={22} className="animate-spin text-desert-orange" />
                <span>Carregando histórico detalhado em PT-BR...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border-default bg-surface-secondary/30 text-center space-y-1.5">
                <p className="text-xs font-semibold text-text-primary">
                  Ainda não há eventos detalhados registrados para este item.
                </p>
                <p className="text-[0.7rem] text-text-muted">
                  Se este erro veio de uma versão anterior, clique em &quot;Validar e Reenfileirar&quot;
                  para diagnosticar o erro e registrar toda a auditoria em PT-BR a partir de agora.
                </p>
              </div>
            ) : (
              logs.map((entry) => {
                const badge = getEventBadgeStyle(entry.eventType)
                const BadgeIcon = badge.Icon
                return (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl border border-border-subtle bg-surface-secondary/45 space-y-1.5 nomad-animate-in"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold border ${badge.classes}`}
                        >
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-[0.6875rem] font-mono text-text-muted">
                          Tentativa {entry.attempt}/{entry.maxAttempts}
                        </span>
                        {entry.errorCode && (
                          <span className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle text-text-secondary">
                            {entry.errorCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[0.6875rem] font-mono text-text-muted">
                        {formatLogTimestamp(entry.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[0.8125rem] font-semibold text-text-primary leading-snug">
                      {entry.summaryPt}
                    </p>

                    {entry.detailsPt && (
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {entry.detailsPt}
                      </p>
                    )}

                    {entry.rawError && (
                      <details className="text-[0.6875rem] text-text-muted pt-1">
                        <summary className="cursor-pointer hover:text-text-secondary select-none">
                          Ver erro técnico original
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-surface-primary border border-border-subtle overflow-x-auto font-mono whitespace-pre-wrap break-all">
                          {entry.rawError}
                        </pre>
                      </details>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-border-subtle bg-surface-secondary/75 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.7rem] text-text-muted">
              Máximo de 3 tentativas automáticas enviando falhas ao final da fila antes de cancelar.
            </span>
            <div className="flex items-center gap-2">
              {download.status === 'failed' && onRetryJob && (
                <button
                  type="button"
                  disabled={isRetrying}
                  onClick={() => void onRetryJob(download.jobId)}
                  className="px-3.5 py-1.5 rounded-lg bg-desert-green hover:bg-btn-green-hover text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isRetrying ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : (
                    <IconRefresh size={14} />
                  )}
                  <span>Validar e Enviar ao Fim da Fila</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-border-default bg-surface-primary text-xs font-semibold text-text-primary hover:border-desert-orange cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
