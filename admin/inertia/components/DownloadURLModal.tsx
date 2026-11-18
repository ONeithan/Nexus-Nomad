import { useState } from 'react'
import StyledModal, { StyledModalProps } from './StyledModal'
import Input from './inputs/Input'
import { TargetDiskSelector } from './storage/TargetDiskSelector'
import { getDiskAvailableBytes, useStorageOverview } from '~/hooks/useStorageOverview'
import api from '~/lib/api'
import { formatBytes } from '~/lib/util'

export type DownloadURLModalProps = Omit<
  StyledModalProps,
  'onConfirm' | 'open' | 'confirmText' | 'cancelText' | 'confirmVariant' | 'children'
> & {
  suggestedURL?: string
  initialDisk?: string
  showDiskSelector?: boolean
  moduleKey?: string
  onPreflightSuccess?: (url: string, targetDisk?: string) => void | Promise<void>
}

const DownloadURLModal: React.FC<DownloadURLModalProps> = ({
  suggestedURL,
  initialDisk = '',
  showDiskSelector = true,
  moduleKey = 'maps',
  onPreflightSuccess,
  ...modalProps
}) => {
  const { data: storageOverview } = useStorageOverview()
  const [url, setUrl] = useState<string>('')
  const [selectedDisk, setSelectedDisk] = useState<string>(initialDisk)
  const [detectedBytes, setDetectedBytes] = useState<number>(0)
  const [messages, setMessages] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const resolvedDisk =
    selectedDisk ||
    storageOverview?.moduleLocations?.[moduleKey]?.currentDiskPath ||
    storageOverview?.preferredDownloadDisk ||
    storageOverview?.storageRoot ||
    ''

  async function runPreflightCheck(downloadUrl: string) {
    try {
      setLoading(true)
      setMessages([`Verificando URL de destino: ${downloadUrl}`])
      const res = await api.downloadRemoteMapRegionPreflight(downloadUrl)
      if (!res) {
        throw new Error('Erro desconhecido ao verificar o arquivo remoto.')
      }

      if ('message' in res) {
        throw new Error(res.message)
      }

      const fileBytes = Number(res.size || 0)
      setDetectedBytes(fileBytes)
      setMessages((prev) => [
        ...prev,
        `Verificação concluída. Arquivo: ${res.filename}, Tamanho: ${formatBytes(fileBytes, 1)}`,
      ])

      const diskObj = storageOverview?.mountTargets?.find((m) => m.path === resolvedDisk)
      if (showDiskSelector && diskObj && fileBytes > 0) {
        const avail = getDiskAvailableBytes(diskObj)
        if (fileBytes > avail) {
          throw new Error(
            `Espaço/cota insuficiente em "${diskObj.label}" (${formatBytes(avail, 1)} livres para ${formatBytes(fileBytes, 1)} necessários). Selecione outro HD.`
          )
        }
      }

      if (onPreflightSuccess) {
        await onPreflightSuccess(downloadUrl, showDiskSelector ? resolvedDisk : undefined)
      }
    } catch (error: any) {
      console.error('Preflight check failed:', error)
      setMessages((prev) => [...prev, `Falha na verificação: ${error?.message || 'Erro desconhecido'}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <StyledModal
      {...modalProps}
      onConfirm={() => runPreflightCheck(url)}
      open={true}
      confirmText="Baixar"
      confirmIcon="IconDownload"
      cancelText="Cancelar"
      confirmVariant="primary"
      confirmLoading={loading}
      cancelLoading={loading}
      large
    >
      <div className="flex flex-col pb-2 gap-4">
        <p className="text-text-secondary text-sm">
          Informe a URL do arquivo de mapa (.pmtiles) que deseja baixar. O endereço deve estar acessível e terminar com <code className="font-mono">.pmtiles</code>. Faremos uma pré-verificação de disponibilidade e tamanho antes de iniciar.
        </p>
        <Input
          name="download-url"
          label=""
          placeholder={suggestedURL || 'Informe a URL do download...'}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {showDiskSelector && (
          <TargetDiskSelector
            moduleKey={moduleKey}
            value={resolvedDisk}
            onChange={setSelectedDisk}
            requiredBytes={detectedBytes}
            disabled={loading}
          />
        )}
        <div className="min-h-20 max-h-60 overflow-y-auto bg-surface-secondary p-4 rounded border border-border-default text-left">
          {messages.length === 0 ? (
            <p className="text-xs text-text-muted font-mono">
              Aguardando endereço para verificação...
            </p>
          ) : (
            messages.map((message, idx) => (
              <p
                key={idx}
                className="text-sm text-text-primary font-mono leading-relaxed break-words mb-2 last:mb-0"
              >
                {message}
              </p>
            ))
          )}
        </div>
      </div>
    </StyledModal>
  )
}

export default DownloadURLModal
