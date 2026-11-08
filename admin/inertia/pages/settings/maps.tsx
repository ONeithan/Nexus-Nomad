import { Head, router } from '@inertiajs/react'
import StyledTable from '~/components/StyledTable'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import { useModals } from '~/context/ModalContext'
import StyledModal from '~/components/StyledModal'
import { FileEntry } from '../../../types/files'
import { useNotifications } from '~/context/NotificationContext'
import { useEffect, useRef, useState } from 'react'
import api from '~/lib/api'
import DownloadURLModal from '~/components/DownloadURLModal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import useDownloads from '~/hooks/useDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import CuratedCollectionCard from '~/components/CuratedCollectionCard'
import CountryPickerModal from '~/components/CountryPickerModal'
import type { CollectionWithStatus } from '../../../types/collections'
import ActiveDownloads from '~/components/ActiveDownloads'
import Alert from '~/components/Alert'
import { formatBytes } from '~/lib/util'
import { hasDownloadedGlobalMap } from '~/lib/global_map_banner'

const CURATED_COLLECTIONS_KEY = 'curated-map-collections'
const GLOBAL_MAP_INFO_KEY = 'global-map-info'

export default function MapsManager(props: {
  maps: { baseAssetsExist: boolean; worldBasemapExists: boolean; regionFiles: FileEntry[] }
}) {
  const queryClient = useQueryClient()
  const { openModal, closeAllModals } = useModals()
  const { addNotification } = useNotifications()
  const [downloading, setDownloading] = useState(false)
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null)

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
    }
    prevMapDownloadCountRef.current = activeMapDownloads.length
  }, [activeMapDownloads.length])

  const { data: globalMapInfo } = useQuery({
    queryKey: [GLOBAL_MAP_INFO_KEY],
    queryFn: () => api.getGlobalMapInfo(),
    refetchOnWindowFocus: false,
  })
  const globalMapAlreadyDownloaded = hasDownloadedGlobalMap(globalMapInfo?.key, props.maps.regionFiles)

  const setupWorldBasemap = useMutation({
    mutationFn: () => api.setupWorldBasemap(),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Mapa base baixado com sucesso.',
      })
      router.reload({ only: ['maps'] })
    },
    onError: () => {
      addNotification({
        type: 'error',
        message:
          'Não foi possível baixar o mapa base. Conecte este NOMAD à internet e tente novamente.',
      })
    },
  })

  const downloadGlobalMap = useMutation({
    mutationFn: () => api.downloadGlobalMap(),
    onSuccess: () => {
      invalidateDownloads()
      addNotification({
        type: 'success',
        message: 'O download do mapa global foi colocado na fila. Este é um arquivo grande (~125 GB) e pode levar bastante tempo.',
      })
      closeAllModals()
    },
    onError: (error) => {
      console.error('Error downloading global map:', error)
      addNotification({
        type: 'error',
        message: 'Falha ao iniciar o download do mapa global. Tente novamente.',
      })
    },
  })

  async function downloadBaseAssets() {
    try {
      setDownloading(true)

      const res = await api.downloadBaseMapAssets()
      if (!res) {
        throw new Error('Ocorreu um erro desconhecido ao baixar os recursos básicos do mapa.')
      }

      if (res.success) {
        addNotification({
          type: 'success',
          message: 'Recursos básicos do mapa baixados com sucesso.',
        })
        router.reload()
      }
    } catch (error) {
      console.error('Error downloading base assets:', error)
      addNotification({
        type: 'error',
        message: 'Ocorreu um erro ao baixar os recursos básicos do mapa. Tente novamente.',
      })
    } finally {
      setDownloading(false)
    }
  }

  async function downloadCollection(record: CollectionWithStatus) {
    try {
      await api.downloadMapCollection(record.slug)
      invalidateDownloads()
      addNotification({
        type: 'success',
        message: `O download da coleção "${record.name}" foi colocado na fila.`,
      })
    } catch (error) {
      console.error('Error downloading collection:', error)
    }
  }

  async function downloadCustomFile(url: string) {
    try {
      await api.downloadRemoteMapRegion(url)
      invalidateDownloads()
      addNotification({
        type: 'success',
        message: 'O download foi colocado na fila.',
      })
    } catch (error) {
      console.error('Error downloading custom file:', error)
    }
  }

  async function deleteFile(file: FileEntry) {
    if (file.type !== 'file') return

    try {
      setDeletingFileKey(file.key)
      await api.deleteMapRegionFile(file.name)
      addNotification({
        type: 'success',
        message: `${file.name} foi excluído.`,
      })
      closeAllModals()
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

  async function confirmDeleteFile(file: FileEntry) {
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
    const isCollection = 'resources' in record
    openModal(
      <StyledModal
        title="Confirmar Download?"
        onConfirm={() => {
          if (isCollection) {
            if (record.all_installed) {
              addNotification({
                message: `Todos os recursos da coleção "${record.name}" já foram baixados.`,
                type: 'info',
              })
              return
            }
            downloadCollection(record)
          }
          closeAllModals()
        }}
        onCancel={closeAllModals}
        open={true}
        confirmText="Baixar"
        cancelText="Cancelar"
        confirmVariant="primary"
      >
        <p className="text-text-secondary">
          Tem certeza de que deseja baixar <strong>{isCollection ? record.name : record}</strong>?
          Pode levar algum tempo até ficar disponível, dependendo do tamanho do arquivo e da sua
          conexão com a internet.
        </p>
      </StyledModal>,
      'confirm-download-file-modal'
    )
  }

  async function confirmGlobalMapDownload() {
    if (!globalMapInfo) return
    openModal(
      <StyledModal
        title="Baixar Mapa Global?"
        onConfirm={() => downloadGlobalMap.mutate()}
        onCancel={closeAllModals}
        open={true}
        confirmText="Baixar"
        cancelText="Cancelar"
        confirmVariant="primary"
        confirmLoading={downloadGlobalMap.isPending}
      >
        <p className="text-text-secondary">
          Isso baixará o mapa global completo do Protomaps ({formatBytes(globalMapInfo.size, 1)}, compilação {globalMapInfo.date}).
          Cobre o planeta inteiro, sem necessidade de arquivos de regiões individuais.
          Certifique-se de ter espaço em disco suficiente.
        </p>
      </StyledModal>,
      'confirm-global-map-download-modal'
    )
  }

  function openCountryPickerModal() {
    openModal(
      <CountryPickerModal
        onCancel={closeAllModals}
        installedFilenames={(props.maps.regionFiles ?? []).map((f) => f.name)}
        onDownloadStart={() => {
          invalidateDownloads()
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
        onCancel={() => closeAllModals()}
        onPreflightSuccess={async (url) => {
          await downloadCustomFile(url)
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
                loading: downloadGlobalMap.isPending,
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
          <StyledTable<FileEntry & { actions?: any }>
            className="font-semibold mt-4"
            rowLines={true}
            loading={false}
            compact
            columns={[
              { accessor: 'name', title: 'Nome' },
              {
                accessor: 'actions',
                title: 'Ações',
                render: (record) => (
                  <div className="flex space-x-2">
                    <StyledButton
                      variant="danger"
                      icon={'IconTrash'}
                      onClick={() => {
                        confirmDeleteFile(record)
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
