import { useState, useEffect, useRef } from 'react'
import { IconBolt, IconServer, IconDeviceDesktop } from '@tabler/icons-react'
import BulkQueueFrame, { BulkQueueItemStatus } from '~/components/BulkQueueFrame'
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
  const [statuses, setStatuses] = useState<Record<string, BulkQueueItemStatus>>({})

  useEffect(() => {
    if (isOpen && !isRunning) {
      setTarget(isPortainerConfigured ? defaultTarget : 'local')
    }
  }, [isOpen, isRunning, defaultTarget, isPortainerConfigured])

  const cancelRequestedRef = useRef(false)
  const installActivityRef = useRef(installActivity)

  useEffect(() => {
    installActivityRef.current = installActivity
  }, [installActivity])

  // Inicializa fila congelada quando o modal abre sem estar rodando
  useEffect(() => {
    if (isOpen && !isRunning && !isFinished) {
      setQueueItems(selectedServices)
      const init: Record<string, BulkQueueItemStatus> = {}
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
              state: 'active',
              message: last.message,
            },
          }))
        }
      }

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
                  state: 'active',
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
    const itemsToInstall =
      overrideList && overrideList.length > 0
        ? overrideList
        : queueItems.length > 0
          ? queueItems
          : selectedServices
    if (itemsToInstall.length === 0) return
    if (overrideList && overrideList.length > 0) {
      setQueueItems(overrideList)
      const resetStatuses: Record<string, BulkQueueItemStatus> = {}
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
      if (cancelRequestedRef.current) break

      const svc = itemsToInstall[i]
      setCurrentIndex(i)

      const baselineActivityIdx = (installActivityRef.current || []).length
      setStatuses((prev) => ({
        ...prev,
        [svc.service_name]: {
          state: 'active',
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
              state: 'active',
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

      if (cancelRequestedRef.current) break

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

  const handleClose = () => {
    setIsFinished(false)
    onClose()
  }

  const handleCancel = () => {
    if (isRunning) {
      cancelRequestedRef.current = true
      setIsRunning(false)
      setIsFinished(true)
    } else {
      handleClose()
    }
  }

  const displayList = queueItems.length > 0 ? queueItems : selectedServices
  const settledCount = Object.values(statuses).filter(
    (s) => s.state === 'completed' || s.state === 'error'
  ).length
  const currentService =
    isRunning && currentIndex >= 0 && currentIndex < displayList.length
      ? displayList[currentIndex]
      : null
  const currentStepFraction =
    currentService && statuses[currentService.service_name]?.state === 'active'
      ? estimateStepProgress(statuses[currentService.service_name]?.message) / 100
      : 0

  const progressPct =
    displayList.length > 0
      ? isFinished
        ? Math.min(100, Math.round((settledCount / displayList.length) * 100))
        : Math.min(99, Math.round(((settledCount + currentStepFraction) / displayList.length) * 100))
      : 0

  return (
    <BulkQueueFrame
      isOpen={isOpen}
      onClose={handleClose}
      accent="orange"
      icon={<IconBolt size={22} />}
      title="Instalação em Massa"
      subtitle="Execução sequencial real — cada app aguarda o download da imagem e a confirmação de inicialização saudável."
      activeVerb="Instalando"
      completedLabel="ativo(s) no servidor"
      completedItemBadge="Ativo"
      readyActionLabel="Iniciar Instalação em Massa"
      readyActionIcon="IconPlayerPlay"
      readySummaryText={`Pronto para instalar ${displayList.length} aplicativos sequencialmente.`}
      runningNotice={`Verificando em tempo real (${target === 'portainer' ? 'Portainer Remoto' : 'Docker Local'}) — aguarde a inicialização...`}
      retryLabel="Tentar Falhas"
      items={displayList}
      statuses={statuses}
      isRunning={isRunning}
      isFinished={isFinished}
      currentIndex={currentIndex}
      progressPct={progressPct}
      getActiveItemPct={(_svc, st) => estimateStepProgress(st.message)}
      onStart={() => startBulkInstall()}
      onCancel={handleCancel}
      onRetryFailed={(failedOnly) => startBulkInstall(failedOnly)}
      onCompleteAll={() => {
        setIsFinished(false)
        onClose()
        if (onCompletedAll) {
          onCompletedAll()
        } else {
          window.location.reload()
        }
      }}
      preStartContent={
        isPortainerConfigured ? (
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
                  <div className="font-semibold text-xs text-text-primary">Local (NOMAD)</div>
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
        ) : undefined
      }
    />
  )
}
