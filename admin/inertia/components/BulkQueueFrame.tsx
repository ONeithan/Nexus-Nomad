import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react'
import StyledButton from '~/components/StyledButton'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import { ServiceSlim } from '../../types/services'

export type BulkQueueItemState = 'pending' | 'active' | 'completed' | 'error'

export interface BulkQueueItemStatus {
  state: BulkQueueItemState
  message?: string
}

interface BulkQueueFrameProps {
  isOpen: boolean
  onClose: () => void
  accent: 'orange' | 'red'
  icon: React.ReactNode
  title: string
  subtitle: string
  activeVerb: string
  completedLabel: string
  completedItemBadge: string
  readyActionLabel: string
  readyActionIcon: DynamicIconName
  readySummaryText: string
  runningNotice: string
  retryLabel: string
  items: ServiceSlim[]
  statuses: Record<string, BulkQueueItemStatus>
  isRunning: boolean
  isFinished: boolean
  currentIndex: number
  progressPct: number
  preStartContent?: React.ReactNode
  onStart: () => void
  onCancel: () => void
  onRetryFailed?: (failedItems: ServiceSlim[]) => void
  onCompleteAll: () => void
  getActiveItemPct?: (svc: ServiceSlim, status: BulkQueueItemStatus) => number | null
  renderItemBadge?: (svc: ServiceSlim) => React.ReactNode
}

/**
 * Shared Headless UI v2 modal frame for sequential bulk queues (Bulk Install & Bulk Uninstall).
 */
