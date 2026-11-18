import { useEffect, useMemo } from 'react'
import { IconCheck, IconDatabase, IconAlertTriangle } from '@tabler/icons-react'
import {
  getDiskAvailableBytes,
  StorageMountTarget,
  useStorageOverview,
} from '~/hooks/useStorageOverview'
import { formatBytes } from '~/lib/util'

interface TargetDiskSelectorProps {
  value?: string
  onChange: (diskPath: string) => void
  moduleKey?: string
  requiredBytes?: number
  disabled?: boolean
  title?: string
}

export function TargetDiskSelector({
  value,
  onChange,
  moduleKey,
  requiredBytes = 0,
  disabled = false,
  title = 'Onde Salvar estes Arquivos (HD de Destino):',
}: TargetDiskSelectorProps) {
  const { data: overview, isLoading } = useStorageOverview()

  const activeModuleDisk = moduleKey
    ? overview?.moduleLocations?.[moduleKey]?.currentDiskPath
    : undefined

  const resolvedDefault = useMemo(() => {
    if (!overview) return ''
    return (
      activeModuleDisk ||
      overview.preferredDownloadDisk ||
      overview.storageRoot ||
      overview.mountTargets?.[0]?.path ||
      ''
    )
  }, [overview, activeModuleDisk])

  useEffect(() => {
    if (!value && resolvedDefault) {
      onChange(resolvedDefault)
    }
  }, [value, resolvedDefault, onChange])

  const selectedPath = value || resolvedDefault
  const disks: StorageMountTarget[] = overview?.mountTargets || []

  return (
    <div className="space-y-2 text-left">
      <label className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wide">
        <IconDatabase className="size-4 text-desert-orange shrink-0" />
        <span>{title}</span>
      </label>

      {isLoading ? (
        <p className="text-xs text-text-muted py-2">Carregando discos físicos disponíveis...</p>
      ) : disks.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {disks.map((disk) => {
            const isSelected = selectedPath === disk.path
            const isCurrentModuleDisk = activeModuleDisk === disk.path
            const availBytes = getDiskAvailableBytes(disk)
            const hasEnough = !requiredBytes || requiredBytes <= 0 || availBytes >= requiredBytes

            return (
              <button
                key={`disk-choice-${disk.path}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange(disk.path)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSelected
                    ? hasEnough
                      ? 'border-desert-green bg-desert-green/10 shadow-sm'
                      : 'border-desert-red bg-desert-red/10 shadow-sm'
                    : 'border-border-default bg-surface-secondary hover:border-desert-tan'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-text-primary flex flex-wrap items-center gap-1.5">
                    <span className="truncate">{disk.label}</span>
                    {isCurrentModuleDisk && (
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded font-mono font-semibold bg-surface-primary border border-border-default text-text-secondary">
                        PASTA ATUAL
                      </span>
                    )}
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[0.625rem] bg-desert-green text-white px-1.5 py-0.5 rounded font-mono font-bold">
                        <IconCheck className="size-3" />
                        DESTINO
                      </span>
                    )}
                  </div>
                  <div className="text-[0.6875rem] font-mono text-text-secondary mt-0.5 break-all">
                    {disk.realHostPath || disk.path} • Livre:{' '}
                    <strong className={hasEnough ? 'text-desert-green' : 'text-desert-red'}>
                      {formatBytes(availBytes, 1)}
                    </strong>{' '}
                    / {formatBytes(disk.totalBytes, 1)}
                    {disk.quotaEnabled && disk.quotaLimitBytes
                      ? ` (Cota: ${formatBytes(disk.quotaLimitBytes, 1)})`
                      : ''}
                  </div>
                </div>

                {requiredBytes > 0 && (
                  <div className="text-right shrink-0">
                    {hasEnough ? (
                      <span className="text-[0.6875rem] text-desert-green font-semibold">
                        Espaço Suficiente ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] text-desert-red font-semibold">
                        <IconAlertTriangle className="size-3.5" />
                        Espaço Insuficiente
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-text-muted">Disco padrão do sistema (/storage)</p>
      )}
    </div>
  )
}
