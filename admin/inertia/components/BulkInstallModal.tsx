import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  IconBolt,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconServer,
  IconDeviceDesktop,
} from '@tabler/icons-react'
import StyledButton from '~/components/StyledButton'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import { ServiceSlim } from '../../types/services'
import api from '~/lib/api'

interface BulkInstallModalProps {
  isOpen: boolean
  onClose: () => void
  selectedServices: ServiceSlim[]
  isPortainerConfigured: boolean
  defaultTarget?: 'local' | 'portainer'
  onTargetSelected?: (target: 'local' | 'portainer') => void
  onCompletedAll?: () => void
  installActivity?: any[]
}

type ServiceInstallState = 'pending' | 'installing' | 'completed' | 'error'

interface ItemStatus {
  state: ServiceInstallState
  message?: string
}

function estimateStepProgress(msg?: string): number {
  if (!msg) return 8
  const stepMatch = msg.match(/\[(\d+)\/(\d+)\]/)
  if (stepMatch) {
    const cur = Number(stepMatch[1])
    const total = Math.max(1, Number(stepMatch[2]))
    return Math.min(92, Math.max(12, Math.round((cur / total) * 90)))
  }
  const lower = msg.toLowerCase()
  if (lower.includes('verificando') || lower.includes('saúde') || lower.includes('iniciando')) return 82
  if (lower.includes('implantando') || lower.includes('stack') || lower.includes('criando')) return 65
  if (lower.includes('preparando') || lower.includes('armazenamento') || lower.includes('volume')) return 48
  if (lower.includes('baixando') || lower.includes('imagem') || lower.includes('pull')) return 30
  return 15
}