export default function BulkQueueFrame({
  isOpen,
  onClose,
  accent,
  icon,
  title,
  subtitle,
  activeVerb,
  completedLabel,
  completedItemBadge,
  readyActionLabel,
  readyActionIcon,
  readySummaryText,
  runningNotice,
  retryLabel,
  items,
  statuses,
  isRunning,
  isFinished,
  currentIndex,
  progressPct,
  preStartContent,
  onStart,
  onCancel,
  onRetryFailed,
  onCompleteAll,
  getActiveItemPct,
  renderItemBadge,
}: BulkQueueFrameProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const activeItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isRunning || currentIndex < 0) {
      setElapsedSeconds(0)
      return
    }
    setElapsedSeconds(0)
    activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, currentIndex])

  if (!isOpen) return null

  const isRed = accent === 'red'
  const accentBgSoft = isRed
    ? 'bg-desert-red/15 text-desert-red border-desert-red/30'
    : 'bg-desert-orange/15 text-desert-orange border-desert-orange/30'
  const accentText = isRed ? 'text-desert-red' : 'text-desert-orange'
  const accentBar = isRed ? 'bg-desert-red' : 'bg-desert-orange'
  const accentRowBorder = isRed
    ? 'border-desert-red bg-desert-red/10 shadow-sm'
    : 'border-desert-orange bg-desert-orange/10 shadow-sm'
  const spinnerBorder = isRed
    ? 'border-desert-red border-t-transparent'
    : 'border-desert-orange border-t-transparent'

  const completedCount = Object.values(statuses).filter((s) => s.state === 'completed').length
  const errorCount = Object.values(statuses).filter((s) => s.state === 'error').length

  return (
    <Dialog open={isOpen} onClose={isRunning ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <DialogPanel
          transition
          className="nomad-modal-animate relative bg-surface-primary rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-border-subtle transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center ${accentBgSoft}`}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-mono-mil tracking-wide uppercase text-text-primary flex items-center gap-2 flex-wrap">
                  <span>{title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono border font-semibold ${accentBgSoft}`}
                  >
                    {items.length} Selecionado(s)
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
              </div>
            </div>

            {!isRunning && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar janela"
                className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <IconX size={20} />
              </button>
            )}
          </div>

          {/* Pre-start slot */}
          {!isRunning && !isFinished && preStartContent}

          {/* Progress Bar (when running or finished) */}
          {(isRunning || isFinished) && (
            <div className="p-4 border-b border-border-subtle bg-surface-secondary/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-mil gap-2">
                <span className="text-text-primary font-bold truncate">
                  {isRunning
                    ? `${activeVerb} ${Math.min(currentIndex + 1, items.length)} de ${items.length} (${completedCount} pronto(s), ${errorCount} erro(s))...`
                    : `Fila finalizada: ${completedCount} ${completedLabel} | ${errorCount} erro(s)`}
                </span>
                <span className={`${accentText} font-bold font-mono shrink-0`}>
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
                <div
                  className={`h-full ${accentBar} nomad-progress-shimmer rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(isRunning ? 2 : 0, progressPct))}%` }}
                />
              </div>
            </div>
          )}

          {/* Services List with Status */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
            {items.map((svc, idx) => {
              const st = statuses[svc.service_name] || {
                state: 'pending',
                message: 'Aguardando fila...',
              }
              const isCurrent = isRunning && currentIndex === idx
              const itemPct = st.state === 'active' && getActiveItemPct ? getActiveItemPct(svc, st) : null

              return (
                <div
                  key={svc.service_name}
                  ref={isCurrent ? activeItemRef : undefined}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors duration-300 ${
                    isCurrent
                      ? accentRowBorder
                      : st.state === 'completed'
                        ? 'border-emerald-500/35 bg-emerald-500/5'
                        : st.state === 'error'
                          ? 'border-desert-red/40 bg-desert-red/5'
                          : 'border-border-subtle bg-surface-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-surface-secondary border border-border-subtle flex items-center justify-center text-desert-green shrink-0">
                      <DynamicIcon
                        icon={(svc.icon as DynamicIconName) || 'IconBrandDocker'}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-text-primary truncate flex items-center gap-2">
                        <span className="truncate">{svc.friendly_name || svc.service_name}</span>
                        {renderItemBadge?.(svc)}
                        {isCurrent && elapsedSeconds > 0 && (
                          <span className="text-[0.625rem] font-mono text-desert-tan tabular-nums shrink-0">
                            ({Math.floor(elapsedSeconds / 60)}:
                            {String(elapsedSeconds % 60).padStart(2, '0')})
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[0.6875rem] mt-0.5 ${
                          st.state === 'error'
                            ? 'text-desert-red line-clamp-2'
                            : 'text-text-muted truncate'
                        }`}
                        title={st.message}
                      >
                        {st.message}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {st.state === 'active' && (
                      <span className={`flex items-center gap-1.5 text-xs ${accentText} font-medium`}>
                        <span
                          className={`animate-spin inline-block w-3.5 h-3.5 border-2 rounded-full ${spinnerBorder}`}
                        />
                        {itemPct !== null && <span>{itemPct}%</span>}
                      </span>
                    )}
                    {st.state === 'completed' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                        <IconCheck size={16} />
                        <span className="hidden sm:inline">{completedItemBadge}</span>
                      </span>
                    )}
                    {st.state === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-desert-red font-semibold">
                        <IconAlertTriangle size={16} />
                        <span className="hidden sm:inline">Falhou</span>
                      </span>
                    )}
                    {st.state === 'pending' && (
                      <span className="text-[0.6875rem] font-mono text-text-muted px-2 py-0.5 rounded bg-surface-secondary">
                        Na fila
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border-subtle bg-surface-secondary/70 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-text-muted">
              {isFinished ? (
                <span>
                  Concluídos: <strong className="text-emerald-500">{completedCount}</strong> | Erros:{' '}
                  <strong className={errorCount > 0 ? 'text-desert-red' : ''}>{errorCount}</strong>
                </span>
              ) : isRunning ? (
                <span>{runningNotice}</span>
              ) : (
                <span>{readySummaryText}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRunning && !isFinished && (
                <>
                  <StyledButton variant="outline" size="sm" onClick={onClose}>
                    Cancelar
                  </StyledButton>
                  <StyledButton
                    variant={isRed ? 'danger' : 'primary'}
                    size="sm"
                    icon={readyActionIcon}
                    disabled={items.length === 0}
                    onClick={onStart}
                  >
                    {readyActionLabel}
                  </StyledButton>
                </>
              )}

              {isRunning && (
                <StyledButton
                  variant="danger"
                  size="sm"
                  icon="IconPlayerStop"
                  onClick={onCancel}
                >
                  Interromper Fila
                </StyledButton>
              )}

              {isFinished && (
                <>
                  {errorCount > 0 && onRetryFailed && (
                    <StyledButton
                      variant="outline"
                      size="sm"
                      icon="IconRefresh"
                      onClick={() => {
                        const failedOnly = items.filter(
                          (s) => statuses[s.service_name]?.state === 'error'
                        )
                        if (failedOnly.length > 0) {
                          onRetryFailed(failedOnly)
                        }
                      }}
                    >
                      {retryLabel} ({errorCount})
                    </StyledButton>
                  )}
                  <StyledButton
                    variant="primary"
                    size="sm"
                    icon="IconCheck"
                    onClick={onCompleteAll}
                  >
                    Concluir e Atualizar
                  </StyledButton>
                </>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
