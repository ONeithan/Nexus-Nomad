import { Head, Link, router } from '@inertiajs/react'
import StyledTable from '~/components/StyledTable'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import { useModals } from '~/context/ModalContext'
import StyledModal from '~/components/StyledModal'
import { useNotifications } from '~/context/NotificationContext'
import { useEffect, useRef, useState } from 'react'
import api from '~/lib/api'
import axios from 'axios'
import DownloadURLModal from '~/components/DownloadURLModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import useDownloads from '~/hooks/useDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import CuratedCollectionCard from '~/components/CuratedCollectionCard'
import CountryPickerModal from '~/components/CountryPickerModal'
import MapDownloadConfirmModal from '~/components/maps/MapDownloadConfirmModal'
import { TargetDiskSelector } from '~/components/storage/TargetDiskSelector'
import { useStorageOverview } from '~/hooks/useStorageOverview'
import type { CollectionWithStatus } from '../../../types/collections'
import type { MapFileWithStorage, MapLibraryStorageSummary } from '../../../types/maps'
import ActiveDownloads from '~/components/ActiveDownloads'
import Alert from '~/components/Alert'
import { formatBytes } from '~/lib/util'
import { hasDownloadedGlobalMap } from '~/lib/global_map_banner'
import { IconDatabase, IconExternalLink, IconFolder, IconLink } from '@tabler/icons-react'

const CURATED_COLLECTIONS_KEY = 'curated-map-collections'
const GLOBAL_MAP_INFO_KEY = 'global-map-info'

