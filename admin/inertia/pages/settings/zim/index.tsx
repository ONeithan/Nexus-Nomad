import { Head, Link } from '@inertiajs/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import StyledTable from '~/components/StyledTable'
import SettingsLayout from '~/layouts/SettingsLayout'
import api from '~/lib/api'
import StyledButton from '~/components/StyledButton'
import { useModals } from '~/context/ModalContext'
import StyledModal from '~/components/StyledModal'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import Alert from '~/components/Alert'
import { useNotifications } from '~/context/NotificationContext'
import ZimUploader from '~/components/ZimUploader'
import { ListZimFilesResponse, ZimFileWithMetadata } from '../../../../types/zim'
import { SERVICE_NAMES } from '../../../../constants/service_names'
import { formatBytes } from '~/lib/util'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconDatabase,
  IconExternalLink,
  IconFolder,
  IconLink,
} from '@tabler/icons-react'

type SortKey = 'name' | 'size' | 'disk'
type SortDirection = 'asc' | 'desc'

export default function ZimPage() {
  const queryClient = useQueryClient()
  const { openModal, closeAllModals } = useModals()
  const { addNotification } = useNotifications()
  const { isInstalled } = useServiceInstalledStatus(SERVICE_NAMES.KIWIX)
  const [sortKey, setSortKey] = useState<SortKey>('size')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showUploader, setShowUploader] = useState(false)
  const { data: listResponse, isLoading } = useQuery<ListZimFilesResponse>({
    queryKey: ['zim-files'],
    queryFn: getFiles,
    refetchOnWindowFocus: false,
  })

  async function getFiles(): Promise<ListZimFilesResponse> {
    const res = await api.listZimFiles()
    return res?.data || { files: [] }
  }

  const data = Array.isArray(listResponse?.files) ? listResponse.files : []
  const storageInfo = listResponse?.storage

  const sortedData = useMemo(() => {
    if (!data.length) return []
    const copy = [...data]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'size') {
        const aSize = a.size_bytes ?? 0
        const bSize = b.size_bytes ?? 0
        cmp = aSize - bSize
      } else if (sortKey === 'disk') {
        const aDisk = (a.diskLabel || '').toLowerCase()
        const bDisk = (b.diskLabel || '').toLowerCase()
        cmp = aDisk.localeCompare(bDisk) || (a.title || a.name).localeCompare(b.title || b.name)
      } else {
        const aName = (a.title || a.name).toLowerCase()
        const bName = (b.title || b.name).toLowerCase()
        cmp = aName.localeCompare(bName)
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return copy
  }, [data, sortKey, sortDirection])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(key === 'size' ? 'desc' : 'asc')
    }
  }

  function renderSortHeader(label: string, key: SortKey) {
    const active = sortKey === key
    const Icon = !active ? IconArrowsSort : sortDirection === 'asc' ? IconArrowUp : IconArrowDown
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="flex items-center gap-1 font-semibold text-text-primary hover:text-desert-orange"
      >
        {label}
        <Icon className="size-4" />
      </button>
    )
  }

  async function confirmDeleteFile(file: ZimFileWithMetadata) {
    openModal(
      <StyledModal
        title="Confirmar Exclusão?"
        onConfirm={() => {
          deleteFileMutation.mutateAsync(file)
          closeAllModals()
        }}
        onCancel={closeAllModals}
        open={true}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
      >
        <p className="text-text-secondary">
          Tem certeza de que deseja excluir {file.name}? Esta ação não pode ser desfeita.
        </p>
      </StyledModal>,
      'confirm-delete-file-modal'
    )
  }

  const deleteFileMutation = useMutation({
    mutationFn: async (file: ZimFileWithMetadata) => api.deleteZimFile(file.name.replace('.zim', '')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zim-files'] })
    },
  })

  const rescanMutation = useMutation({
    mutationFn: async () => api.rescanZimLibrary(),
    onSuccess: (result) => {
      // catchInternal returns undefined on error (and shows its own error toast)
      if (!result) return
      queryClient.invalidateQueries({ queryKey: ['zim-files'] })
      addNotification({
        type: 'success',
        message:
          result.added > 0
            ? `${result.added} ${result.added === 1 ? 'novo livro encontrado' : 'novos livros encontrados'}. A biblioteca agora possui ${result.after}.`
            : `A biblioteca está atualizada (${result.after} ${result.after === 1 ? 'livro' : 'livros'}).`,
      })
    },
  })

  return (
    <SettingsLayout>
      <Head title="Gerenciador de Conteúdo ZIM | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-4xl font-semibold mb-2">Gerenciador de Conteúdo ZIM</h1>
              <p className="text-text-muted">
                Gerencie seus arquivos ZIM armazenados localmente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StyledButton
                variant="secondary"
                icon={showUploader ? 'IconX' : 'IconUpload'}
                onClick={() => setShowUploader((v) => !v)}
              >
                {showUploader ? 'Ocultar Envio' : 'Enviar Arquivo ZIM'}
              </StyledButton>
              {isInstalled && (
                <StyledButton
                  variant="secondary"
                  icon={'IconRefresh'}
                  loading={rescanMutation.isPending}
                  title="Reconstrói o índice da biblioteca do Kiwix a partir dos arquivos em disco. Use após adicionar arquivos ZIM manualmente fora do NOMAD."
                  onClick={() => rescanMutation.mutate()}
                >
                  Reescanear Biblioteca
                </StyledButton>
              )}
            </div>
          </div>

          {storageInfo && (
            <div className="mt-5 rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                    <IconDatabase className="size-4 text-desert-orange" />
                    Disco Ativo da Biblioteca ZIM:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      storageInfo.isPrimaryDisk
                        ? 'bg-surface-secondary text-text-primary border-border-default'
                        : 'bg-desert-green/15 text-desert-green border-desert-green/30'
                    }`}
                  >
                    {storageInfo.currentDiskLabel}
                  </span>
                  {storageInfo.isSymlink && !storageInfo.isPrimaryDisk && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-desert-orange/15 text-desert-orange border border-desert-orange/30">
                      <IconLink className="size-3.5" />
                      Link Ativo (HD Secundário)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1 font-mono break-all">
                    <IconFolder className="size-3.5 shrink-0 text-text-secondary" />
                    {storageInfo.realHostPath}
                  </span>
                  {storageInfo.disksSummary?.length > 0 && (
                    <span className="text-text-secondary">
                      •{' '}
                      {storageInfo.disksSummary
                        .map(
                          (d) =>
                            `${d.count} ${d.count === 1 ? 'arquivo' : 'arquivos'} (${formatBytes(d.totalBytes, 1)}) em ${d.diskLabel}`
                        )
                        .join(' | ')}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href="/settings/storage"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-default bg-surface-secondary hover:border-desert-orange hover:text-desert-orange text-xs font-semibold text-text-primary transition-colors"
              >
                <IconExternalLink className="size-4" />
                Alterar HD / Mover Pasta ZIM
              </Link>
            </div>
          )}

          {showUploader && (
            <div className="mt-6">
              <p className="text-text-muted text-sm mb-3">
                Envie um arquivo ZIM pelo navegador. Arquivos de até 20 GB são suportados. Para melhores resultados, envie a partir da mesma máquina ou por uma conexão de rede local (LAN) estável. Arquivos maiores devem ser copiados diretamente para o volume de armazenamento.
              </p>
              <ZimUploader
                existingFilenames={data?.map((f) => f.name) ?? []}
                onUploadComplete={(added) => {
                  queryClient.invalidateQueries({ queryKey: ['zim-files'] })
                  queryClient.invalidateQueries({ queryKey: ['wikipedia-state'] })
                  queryClient.invalidateQueries({ queryKey: ['curated-categories'] })
                  setShowUploader(false)
                  addNotification({
                    type: 'success',
                    message:
                      added > 0
                        ? `Envio concluído. ${added} ${added === 1 ? 'novo livro adicionado' : 'novos livros adicionados'} à biblioteca.`
                        : 'Envio concluído. A biblioteca está atualizada.',
                  })
                }}
              />
            </div>
          )}
          {!isInstalled && (
            <Alert
              title="O aplicativo Kiwix não está instalado. Instale-o para visualizar os arquivos ZIM baixados."
              type="warning"
              variant='solid'
              className="!mt-6"
            />
          )}
          <StyledTable<ZimFileWithMetadata & { actions?: any }>
            className="font-semibold mt-4"
            rowLines={true}
            loading={isLoading}
            compact
            columns={[
              {
                accessor: 'title',
                title: renderSortHeader('Título', 'name'),
                render: (record) => (
                  <span className="font-medium">
                    {record.title || record.name}
                  </span>
                ),
              },
              {
                accessor: 'summary',
                title: 'Resumo',
                render: (record) => (
                  <span className="text-text-secondary text-sm line-clamp-2">
                    {record.summary || '—'}
                  </span>
                ),
              },
              {
                accessor: 'size_bytes',
                title: renderSortHeader('Tamanho', 'size'),
                render: (record) => (
                  <span className="text-text-secondary tabular-nums whitespace-nowrap">
                    {record.size_bytes ? formatBytes(record.size_bytes, 1) : '—'}
                  </span>
                ),
              },
              {
                accessor: 'diskLabel',
                title: renderSortHeader('Armazenamento (HD)', 'disk'),
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
                          title="Este arquivo está na pasta /zim de outro HD que não é a biblioteca ativa atual do Kiwix."
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
                          ? 'Arquivo armazenado em outro HD fora da biblioteca ativa. Gerencie ou mova em Armazenamento & Samba.'
                          : 'Excluir arquivo ZIM da biblioteca ativa'
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
            data={sortedData}
          />
        </main>
      </div>
    </SettingsLayout>
  )
}
