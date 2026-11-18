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
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({})

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

  // Helper to wait for a local background installation to complete or fail
  const waitForLocalCompletion = async (
    serviceName: string
  ): Promise<{ success: boolean; message: string }> => {
    const maxAttempts = 300 // up to 10 minutes (300 * 2000ms)
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelRequestedRef.current) {
        return { success: false, message: 'Instalação cancelada pelo usuário' }
      }

      // Check SSE activities
      const activities = installActivityRef.current || []
      const matching = activities.filter((a: any) => a?.service_name === serviceName)
      if (matching.length > 0) {
        const last = matching[matching.length - 1]
        if (last.type === 'completed' || last.type === 'update-complete') {
          return { success: true, message: last.message || 'Instalado com sucesso' }
        }
        if (last.type === 'error') {
          return { success: false, message: last.message || 'Falha na instalação' }
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

      // Every 5 checks (~10s), verify via API in case SSE was missed
      if (attempt > 0 && attempt % 5 === 0) {
        try {
          const sysServices = await api.getSystemServices()
          const found = sysServices?.find((s: any) => s.service_name === serviceName)
          if (found && (found as any).installed) {
            return { success: true, message: 'Instalado com sucesso' }
          }
        } catch {}
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    return { success: false, message: 'Tempo limite de instalação excedido' }
  }

  // Initialize status map when modal opens or selection changes
  useEffect(() => {
    if (isOpen && !isRunning && !isFinished) {
      const init: Record<string, ItemStatus> = {}
      selectedServices.forEach((svc) => {
        init[svc.service_name] = { state: 'pending', message: 'Aguardando fila...' }
      })
      setStatuses(init)
      setCurrentIndex(-1)
      setIsFinished(false)
      cancelRequestedRef.current = false
    }
  }, [isOpen, selectedServices])

  // Track live progress message from transmit/installActivity for the currently installing app
  useEffect(() => {
    if (!isRunning || currentIndex < 0 || currentIndex >= selectedServices.length) return
    const currentSvc = selectedServices[currentIndex]
    if (!currentSvc) return

    const last = installActivity[installActivity.length - 1]
    if (last && last.service_name === currentSvc.service_name) {
      if (last.type === 'error') {
        setStatuses((prev) => ({
          ...prev,
          [currentSvc.service_name]: {
            state: 'error',
            message: last.message || 'Falha na instalação',
          },
        }))
      } else if (last.type === 'completed' || last.type === 'update-complete') {
        setStatuses((prev) => ({
          ...prev,
          [currentSvc.service_name]: {
            state: 'completed',
            message: 'Instalado com sucesso',
          },
        }))
      } else if (last.message) {
        setStatuses((prev) => ({
          ...prev,
          [currentSvc.service_name]: {
            state: 'installing',
            message: last.message,
          },
        }))
      }
    }
  }, [installActivity, isRunning, currentIndex, selectedServices])

  const startBulkInstall = async () => {
    if (selectedServices.length === 0) return
    onTargetSelected?.(target)
    setIsRunning(true)
    setIsFinished(false)
    cancelRequestedRef.current = false

    for (let i = 0; i < selectedServices.length; i++) {
      if (cancelRequestedRef.current) {
        break
      }

      const svc = selectedServices[i]
      setCurrentIndex(i)

      setStatuses((prev) => ({
        ...prev,
        [svc.service_name]: {
          state: 'installing',
          message: `Iniciando implantação de ${svc.friendly_name || svc.service_name}...`,
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
        } else if (target === 'portainer') {
          // Portainer is synchronous on backend
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'completed',
              message: res.message || 'Instalação no Portainer concluída com sucesso',
            },
          }))
        } else {
          // Local installation is async via Docker pull & run
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'installing',
              message: 'Baixando imagem e configurando contêiner...',
            },
          }))

          const outcome = await waitForLocalCompletion(svc.service_name)
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
            message: err?.message || 'Erro de comunicação',
          },
        }))
      }

      // Small breather pause between sequential service dispatches to keep system responsive
      await new Promise((resolve) => setTimeout(resolve, 800))
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
      onClose()
    }
  }

  const completedCount = Object.values(statuses).filter(
    (s) => s.state === 'completed'
  ).length
  const errorCount = Object.values(statuses).filter(
    (s) => s.state === 'error'
  ).length
  const progressPct =
    selectedServices.length > 0
      ? Math.round(
          ((Math.max(0, currentIndex) + (isFinished ? 1 : 0)) /
            selectedServices.length) *
            100
        )
      : 0

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onClose={isRunning ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <DialogPanel
          transition
          className="relative bg-surface-primary rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-border-subtle transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
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
                  {selectedServices.length} Selecionados
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Implantação sequencial e controlada para prevenir sobrecarga de CPU e rede.
              </p>
            </div>
          </div>

          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <IconX size={20} />
            </button>
          )}
        </div>

        {/* Target Destination Selector (when not running) */}
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
                    Implantar como Stacks no servidor dedicado
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar (when running or finished) */}
        {(isRunning || isFinished) && (
          <div className="p-4 border-b border-border-subtle bg-surface-secondary/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-mil">
              <span className="text-text-primary font-bold">
                {isRunning
                  ? `Instalando ${currentIndex + 1} de ${selectedServices.length}...`
                  : `Fila finalizada: ${completedCount} instalados com sucesso`}
              </span>
              <span className="text-desert-orange font-bold font-mono">
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
              <div
                className="h-full bg-desert-orange rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Services List with Status */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {selectedServices.map((svc, idx) => {
            const st = statuses[svc.service_name] || {
              state: 'pending',
              message: 'Pendente',
            }
            const isCurrent = isRunning && currentIndex === idx

            return (
              <div
                key={svc.service_name}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                  isCurrent
                    ? 'border-desert-orange bg-desert-orange/10 shadow-sm'
                    : st.state === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : st.state === 'error'
                        ? 'border-desert-red/30 bg-desert-red/5'
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
                    <div className="font-semibold text-xs text-text-primary truncate">
                      {svc.friendly_name || svc.service_name}
                    </div>
                    <div className="text-[0.6875rem] text-text-muted truncate mt-0.5">
                      {st.message}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {st.state === 'installing' && (
                    <span className="flex items-center gap-1.5 text-xs text-desert-orange font-medium">
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-desert-orange border-t-transparent rounded-full" />
                      <span>Instalando</span>
                    </span>
                  )}
                  {st.state === 'completed' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <IconCheck size={16} />
                      <span className="hidden sm:inline">Pronto</span>
                    </span>
                  )}
                  {st.state === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-desert-red font-semibold">
                      <IconAlertTriangle size={16} />
                      <span className="hidden sm:inline">Erro</span>
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
                Concluídos: <strong>{completedCount}</strong> | Erros:{' '}
                <strong>{errorCount}</strong>
              </span>
            ) : (
              <span>
                Pronto para instalar <strong>{selectedServices.length}</strong>{' '}
                aplicativos sequencialmente.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && !isFinished && (
              <>
                <StyledButton variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </StyledButton>
                <StyledButton
                  variant="primary"
                  size="sm"
                  icon="IconPlayerPlay"
                  onClick={startBulkInstall}
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
              <StyledButton
                variant="primary"
                size="sm"
                icon="IconCheck"
                onClick={() => {
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
            )}
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
)
}