export default function MapsManager(props: {
  maps: {
    baseAssetsExist: boolean
    worldBasemapExists: boolean
    regionFiles: MapFileWithStorage[]
    storage?: MapLibraryStorageSummary
  }
}) {
  const queryClient = useQueryClient()
  const { openModal, closeAllModals } = useModals()
  const { addNotification } = useNotifications()
  const { data: storageOverview } = useStorageOverview()
  const [downloading, setDownloading] = useState(false)
  const [switchingDisk, setSwitchingDisk] = useState(false)
  const [selectedDisk, setSelectedDisk] = useState('')
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null)

  const currentMapsDiskPath =
    storageOverview?.moduleLocations?.['maps']?.currentDiskPath ||
    props.maps.storage?.currentDiskPath ||
    storageOverview?.storageRoot ||
    ''
  const activeSelectedDisk =
    selectedDisk ||
    currentMapsDiskPath ||
    storageOverview?.preferredDownloadDisk ||
    storageOverview?.storageRoot ||
    ''

  const { data: curatedCollections } = useQuery({
    queryKey: [CURATED_COLLECTIONS_KEY],
    queryFn: () => api.listCuratedMapCollections(),
    refetchOnWindowFocus: false,
  })

  const { data: activeMapDownloads = [], invalidate: invalidateDownloads } = useDownloads({
    filetype: 'map',
    enabled: true,
  })

  // Refresh the Stored Map Files list when a map download finishes. We pass props.maps.regionFiles
  // straight through from the server-side render, so without an Inertia partial reload it stays stale
  // until the user navigates away and back.
  const prevMapDownloadCountRef = useRef(activeMapDownloads.length)
  useEffect(() => {
    if (activeMapDownloads.length < prevMapDownloadCountRef.current) {
      router.reload({ only: ['maps'] })
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
    }
    prevMapDownloadCountRef.current = activeMapDownloads.length
  }, [activeMapDownloads.length])

  const { data: globalMapInfo } = useQuery({
    queryKey: [GLOBAL_MAP_INFO_KEY],
    queryFn: () => api.getGlobalMapInfo(),
    refetchOnWindowFocus: false,
  })
  const globalMapAlreadyDownloaded = hasDownloadedGlobalMap(globalMapInfo?.key, props.maps.regionFiles)

  async function applyDiskMoveNow() {
    if (!activeSelectedDisk || !storageOverview) return
    try {
      setSwitchingDisk(true)
      await axios.post('/api/system/storage/move', {
        sourcePath: `${storageOverview.storageRoot}/maps`,
        targetDiskPath: activeSelectedDisk,
        createSymlink: activeSelectedDisk !== storageOverview.storageRoot,
      })
      addNotification({
        type: 'success',
        message: 'Pasta de mapas vinculada ao disco selecionado.',
      })
      await queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      router.reload({ only: ['maps'] })
    } catch (error: any) {
      addNotification({
        type: 'error',
        message:
          error?.response?.data?.error ||
          error?.message ||
          'Falha ao alterar o HD da pasta de mapas.',
      })
    } finally {
      setSwitchingDisk(false)
    }
  }

  const setupWorldBasemap = useMutation({
    mutationFn: () => api.setupWorldBasemap(activeSelectedDisk || undefined),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Mapa base baixado com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      router.reload({ only: ['maps'] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message:
          error?.message ||
          'Não foi possível baixar o mapa base. Conecte este NOMAD à internet e tente novamente.',
      })
    },
  })

  async function downloadBaseAssets() {
    try {
      setDownloading(true)

      const res = await api.downloadBaseMapAssets(activeSelectedDisk || undefined)
      if (!res) {
        throw new Error('Ocorreu um erro desconhecido ao baixar os recursos básicos do mapa.')
      }

      if (res.success) {
        addNotification({
          type: 'success',
          message: 'Recursos básicos do mapa baixados com sucesso.',
        })
        queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
        router.reload()
      }
    } catch (error: any) {
      console.error('Error downloading base assets:', error)
      addNotification({
        type: 'error',
        message:
          error?.message || 'Ocorreu um erro ao baixar os recursos básicos do mapa. Tente novamente.',
      })
    } finally {
      setDownloading(false)
    }
  }

  async function downloadCollection(record: CollectionWithStatus, targetDisk?: string) {
    try {
      await api.downloadMapCollection(record.slug, targetDisk || activeSelectedDisk || undefined)
      invalidateDownloads()
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      addNotification({
        type: 'success',
        message: `O download da coleção "${record.name}" foi colocado na fila.`,
      })
      closeAllModals()
    } catch (error: any) {
      console.error('Error downloading collection:', error)
      addNotification({
        type: 'error',
        message: error?.message || `Falha ao iniciar o download de "${record.name}".`,
      })
      throw error
    }
  }

  async function downloadCustomFile(url: string, targetDisk?: string) {
    try {
      await api.downloadRemoteMapRegion(url, targetDisk || activeSelectedDisk || undefined)
      invalidateDownloads()
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      addNotification({
        type: 'success',
        message: 'O download foi colocado na fila.',
      })
    } catch (error: any) {
      console.error('Error downloading custom file:', error)
      addNotification({
        type: 'error',
        message: error?.message || 'Falha ao iniciar o download do arquivo de mapa.',
      })
      throw error
    }
  }

  async function deleteFile(file: MapFileWithStorage) {
    if (file.type !== 'file') return

    try {
      setDeletingFileKey(file.key)
      await api.deleteMapRegionFile(file.name)
      addNotification({
        type: 'success',
        message: `${file.name} foi excluído.`,
      })
      closeAllModals()
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      router.reload({ only: ['maps'] })
    } catch (error) {
      console.error('Error deleting map file:', error)
      addNotification({
        type: 'error',
        message: `Falha ao excluir ${file.name}. Tente novamente.`,
      })
    } finally {
      setDeletingFileKey(null)
    }
  }

  async function confirmDeleteFile(file: MapFileWithStorage) {
    openModal(
      <StyledModal
        title="Confirmar Exclusão?"
        onConfirm={() => deleteFile(file)}
        onCancel={closeAllModals}
        open={true}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        confirmLoading={file.type === 'file' && deletingFileKey === file.key}
      >
        <p className="text-text-secondary">
          Tem certeza de que deseja excluir {file.name}? Esta ação não pode ser desfeita.
        </p>
      </StyledModal>,
      'confirm-delete-file-modal'
    )
  }

  async function confirmDownload(record: CollectionWithStatus) {
    if (record.all_installed) {
      addNotification({
        message: `Todos os recursos da coleção "${record.name}" já foram baixados.`,
        type: 'info',
      })
      return
    }
    const collectionBytes =
      record.resources?.reduce((acc, r) => acc + (r.size_mb || 0) * 1024 * 1024, 0) || 0

    openModal(
      <MapDownloadConfirmModal
        title="Confirmar Download da Região?"
        description={`Você está prestes a baixar "${record.name}". Escolha abaixo o HD onde deseja gravar os arquivos de mapa desta coleção.`}
        requiredBytes={collectionBytes}
        initialDisk={activeSelectedDisk}
        confirmText="Baixar"
        onCancel={closeAllModals}
        onConfirm={async (disk) => {
          setSelectedDisk(disk)
          await downloadCollection(record, disk)
        }}
      />,
      'confirm-download-file-modal'
    )
  }

  async function confirmGlobalMapDownload() {
    if (!globalMapInfo) return
    openModal(
      <MapDownloadConfirmModal
        title="Baixar Mapa Global?"
        description={`Isso baixará o mapa global completo do Protomaps (${formatBytes(globalMapInfo.size, 1)}, compilação ${globalMapInfo.date}). Cobre o planeta inteiro, sem necessidade de arquivos de regiões individuais. Escolha abaixo o HD de destino com espaço disponível.`}
        requiredBytes={globalMapInfo.size}
        initialDisk={activeSelectedDisk}
        confirmText="Baixar"
        onCancel={closeAllModals}
        onConfirm={async (disk) => {
          setSelectedDisk(disk)
          await api.downloadGlobalMap(disk || undefined)
          invalidateDownloads()
          queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
          addNotification({
            type: 'success',
            message:
              'O download do mapa global foi colocado na fila. Este é um arquivo grande (~125 GB) e pode levar bastante tempo.',
          })
          closeAllModals()
        }}
      />,
      'confirm-global-map-download-modal'
    )
  }

  function openCountryPickerModal() {
    openModal(
      <CountryPickerModal
        onCancel={closeAllModals}
        installedFilenames={(props.maps.regionFiles ?? []).map((f) => f.name)}
        initialDisk={activeSelectedDisk}
        onDownloadStart={() => {
          invalidateDownloads()
          queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
          addNotification({
            type: 'success',
            message: 'Download colocado na fila. Acompanhe o progresso abaixo.',
          })
          closeAllModals()
        }}
      />,
      'country-picker-modal'
    )
  }

  async function openDownloadModal() {
    openModal(
      <DownloadURLModal
        title="Baixar Arquivo de Mapa"
        suggestedURL="ex.: https://github.com/Crosstalk-Solutions/project-nomad-maps/raw/refs/heads/master/pmtiles/california.pmtiles"
        initialDisk={activeSelectedDisk}
        moduleKey="maps"
        showDiskSelector={true}
        onCancel={() => closeAllModals()}
        onPreflightSuccess={async (url, targetDisk) => {
          if (targetDisk) setSelectedDisk(targetDisk)
          await downloadCustomFile(url, targetDisk)
          closeAllModals()
        }}
      />,
      'download-map-file-modal'
    )
  }

  const refreshManifests = useMutation({
    mutationFn: () => api.refreshManifests(),
    onSuccess: () => {
      addNotification({
        message: 'Coleções de mapas atualizadas com sucesso.',
        type: 'success',
      })
      queryClient.invalidateQueries({ queryKey: [CURATED_COLLECTIONS_KEY] })
    },
  })

  return (
    <SettingsLayout>
      <Head title="Gerenciador de Mapas | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-4xl font-semibold mb-2">Gerenciador de Mapas</h1>
              <p className="text-text-muted">Gerencie seus arquivos de mapas armazenados e explore novas regiões!</p>
            </div>
            <div className="flex space-x-4">

            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border-default bg-surface-primary p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <IconDatabase className="size-4 text-desert-orange" />
                    Disco Ativo da Pasta de Mapas:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      currentMapsDiskPath === storageOverview?.storageRoot ||
                      (props.maps.storage?.isPrimaryDisk !== false &&
                        !storageOverview?.moduleLocations?.['maps']?.isSymlink)
                        ? 'bg-surface-secondary text-text-primary border-border-default'
                        : 'bg-desert-green/15 text-desert-green border-desert-green/30'
                    }`}
                  >
                    {storageOverview?.moduleLocations?.['maps']?.currentDiskLabel ||
                      props.maps.storage?.currentDiskLabel ||
                      'Armazenamento Interno NOMAD'}
                  </span>
                  {Boolean(
                    (storageOverview?.moduleLocations?.['maps']?.isSymlink ||
                      props.maps.storage?.isSymlink) &&
                      currentMapsDiskPath &&
                      storageOverview?.storageRoot &&
                      currentMapsDiskPath !== storageOverview.storageRoot
                  ) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-desert-orange/15 text-desert-orange border border-desert-orange/30">
                      <IconLink className="size-3.5" />
                      Link Ativo (HD Secundário)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1 font-mono break-all">
                    <IconFolder className="size-3.5 shrink-0 text-text-secondary" />
                    {storageOverview?.moduleLocations?.['maps']?.realHostPath ||
                      props.maps.storage?.realHostPath ||
                      '/storage/maps'}
                  </span>
                  {props.maps.storage?.disksSummary && props.maps.storage.disksSummary.length > 0 && (
                    <span className="text-text-secondary">
                      •{' '}
                      {props.maps.storage.disksSummary
                        .map(
                          (d) =>
                            `${d.count} ${d.count === 1 ? 'mapa' : 'mapas'} (${formatBytes(d.totalBytes, 1)}) em ${d.diskLabel}`
                        )
                        .join(' | ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeSelectedDisk && activeSelectedDisk !== currentMapsDiskPath && (
                  <StyledButton
                    variant="primary"
                    icon="IconDatabase"
                    loading={switchingDisk}
                    onClick={applyDiskMoveNow}
                  >
                    {(props.maps.regionFiles?.length ?? 0) > 0
                      ? 'Mover & Vincular Mapas Neste HD'
                      : 'Vincular Pasta de Mapas neste HD'}
                  </StyledButton>
                )}
                <Link
                  href="/settings/storage"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default bg-surface-secondary hover:border-desert-orange hover:text-desert-orange text-xs font-semibold text-text-primary transition-colors"
                >
                  <IconExternalLink className="size-4" />
                  Gerenciar Discos
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle">
              <TargetDiskSelector
                moduleKey="maps"
                value={activeSelectedDisk}
                onChange={setSelectedDisk}
                title="HD Selecionado para os Próximos Downloads de Mapas:"
              />
            </div>
          </div>
          {!props.maps.baseAssetsExist && (
            <Alert
              title="Os recursos básicos do mapa ainda não foram instalados. Baixe-os primeiro para habilitar a funcionalidade de mapas."
              type="warning"
              variant="solid"
              className="my-4"
              buttonProps={{
                variant: 'secondary',
                children: 'Baixar Recursos Básicos',
                icon: 'IconDownload',
                loading: downloading,
                onClick: () => downloadBaseAssets(),
              }}
            />
          )}
          {props.maps.baseAssetsExist && !props.maps.worldBasemapExists && (
            <Alert
              title="Mapa base mundial não baixado"
              message="O mapa base mundial de baixo zoom (~15 MB) ainda não foi baixado, por isso o mapa aparece em branco fora das regiões que você baixou. Conecte este NOMAD à internet e baixe-o uma única vez para uso offline."
              type="warning"
              variant="solid"
              className="my-4"
              buttonProps={{
                variant: 'secondary',
                children: 'Baixar Mapa Base',
                icon: 'IconCloudDownload',
                loading: setupWorldBasemap.isPending,
                onClick: () => setupWorldBasemap.mutate(),
              }}
            />
          )}
          {globalMapInfo && globalMapAlreadyDownloaded && (
            <Alert
              title="Mapa Global Instalado"
              message={`Sua compilação do mapa global ${globalMapInfo.date} (${formatBytes(globalMapInfo.size, 1)}) está armazenada localmente e pronta para uso offline.`}
              type="success"
              variant="bordered"
              className="mt-8"
              icon="IconCircleCheck"
              buttonProps={{
                variant: 'secondary',
                children: 'Baixar compilação mais recente',
                icon: 'IconRefresh',
                onClick: () => confirmGlobalMapDownload(),
              }}
            />
          )}
          {globalMapInfo && !globalMapAlreadyDownloaded && (
            <Alert
              title="Cobertura de Mapa Global Disponível"
              message={`Baixe um mapa mundial completo do Protomaps (${formatBytes(globalMapInfo.size, 1)}, compilação ${globalMapInfo.date}). É um arquivo grande, mas cobre o planeta inteiro — sem necessidade de baixar regiões individuais.`}
              type="info-inverted"
              variant="bordered"
              className="mt-8"
              icon="IconWorld"
              buttonProps={{
                variant: 'primary',
                children: 'Baixar Mapa Global',
                icon: 'IconCloudDownload',
                loading: false,
                onClick: () => confirmGlobalMapDownload(),
              }}
            />
          )}
          <Alert
            title="Baixar por país ou região"
            message="Escolha apenas os países de que você precisa — de um único país a um continente inteiro — e buscaremos somente esses blocos do arquivo global do Protomaps. Muito menor que o mapa global completo de 125 GB."
            type="info-inverted"
            variant="bordered"
            className="mt-8"
            icon="IconMap2"
            buttonProps={{
              variant: 'primary',
              children: 'Escolher Países',
              icon: 'IconMap2',
              onClick: openCountryPickerModal,
            }}
          />

          {activeMapDownloads.filter((d) => d.status !== 'failed').length > 0 && (
            <div className="mt-6 p-4 rounded-xl border border-desert-orange/40 bg-desert-orange/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-desert-orange uppercase tracking-wider">
                  Downloads de Mapas em Andamento
                </span>
                <span className="text-xs font-mono text-text-secondary">
                  {activeMapDownloads.filter((d) => d.status !== 'failed').length} ativo(s)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeMapDownloads
                  .filter((d) => d.status !== 'failed')
                  .map((dl) => {
                    const pct = Math.min(100, Math.max(0, Math.round(dl.progress || 0)))
                    return (
                      <div
                        key={dl.jobId}
                        className="p-3 rounded-lg bg-surface-primary border border-border-default space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-text-primary truncate">
                            {dl.title || dl.filepath?.split(/[/\\]/).pop() || dl.url}
                          </span>
                          <span className="font-mono font-bold text-desert-orange shrink-0">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-desert-orange transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[0.6875rem] font-mono text-text-muted">
                          <span>{dl.downloadedBytes ? formatBytes(dl.downloadedBytes, 1) : '0 B'}</span>
                          <span>{dl.totalBytes ? formatBytes(dl.totalBytes, 1) : 'Calculando...'}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="mt-8 mb-6 flex items-center justify-between">
            <StyledSectionHeader title="Regiões de Mapas Curadas" className="!mb-0" />
            <StyledButton
              onClick={() => refreshManifests.mutate()}
              disabled={refreshManifests.isPending}
              icon="IconRefresh"
            >
              Forçar Atualização das Coleções
            </StyledButton>
          </div>
          <div className="!mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {curatedCollections?.map((collection) => (
              <CuratedCollectionCard
                key={collection.slug}
                collection={collection}
                onClick={(collection) => confirmDownload(collection)}
              />
            ))}
            {curatedCollections && curatedCollections.length === 0 && (
              <p className="text-text-muted">Nenhuma coleção curada disponível.</p>
            )}
          </div>
          <div className="mt-12 mb-6 flex items-center justify-between">
            <StyledSectionHeader title="Mapas Instalados" className="!mb-0" />
            <StyledButton
              variant="primary"
              onClick={openDownloadModal}
              loading={downloading}
              icon="IconCloudDownload"
            >
              Baixar Arquivo de Mapa Personalizado
            </StyledButton>
          </div>
          <StyledTable<MapFileWithStorage & { actions?: any }>
            className="font-semibold mt-4"
            rowLines={true}
            loading={false}
            compact
            columns={[
              { accessor: 'name', title: 'Nome' },
              {
                accessor: 'size_bytes',
                title: 'Tamanho',
                render: (record) => (
                  <span className="text-text-secondary tabular-nums whitespace-nowrap">
                    {record.size_bytes ? formatBytes(record.size_bytes, 1) : '—'}
                  </span>
                ),
              },
              {
                accessor: 'diskLabel',
                title: 'Armazenamento (HD)',
                render: (record) => (
                  <div className="flex flex-col gap-1 py-0.5 max-w-md">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                          record.isPrimaryDisk === false
                            ? 'bg-desert-green/15 text-desert-green border-desert-green/30'
                            : 'bg-surface-secondary text-text-secondary border-border-default'
                        }`}
                      >
                        <IconDatabase className="size-3.5 shrink-0" />
                        {record.diskLabel || 'Armazenamento Interno NOMAD'}
                      </span>
                      {record.isSymlink && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-desert-orange/15 text-desert-orange border border-desert-orange/30">
                          <IconLink className="size-3" />
                          Link
                        </span>
                      )}
                      {record.inActiveLibrary === false && (
                        <span
                          title="Este arquivo está na pasta /maps de outro HD que não é a biblioteca ativa atual."
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-desert-orange/15 text-desert-orange border border-desert-orange/30"
                        >
                          Fora da pasta ativa
                        </span>
                      )}
                    </div>
                    {(record.realHostPath || record.realPath) && (
                      <span className="text-xs font-mono text-text-muted break-all">
                        {record.realHostPath || record.realPath}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                accessor: 'actions',
                title: 'Ações',
                render: (record) => (
                  <div className="flex space-x-2">
                    <StyledButton
                      variant="danger"
                      icon={'IconTrash'}
                      disabled={record.inActiveLibrary === false}
                      title={
                        record.inActiveLibrary === false
                          ? 'Arquivo armazenado em outro HD fora da pasta ativa de mapas. Gerencie em Armazenamento & Samba.'
                          : 'Excluir arquivo de mapa'
                      }
                      onClick={() => {
                        if (record.inActiveLibrary !== false) {
                          confirmDeleteFile(record)
                        }
                      }}
                    >
                      Excluir
                    </StyledButton>
                  </div>
                ),
              },
            ]}
            data={props.maps.regionFiles || []}
          />
          <ActiveDownloads filetype="map" withHeader />
        </main>
      </div>
    </SettingsLayout>
  )
}
