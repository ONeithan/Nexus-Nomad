import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import {
  IconDownload,
  IconFolder,
  IconMapRoute,
  IconRobot,
  IconZoom,
  IconTrash,
  IconFileAlert,
  IconRefresh,
  IconLoader2,
  IconInfoCircle,
} from '@tabler/icons-react'
import SettingsLayout from '~/layouts/SettingsLayout'
import ActiveDownloads from '~/components/ActiveDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import useDownloads from '~/hooks/useDownloads'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '~/lib/api'
import { formatBytes } from '~/lib/util'
import { useNotifications } from '~/context/NotificationContext'
import type { IncompleteDownloadItem } from '../../../types/downloads'

export default function SettingsDownloads() {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { data: downloads = [] } = useDownloads({})
  const activeCount = downloads.filter((d) => d.status !== 'failed').length
  const failedCount = downloads.filter((d) => d.status === 'failed').length

  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [clearingOrphaned, setClearingOrphaned] = useState(false)
  const [resumingAll, setResumingAll] = useState(false)
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const handleResumeAll = async () => {
    setResumingAll(true)
    try {
      const res = await api.resumeAllDownloads()
      if (res?.success) {
        addNotification({
          message: res.message || `${res.resumedCount} download(s) retomado(s) com sucesso.`,
          type: 'success',
        })
      } else {
        addNotification({ message: 'Falha ao retomar downloads.', type: 'error' })
      }
      queryClient.invalidateQueries({ queryKey: ['download-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['incomplete-downloads'] })
    } finally {
      setResumingAll(false)
    }
  }

  const { data: incompleteData, isFetching: isFetchingIncomplete, refetch: refetchIncomplete } = useQuery({
    queryKey: ['incomplete-downloads'],
    queryFn: () => api.listIncompleteDownloads(),
    refetchInterval: 5000,
  })

  const incompleteFiles = incompleteData?.files || []
  const totalIncompleteBytes = incompleteData?.totalBytes || 0
  const orphanedFiles = incompleteFiles.filter((f) => f.status === 'orphaned')
  const orphanedBytes = orphanedFiles.reduce((acc, f) => acc + f.sizeBytes, 0)

  const handleDeleteIncomplete = async (tempPath: string) => {
    setDeletingPath(tempPath)
    setConfirmDeletePath(null)
    try {
      const res = await api.deleteIncompleteDownload(tempPath)
      if (res?.success) {
        addNotification({ message: 'Arquivo parcial excluído com sucesso.', type: 'success' })
      } else {
        addNotification({ message: res?.message || 'Falha ao excluir arquivo parcial.', type: 'error' })
      }
      queryClient.invalidateQueries({ queryKey: ['incomplete-downloads'] })
    } finally {
      setDeletingPath(null)
    }
  }

  const handleClearOrphaned = async () => {
    setClearingOrphaned(true)
    setConfirmClearAll(false)
    try {
      const res = await api.clearOrphanedIncompleteDownloads()
      if (res?.success) {
        addNotification({
          message: `${res.count} arquivo(s) temporário(s) órfão(s) excluído(s) (${formatBytes(res.freedBytes)} liberados).`,
          type: 'success',
        })
      } else {
        addNotification({ message: res?.message || 'Falha ao limpar arquivos órfãos.', type: 'error' })
      }
      queryClient.invalidateQueries({ queryKey: ['incomplete-downloads'] })
    } finally {
      setClearingOrphaned(false)
    }
  }

  return (
    <SettingsLayout>
      <Head title="Downloads Ativos — Nexus N.O.M.A.D." />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8 max-w-7xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
                <IconDownload className="text-desert-orange" size={34} />
                <span>Gerenciador de Downloads</span>
              </h1>
              <p className="text-text-secondary">
                Acompanhe downloads em andamento, fila de pacotes ZIM, mapas offline e modelos de IA.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-default text-text-primary">
                Ativos/Fila: <strong className="text-desert-orange">{activeCount}</strong>
              </span>
              {failedCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-desert-red/10 border border-desert-red/40 text-desert-red font-bold">
                  Falhos: {failedCount}
                </span>
              )}
              {totalIncompleteBytes > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-desert-tan/10 border border-desert-tan/40 text-desert-tan font-bold">
                  Parciais: {formatBytes(totalIncompleteBytes, 1)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/settings/zim/remote-explorer"
              className="nomad-interactive-card p-3.5 rounded-xl border border-border-default bg-surface-primary flex items-center gap-3 hover:border-desert-orange"
            >
              <IconZoom size={22} className="text-desert-orange shrink-0" />
              <div>
                <div className="text-sm font-bold text-text-primary">Catálogo ZIM / Kiwix</div>
                <div className="text-xs text-text-muted">Wikipédia e acervos</div>
              </div>
            </Link>
            <Link
              href="/settings/maps"
              className="nomad-interactive-card p-3.5 rounded-xl border border-border-default bg-surface-primary flex items-center gap-3 hover:border-desert-green"
            >
              <IconMapRoute size={22} className="text-desert-green shrink-0" />
              <div>
                <div className="text-sm font-bold text-text-primary">Mapas Offline</div>
                <div className="text-xs text-text-muted">Regiões e países</div>
              </div>
            </Link>
            <Link
              href="/settings/models"
              className="nomad-interactive-card p-3.5 rounded-xl border border-border-default bg-surface-primary flex items-center gap-3 hover:border-desert-tan"
            >
              <IconRobot size={22} className="text-desert-tan shrink-0" />
              <div>
                <div className="text-sm font-bold text-text-primary">Modelos de IA</div>
                <div className="text-xs text-text-muted">Ollama GGUF / RAG</div>
              </div>
            </Link>
            <Link
              href="/settings/storage"
              className="nomad-interactive-card p-3.5 rounded-xl border border-border-default bg-surface-primary flex items-center gap-3 hover:border-desert-olive"
            >
              <IconFolder size={22} className="text-desert-olive shrink-0" />
              <div>
                <div className="text-sm font-bold text-text-primary">Armazenamento &amp; Discos</div>
                <div className="text-xs text-text-muted">Mover arquivos entre HDs</div>
              </div>
            </Link>
          </div>

          {/* Seção 1: Fila e Downloads Ativos */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StyledSectionHeader title="Fila e Downloads em Curso" className="!mb-0" />
              <button
                type="button"
                onClick={handleResumeAll}
                disabled={resumingAll}
                className="px-3 py-1.5 rounded-lg border border-desert-green/40 bg-desert-green/10 text-desert-green hover:bg-desert-green/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Retomar downloads travados ou interrompidos por atualização"
              >
                {resumingAll ? <IconLoader2 size={14} className="animate-spin" /> : <IconRefresh size={14} />}
                <span>Retomar Downloads Interrompidos</span>
              </button>
            </div>
            <ActiveDownloads withHeader={false} />
            {downloads.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-border-default bg-surface-secondary/40 text-center space-y-2">
                <IconDownload size={28} className="mx-auto text-text-muted" />
                <p className="text-sm font-medium text-text-primary">
                  Nenhum download ativo ou pendente no momento.
                </p>
                <p className="text-xs text-text-muted">
                  Se algum download travou após reinicialização, verifique os arquivos temporários abaixo ou em{' '}
                  <Link href="/settings/storage" className="text-desert-orange underline">
                    Armazenamento &amp; Samba
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>

          {/* Seção 2: Arquivos Temporários & Incompletos em Disco (.tmp) */}
          <section className="space-y-4 pt-4 border-t border-border-default/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <StyledSectionHeader title="Arquivos Incompletos &amp; Temporários em Disco (.tmp)" className="!mb-0" />
                <p className="text-xs text-text-muted mt-1">
                  Arquivos parciais gravados no disco. Downloads ativos ou na fila continuam de onde pararam (resumable) sem perder dados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refetchIncomplete()}
                  disabled={isFetchingIncomplete}
                  className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Atualizar lista de arquivos parciais no disco"
                >
                  <IconRefresh size={14} className={isFetchingIncomplete ? 'animate-spin' : ''} />
                  <span>Verificar Disco</span>
                </button>

                {orphanedFiles.length > 0 && (
                  <>
                    {confirmClearAll ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleClearOrphaned}
                          disabled={clearingOrphaned}
                          className="px-3 py-1.5 rounded-lg bg-desert-red text-white text-xs font-bold hover:bg-desert-red-dark transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {clearingOrphaned ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} />}
                          <span>Confirmar Limpeza ({formatBytes(orphanedBytes, 1)})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-secondary text-text-muted hover:text-text-primary text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(true)}
                        className="px-3 py-1.5 rounded-lg bg-desert-red/10 border border-desert-red/30 text-desert-red hover:bg-desert-red/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Excluir apenas arquivos temporários órfãos que não pertencem a downloads da fila"
                      >
                        <IconTrash size={14} />
                        <span>Limpar Órfãos ({formatBytes(orphanedBytes, 1)})</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Banner explicativo sobre velocidade e retomada */}
            <div className="p-3.5 rounded-xl border border-desert-tan/30 bg-desert-tan/5 text-xs text-text-secondary flex items-start gap-3">
              <IconInfoCircle size={18} className="text-desert-tan shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-text-primary block">
                  Por que os downloads de acervos Kiwix / ZIM baixam a ~300 - 600 KB/s?
                </span>
                <p>
                  Os espelhos mundiais da Kiwix/openZIM limitam a banda por conexão para atender voluntariamente usuários no mundo todo.
                  O N.O.M.A.D. processa até 3 downloads paralelos. Se a conexão oscilar ou o sistema reiniciar, o download <strong>não é perdido</strong>:
                  ele retoma automaticamente a partir do byte gravado no arquivo temporário.
                </p>
              </div>
            </div>

            {/* Listagem de arquivos incompletos */}
            {incompleteFiles.length > 0 ? (
              <div className="space-y-2">
                {incompleteFiles.map((f: IncompleteDownloadItem) => {
                  const isDeleting = deletingPath === f.tempPath
                  const isConfirming = confirmDeletePath === f.tempPath

                  return (
                    <div
                      key={f.tempPath}
                      className="p-3.5 rounded-xl border border-border-default bg-surface-primary flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <IconFileAlert
                          size={22}
                          className={
                            f.status === 'active'
                              ? 'text-desert-green shrink-0'
                              : f.status === 'queued'
                                ? 'text-desert-tan shrink-0'
                                : 'text-desert-orange shrink-0'
                          }
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {f.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-default shrink-0">
                              {f.category}
                            </span>
                          </div>
                          <div className="text-xs text-text-muted truncate font-mono mt-0.5">
                            {f.tempPath}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Tamanho gravado no disco */}
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-text-primary">
                            {formatBytes(f.sizeBytes, 1)}
                          </div>
                          <div className="text-[10px] text-text-muted">no disco</div>
                        </div>

                        {/* Status */}
                        <div>
                          {f.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-desert-green/10 text-desert-green border border-desert-green/30 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-desert-green animate-pulse" />
                              Baixando agora
                            </span>
                          )}
                          {f.status === 'queued' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-desert-tan/10 text-desert-tan border border-desert-tan/30 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-desert-tan" />
                              Na fila (Retomável)
                            </span>
                          )}
                          {f.status === 'orphaned' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-desert-red/10 text-desert-red border border-desert-red/30 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-desert-red" />
                              Órfão / Incompleto
                            </span>
                          )}
                        </div>

                        {/* Ação de exclusão (apenas se órfão ou se usuário confirmar) */}
                        {f.status === 'orphaned' && (
                          <div>
                            {isConfirming ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIncomplete(f.tempPath)}
                                  disabled={isDeleting}
                                  className="px-2 py-1 rounded bg-desert-red text-white text-xs font-bold hover:bg-desert-red-dark transition-colors cursor-pointer"
                                >
                                  {isDeleting ? <IconLoader2 size={12} className="animate-spin" /> : 'Excluir'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePath(null)}
                                  className="px-2 py-1 rounded bg-surface-secondary text-text-muted hover:text-text-primary text-xs cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePath(f.tempPath)}
                                className="p-1.5 rounded-lg border border-border-default hover:border-desert-red/50 hover:bg-desert-red/10 text-text-muted hover:text-desert-red transition-colors cursor-pointer"
                                title="Excluir arquivo temporário e liberar espaço"
                              >
                                <IconTrash size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border-default bg-surface-secondary/20 text-center space-y-1">
                <p className="text-xs font-medium text-text-primary">
                  Nenhum arquivo temporário ou incompleto detectado no disco.
                </p>
                <p className="text-[11px] text-text-muted">
                  O armazenamento está limpo e sem sobras de downloads interrompidos.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </SettingsLayout>
  )
}

