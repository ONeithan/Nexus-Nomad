import { useState } from 'react'
import StyledModal from '~/components/StyledModal'
import { TargetDiskSelector } from '~/components/storage/TargetDiskSelector'
import { getDiskAvailableBytes, useStorageOverview } from '~/hooks/useStorageOverview'
import { formatBytes } from '~/lib/util'

interface MapDownloadConfirmModalProps {
  title: string
  description: string
  requiredBytes?: number
  confirmText?: string
  initialDisk?: string
  moduleKey?: string
  noteText?: string
  onConfirm: (targetDisk: string) => Promise<void> | void
  onCancel: () => void
}

export default function MapDownloadConfirmModal({
  title,
  description,
  requiredBytes = 0,
  confirmText = 'Baixar',
  initialDisk = '',
  moduleKey = 'maps',
  noteText = 'Se você escolher outro disco, o N.O.M.A.D. vinculará automaticamente a pasta ao HD escolhido preservando o funcionamento offline.',
  onConfirm,
  onCancel,
}: MapDownloadConfirmModalProps) {
  const { data: overview } = useStorageOverview()
  const [selectedDisk, setSelectedDisk] = useState(initialDisk)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const resolvedDisk =
    selectedDisk ||
    overview?.moduleLocations?.[moduleKey]?.currentDiskPath ||
    overview?.preferredDownloadDisk ||
    overview?.storageRoot ||
    ''

  const selectedDiskObj = overview?.mountTargets?.find((m) => m.path === resolvedDisk)
  const availBytes = selectedDiskObj ? getDiskAvailableBytes(selectedDiskObj) : 0
  const insufficient = Boolean(
    selectedDiskObj && requiredBytes > 0 && requiredBytes > availBytes
  )

  async function handleConfirm() {
    if (insufficient) {
      setErrorMsg(
        `Espaço/cota insuficiente no disco selecionado (${formatBytes(availBytes, 1)} livres para ${formatBytes(requiredBytes, 1)} exigidos). Escolha outro HD acima.`
      )
      return
    }
    try {
      setSubmitting(true)
      setErrorMsg(null)
      await onConfirm(resolvedDisk)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao iniciar o download. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StyledModal
      title={title}
      open={true}
      confirmText={confirmText}
      confirmIcon="IconDownload"
      cancelText="Cancelar"
      confirmVariant="primary"
      confirmLoading={submitting}
      cancelLoading={submitting}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      large
    >
      <div className="space-y-4 text-left">
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>

        {requiredBytes > 0 && (
          <div className="px-3 py-2 rounded-lg border border-border-default bg-surface-secondary text-xs font-mono flex items-center justify-between">
            <span className="text-text-secondary">Espaço estimado necessário:</span>
            <strong className="text-desert-orange">{formatBytes(requiredBytes, 1)}</strong>
          </div>
        )}

        <TargetDiskSelector
          moduleKey={moduleKey}
          value={resolvedDisk}
          onChange={(disk) => {
            setSelectedDisk(disk)
            setErrorMsg(null)
          }}
          requiredBytes={requiredBytes}
          disabled={submitting}
        />

        {errorMsg && (
          <div className="p-3 rounded-lg border border-desert-red/50 bg-desert-red/10 text-xs text-desert-red font-medium">
            {errorMsg}
          </div>
        )}

        <p className="text-xs text-text-muted">{noteText}</p>
      </div>
    </StyledModal>
  )
}
