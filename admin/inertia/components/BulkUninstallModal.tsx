import { useState, useEffect, useRef } from 'react'
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react'
import BulkQueueFrame, { BulkQueueItemStatus } from '~/components/BulkQueueFrame'
import { ServiceSlim } from '../../types/services'
import api from '~/lib/api'

interface BulkUninstallModalProps {
  isOpen: boolean
  onClose: () => void
  selectedServices: ServiceSlim[]
  onCompletedAll?: () => void
}

export default function BulkUninstallModal({
  isOpen,
  onClose,
  selectedServices,
  onCompletedAll,
}: BulkUninstallModalProps) {
  const [removeImages, setRemoveImages] = useState(false)
  const [queueItems, setQueueItems] = useState<ServiceSlim[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [statuses, setStatuses] = useState<Record<string, BulkQueueItemStatus>>({})

  const cancelRequestedRef = useRef(false)

  useEffect(() => {
    if (isOpen && !isRunning && !isFinished) {
      setQueueItems(selectedServices)
      const init: Record<string, BulkQueueItemStatus> = {}
      selectedServices.forEach((svc) => {
        init[svc.service_name] = { state: 'pending', message: 'Aguardando fila de remoção...' }
      })
      setStatuses(init)
      setCurrentIndex(-1)
      cancelRequestedRef.current = false
    }
  }, [isOpen, selectedServices, isRunning, isFinished])

  const startBulkUninstall = async (overrideList?: ServiceSlim[]) => {
    const itemsToRemove =
      overrideList && overrideList.length > 0
        ? overrideList
        : queueItems.length > 0
          ? queueItems
          : selectedServices
    if (itemsToRemove.length === 0) return

    if (overrideList && overrideList.length > 0) {
      setQueueItems(overrideList)
      const resetStatuses: Record<string, BulkQueueItemStatus> = {}
      for (const s of overrideList) {
        resetStatuses[s.service_name] = {
          state: 'pending',
          message: 'Aguardando nova tentativa...',
        }
      }
      setStatuses(resetStatuses)
    } else if (queueItems.length === 0) {
      setQueueItems(itemsToRemove)
    }

    setIsRunning(true)
    setIsFinished(false)
    cancelRequestedRef.current = false

    for (let i = 0; i < itemsToRemove.length; i++) {
      if (cancelRequestedRef.current) break

      const svc = itemsToRemove[i]
      setCurrentIndex(i)

      setStatuses((prev) => ({
        ...prev,
        [svc.service_name]: {
          state: 'active',
          message: `Parando e removendo "${svc.friendly_name || svc.service_name}" do servidor...`,
        },
      }))

      try {
        const res = svc.is_custom
          ? await api.deleteCustomApp(svc.service_name, removeImages)
          : await api.uninstallService(svc.service_name, removeImages)

        if (res?.success) {
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'completed',
              message: svc.is_custom
                ? 'Aplicativo personalizado excluído com sucesso.'
                : 'Contêiner e stack removidos com sucesso.',
            },
          }))
        } else {
          setStatuses((prev) => ({
            ...prev,
            [svc.service_name]: {
              state: 'error',
              message: res?.message || 'Falha ao desinstalar o serviço.',
            },
          }))
        }
      } catch (err: any) {
        setStatuses((prev) => ({
          ...prev,
          [svc.service_name]: {
            state: 'error',
            message: err?.message || 'Erro de comunicação durante a desinstalação.',
          },
        }))
      }

      if (cancelRequestedRef.current) break

      // Breve pausa sequencial para evitar sobrecarga no daemon Docker / Portainer
      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    if (cancelRequestedRef.current) {
      setStatuses((prev) => {
        const next = { ...prev }
        for (const svc of itemsToRemove) {
          if (next[svc.service_name]?.state === 'pending') {
            next[svc.service_name] = {
              state: 'error',
              message: 'Não removido (fila interrompida pelo operador)',
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
    setRemoveImages(false)
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
  const progressPct =
    displayList.length > 0
      ? isFinished
        ? Math.min(100, Math.round((settledCount / displayList.length) * 100))
        : Math.min(99, Math.round(((settledCount + (currentIndex >= 0 ? 0.5 : 0)) / displayList.length) * 100))
      : 0

  return (
    <BulkQueueFrame
      isOpen={isOpen}
      onClose={handleClose}
      accent="red"
      icon={<IconTrash size={22} />}
      title="Desinstalação em Massa"
      subtitle="Remoção sequencial limpa — para cada aplicativo, o contêiner e a stack são encerrados no Docker/Portainer mantendo seus dados na pasta de armazenamento."
      activeVerb="Removendo"
      completedLabel="removido(s)"
      completedItemBadge="Removido"
      readyActionLabel="Iniciar Desinstalação em Massa"
      readyActionIcon="IconTrash"
      readySummaryText={`Pronto para desinstalar ${displayList.length} aplicativo(s) sequencialmente.`}
      runningNotice="Removendo contêineres e stacks sequencialmente — aguarde a conclusão..."
      retryLabel="Tentar Falhas"
      items={displayList}
      statuses={statuses}
      isRunning={isRunning}
      isFinished={isFinished}
      currentIndex={currentIndex}
      progressPct={progressPct}
      onStart={() => startBulkUninstall()}
      onCancel={handleCancel}
      onRetryFailed={(failedOnly) => startBulkUninstall(failedOnly)}
      onCompleteAll={() => {
        setIsFinished(false)
        setRemoveImages(false)
        onClose()
        if (onCompletedAll) {
          onCompletedAll()
        } else {
          window.location.reload()
        }
      }}
      renderItemBadge={(svc) => (
        <span className="text-[0.625rem] font-normal px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-subtle shrink-0">
          {svc.is_custom
            ? 'Personalizado'
            : svc.node === 'portainer' || svc.node === 'dell-micro'
              ? 'Portainer'
              : 'Docker Local'}
        </span>
      )}
      preStartContent={
        <div className="p-4 border-b border-border-subtle bg-desert-red/5 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-text-secondary">
            <IconAlertTriangle size={18} className="text-desert-red shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-desert-red">
                Os contêineres e stacks selecionados serão parados e removidos do servidor.
              </p>
              <p className="text-text-muted mt-0.5">
                Para apps do catálogo N.O.M.A.D., os arquivos salvos no armazenamento permanecem no disco para futura reinstalação. Apps personalizados terão seu registro removido do catálogo.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pl-0.5">
            <input
              type="checkbox"
              checked={removeImages}
              onChange={(e) => setRemoveImages(e.target.checked)}
              className="accent-desert-red h-4 w-4 rounded cursor-pointer"
            />
            <span className="text-xs font-medium text-text-primary">
              Remover também as imagens Docker para liberar espaço em disco
            </span>
          </label>
        </div>
      }
    />
  )
}