export default function BulkInstallModal({
  isOpen,
  onClose,
  selectedServices,
  isPortainerConfigured,
  defaultTarget = 'local',
  onTargetSelected,
  onCompletedAll,
  installActivity = [],
}: BulkInstallModalProps) {
  const [target, setTarget] = useState<'local' | 'portainer'>(
    isPortainerConfigured ? defaultTarget : 'local'
  )
  // Congela a lista da fila enquanto o modal estiver ativo para que atualizações de status
  // em background (installed: true) não encolham `selectedServices` durante o loop.
  const [queueItems, setQueueItems] = useState<ServiceSlim[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (isOpen && !isRunning) {
      setTarget(isPortainerConfigured ? defaultTarget : 'local')
    }
  }, [isOpen, isRunning, defaultTarget, isPortainerConfigured])

  const cancelRequestedRef = useRef(false)
  const installActivityRef = useRef(installActivity)
  const activeItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    installActivityRef.current = installActivity
  }, [installActivity])

  // Contador de segundos do app atual + scroll suave para manter o item em destaque visível
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

  // Inicializa fila congelada quando o modal abre sem estar rodando
  useEffect(() => {
    if (isOpen && !isRunning && !isFinished) {
      setQueueItems(selectedServices)
      const init: Record<string, ItemStatus> = {}
      selectedServices.forEach((svc) => {
        init[svc.service_name] = { state: 'pending', message: 'Aguardando fila...' }
      })
      setStatuses(init)
      setCurrentIndex(-1)
      cancelRequestedRef.current = false
    }
  }, [isOpen, selectedServices, isRunning, isFinished])

  /**
   * Aguarda a conclusão REAL da instalação (tanto no Docker Local quanto no Portainer),
   * lendo eventos SSE emitidos APÓS `baselineActivityIdx` e confirmando pelo `/api/services`
   * antes de marcar `completed` ou `error`.
   */
  const waitForServiceCompletion = async (
    serviceName: string,
    deployTarget: 'local' | 'portainer',
    baselineActivityIdx: number
  ): Promise<{ success: boolean; message: string }> => {
    const maxAttempts = 240 // Até 12 minutos (240 * 3000ms) para imagens grandes
    let lastProgressMsg =
      deployTarget === 'portainer'
        ? 'Enviando stack e baixando imagem no Servidor Portainer...'
        : 'Baixando imagem e configurando contêiner local...'

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelRequestedRef.current) {
        return { success: false, message: 'Fila interrompida pelo operador' }
      }

      // Ler apenas eventos novos desta tentativa específica
      const recentEvents = (installActivityRef.current || [])
        .slice(baselineActivityIdx)
        .filter((a: any) => a?.service_name === serviceName)

      if (recentEvents.length > 0) {
        const last = recentEvents[recentEvents.length - 1]
        if (last.message) {
          lastProgressMsg = last.message
        }
        if (last.type === 'completed' || last.type === 'update-complete') {
          return { success: true, message: last.message || 'Instalado e em execução!' }
        }
        if (last.type === 'error') {
          return { success: false, message: last.message || 'Falha na implantação do serviço' }
        }
        if (last.message) {
          setStatuses((prev) => ({
            ...prev,
            [serviceName]: {
              state: 'installing',
              message: last.message,
            },
          }))
        }
      }

      // Polling de segurança a cada ~3s (garante progresso em tempo real e motivo exato de erro mesmo se SSE falhar)
      if (attempt >= 1) {
        try {
          const sysServices = await api.getSystemServices(true)
          const found = sysServices?.find((s: any) => s.service_name === serviceName)
          if (found) {
            const liveMsg = found.install_progress_message
            const liveStatus = found.install_progress_status

            if (liveMsg && liveStatus !== 'error' && liveStatus !== 'completed') {
              lastProgressMsg = liveMsg
              setStatuses((prev) => ({
                ...prev,
                [serviceName]: {
                  state: 'installing',
                  message: liveMsg,
                },
              }))
            }

            if (found.installation_status === 'error' || liveStatus === 'error') {
              return {
                success: false,
                message:
                  liveMsg ||
                  (lastProgressMsg && lastProgressMsg.toLowerCase().includes('falha')
                    ? lastProgressMsg
                    : 'Falha ao iniciar o contêiner no servidor (verifique imagem/portas/logs no Portainer).'),
              }
            }
            if (found.installed && found.installation_status !== 'installing') {
              if (found.status === 'running') {
                return {
                  success: true,
                  message:
                    deployTarget === 'portainer'
                      ? liveMsg || 'Contêiner ativo e em execução no Servidor Portainer!'
                      : liveMsg || 'Contêiner instalado e em execução!',
                }
              }
              // Se marcou installed mas ainda não aparece como running, dá mais 2 ciclos antes de reprovar
              if (attempt >= 4 && (found.status === 'stopped' || found.status === 'exited' || found.status === 'created')) {
                return {
                  success: false,
                  message: `Contêiner criado mas não permaneceu em execução (estado atual: ${found.status}).`,
                }
              }
            }
          }
        } catch {
          // Erro transitório de rede durante polling; tenta próximo ciclo
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    return { success: false, message: 'Tempo limite excedido aguardando resposta do servidor.' }
  }

  const startBulkInstall = async (overrideList?: ServiceSlim[]) => {
    const itemsToInstall = overrideList && overrideList.length > 0
      ? overrideList
      : queueItems.length > 0
        ? queueItems
        : selectedServices
    if (itemsToInstall.length === 0) return
    if (overrideList && overrideList.length > 0) {
      setQueueItems(overrideList)
      const resetStatuses: Record<string, ItemStatus> = {}
      for (const s of overrideList) {
        resetStatuses[s.service_name] = { state: 'pending', message: 'Aguardando nova tentativa...' }
      }
      setStatuses(resetStatuses)
    } else if (queueItems.length === 0) {
      setQueueItems(itemsToInstall)
    }

    onTargetSelected?.(target)
    setIsRunning(true)
    setIsFinished(false)
    cancelRequestedRef.current = false

    for (let i = 0; i < itemsToInstall.length; i++) {
      if (cancelRequestedRef.current) {
        break
      }

      const svc = itemsToInstall[i]
      setCurrentIndex(i)

      const baselineActivityIdx = (installActivityRef.current || []).length
      setStatuses((prev) => ({
        ...prev,
        [svc.service_name]: {
          state: 'installing',
          message:
            target === 'portainer'
              ? `Despachando "${svc.friendly_name || svc.service_name}" para o Servidor Portainer...`
              : `Iniciando implantação local de "${svc.friendly_name || svc.service_name}"...`,
        },
      }))

      try {
        const res = await api.installService(svc.service_name, target)
        if (!res || !res.success) {
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'error',
              message: res?.message || 'Falha ao despachar instalação',
            },
          }))
        } else {
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'installing',
              message:
                target === 'portainer'
                  ? 'Aguardando pull da imagem e inicialização real no Portainer...'
                  : 'Baixando imagem e configurando contêiner local...',
            },
          }))

          const outcome = await waitForServiceCompletion(
            svc.service_name,
            target,
            baselineActivityIdx
          )
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: outcome.success ? 'completed' : 'error',
              message: outcome.message,
            },
          }))
        }
      } catch (err: any) {
        setStatuses((prev) => ({
          ...prev,
          [svc.service_name]: {
            state: 'error',
            message: err?.message || 'Erro de comunicação com o servidor',
          },
        }))
      }

      if (cancelRequestedRef.current) {
        break
      }

      // Pausa breve entre instalações reais concluídas para aliviar I/O do daemon
      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    if (cancelRequestedRef.current) {
      setStatuses((prev) => {
        const next = { ...prev }
        for (const svc of itemsToInstall) {
          if (next[svc.service_name]?.state === 'pending') {
            next[svc.service_name] = {
              state: 'error',
              message: 'Não iniciado (fila interrompida pelo operador)',
            }
          }
        }
        return next
      })
    }

    setIsRunning(false)
    setIsFinished(true)
  }

  const handleCancel = () => {
    if (isRunning) {
      cancelRequestedRef.current = true
      setIsRunning(false)
      setIsFinished(true)
    } else {
      setIsFinished(false)
      onClose()
    }
  }

  const displayList = queueItems.length > 0 ? queueItems : selectedServices
  const completedCount = Object.values(statuses).filter((s) => s.state === 'completed').length
  const errorCount = Object.values(statuses).filter((s) => s.state === 'error').length
  const settledCount = completedCount + errorCount

  const currentService =
    isRunning && currentIndex >= 0 && currentIndex < displayList.length
      ? displayList[currentIndex]
      : null
  const currentStepFraction =
    currentService && statuses[currentService.service_name]?.state === 'installing'
      ? estimateStepProgress(statuses[currentService.service_name]?.message) / 100
      : 0

  const progressPct =
    displayList.length > 0
      ? isFinished
        ? Math.min(100, Math.round((settledCount / displayList.length) * 100))
        : Math.min(99, Math.round(((settledCount + currentStepFraction) / displayList.length) * 100))
      : 0

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onClose={isRunning ? () => {} : () => { setIsFinished(false); onClose() }} className="relative z-50">
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
              <div className="w-10 h-10 rounded-lg bg-desert-orange/15 border border-desert-orange/30 flex items-center justify-center text-desert-orange">
                <IconBolt size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-mono-mil tracking-wide uppercase text-text-primary flex items-center gap-2">
                  <span>Instalação em Massa</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-desert-orange/15 text-desert-orange border border-desert-orange/30 font-semibold">
                    {displayList.length} Selecionados
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Execução sequencial real — cada app aguarda o download da imagem e a confirmação de inicialização saudável.
                </p>
              </div>
            </div>

            {!isRunning && (
              <button
                onClick={() => { setIsFinished(false); onClose() }}
                className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <IconX size={20} />
              </button>
            )}
          </div>

          {/* Target Destination Selector */}
          {!isRunning && !isFinished && isPortainerConfigured && (
            <div className="p-4 border-b border-border-subtle bg-surface-secondary/30">
              <label className="text-xs font-mono-mil font-semibold uppercase text-text-secondary block mb-2">
                Destino da Implantação em Massa:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('local')}
                  className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    target === 'local'
                      ? 'border-desert-green bg-desert-green/10 text-desert-green-darker'
                      : 'border-border-subtle bg-surface-secondary hover:border-desert-stone-light text-text-muted'
                  }`}
                >
                  <IconDeviceDesktop size={20} className="shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-text-primary">
                      Local (NOMAD)
                    </div>
                    <div className="text-[0.625rem] text-text-muted">
                      Executar no contêiner local deste dispositivo
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('portainer')}
                  className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    target === 'portainer'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-border-subtle bg-surface-secondary hover:border-desert-stone-light text-text-muted'
                  }`}
                >
                  <IconServer size={20} className="shrink-0 text-emerald-500" />
                  <div>
                    <div className="font-semibold text-xs text-text-primary">
                      Servidor Remoto (Portainer)
                    </div>
                    <div className="text-[0.625rem] text-text-muted">
                      Implantar 1 por vez aguardando subida real no servidor
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar (when running or finished) */}
          {(isRunning || isFinished) && (
            <div className="p-4 border-b border-border-subtle bg-surface-secondary/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-mil gap-2">
                <span className="text-text-primary font-bold truncate">
                  {isRunning
                    ? `Instalando ${Math.min(currentIndex + 1, displayList.length)} de ${displayList.length} (${completedCount} pronto(s), ${errorCount} erro(s))...`
                    : `Fila finalizada: ${completedCount} ativo(s) no servidor | ${errorCount} erro(s)`}
                </span>
                <span className="text-desert-orange font-bold font-mono shrink-0">
                  {progressPct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-desert-orange nomad-progress-shimmer rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(isRunning ? 2 : 0, progressPct))}%` }}
                />
              </div>
            </div>
          )}

          {/* Services List with Status */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
            {displayList.map((svc, idx) => {
              const st = statuses[svc.service_name] || {
                state: 'pending',
                message: 'Aguardando fila...',
              }
              const isCurrent = isRunning && currentIndex === idx

              return (
                <div
                  key={svc.service_name}
                  ref={isCurrent ? activeItemRef : undefined}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors duration-300 ${
                    isCurrent
                      ? 'border-desert-orange bg-desert-orange/10 shadow-sm'
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
                        <span>{svc.friendly_name || svc.service_name}</span>
                        {isCurrent && elapsedSeconds > 0 && (
                          <span className="text-[0.625rem] font-mono text-desert-tan tabular-nums">
                            ({Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')})
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
                    {st.state === 'installing' && (
                      <span className="flex items-center gap-1.5 text-xs text-desert-orange font-medium">
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-desert-orange border-t-transparent rounded-full" />
                        <span>{estimateStepProgress(st.message)}%</span>
                      </span>
                    )}
                    {st.state === 'completed' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                        <IconCheck size={16} />
                        <span className="hidden sm:inline">Ativo</span>
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
                <span>
                  Verificando em tempo real ({target === 'portainer' ? 'Portainer Remoto' : 'Docker Local'}) — aguarde a inicialização...
                </span>
              ) : (
                <span>
                  Pronto para instalar <strong>{displayList.length}</strong> aplicativos sequencialmente.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRunning && !isFinished && (
                <>
                  <StyledButton variant="outline" size="sm" onClick={() => { setIsFinished(false); onClose() }}>
                    Cancelar
                  </StyledButton>
                  <StyledButton
                    variant="primary"
                    size="sm"
                    icon="IconPlayerPlay"
                    onClick={() => startBulkInstall()}
                  >
                    Iniciar Instalação em Massa
                  </StyledButton>
                </>
              )}

              {isRunning && (
                <StyledButton
                  variant="danger"
                  size="sm"
                  icon="IconPlayerStop"
                  onClick={handleCancel}
                >
                  Interromper Fila
                </StyledButton>
              )}

              {isFinished && (
                <>
                  {errorCount > 0 && (
                    <StyledButton
                      variant="outline"
                      size="sm"
                      icon="IconRefresh"
                      onClick={() => {
                        const failedOnly = displayList.filter(
                          (s) => statuses[s.service_name]?.state === 'error'
                        )
                        if (failedOnly.length > 0) {
                          startBulkInstall(failedOnly)
                        }
                      }}
                    >
                      Tentar Falhas ({errorCount})
                    </StyledButton>
                  )}
                  <StyledButton
                    variant="primary"
                    size="sm"
                    icon="IconCheck"
                    onClick={() => {
                      setIsFinished(false)
                      onClose()
                      if (onCompletedAll) {
                        onCompletedAll()
                      } else {
                        window.location.reload()
                      }
                    }}
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
