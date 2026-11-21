import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconArrowForwardUp,
  IconCheck,
  IconDownload,
  IconFileAlert,
  IconFileText,
  IconFolder,
  IconHistory,
  IconInfoCircle,
  IconLoader2,
  IconMapRoute,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconShieldCheck,
  IconTrash,
  IconZoom,
} from '@tabler/icons-react'
import SettingsLayout from '~/layouts/SettingsLayout'
import ActiveDownloads from '~/components/ActiveDownloads'
import DownloadLogModal, { formatLogTimestamp } from '~/components/DownloadLogModal'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import useDownloads from '~/hooks/useDownloads'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '~/lib/api'
import { formatBytes } from '~/lib/util'
import { useNotifications } from '~/context/NotificationContext'
import type { DownloadAuditLogEntry, IncompleteDownloadItem } from '../../../types/downloads'

export default function SettingsDownloads() {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { data: downloads = [] } = useDownloads({})
  const activeCount = downloads.filter((d) => d.status !== 'failed').length
  const failedCount = downloads.filter((d) => d.status === 'failed').length

  const [activeTab, setActiveTab] = useState<'queue' | 'logs'>('queue')
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | 'recovery' | 'completed'>('all')
  const [logSearch, setLogSearch] = useState('')
  const [selectedAuditJob, setSelectedAuditJob] = useState<DownloadAuditLogEntry | null>(null)
  const [confirmClearLogs, setConfirmClearLogs] = useState(false)
  const [clearingLogs, setClearingLogs] = useState(false)

  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [clearingOrphaned, setClearingOrphaned] = useState(false)
  const [resumingAll, setResumingAll] = useState(false)
  const [cancellingAll, setCancellingAll] = useState(false)
  const [confirmCancelAll, setConfirmCancelAll] = useState(false)
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const {
    data: globalLogs = [],
    isFetching: isFetchingLogs,
    refetch: refetchLogs,
  } = useQuery<DownloadAuditLogEntry[]>({
    queryKey: ['download-global-logs', logFilter, logSearch],
    queryFn: () =>
      api.listGlobalDownloadLogs({
        limit: 250,
        filter: logFilter,
        search: logSearch,
      }),
    refetchInterval: activeTab === 'logs' ? 4000 : false,
  })

  const handleCancelAllQueue = async () => {
    setCancellingAll(true)
    setConfirmCancelAll(false)
    try {
      const pendingOrActive = downloads.filter((d) => d.status !== 'failed')
      for (const job of pendingOrActive) {
        await api.cancelDownloadJob(job.jobId).catch(() => {})
      }
      addNotification({
        message: `${pendingOrActive.length} download(s) da fila cancelado(s).`,
        type: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['download-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['download-global-logs'] })
    } finally {
      setCancellingAll(false)
    }
  }

  const handleResumeAll = async () => {
    setResumingAll(true)
    try {
      const res = await api.resumeAllDownloads()
      if (res?.success) {
        addNotification({
          message: res.message || `${res.resumedCount} download(s) validado(s) e enfileirado(s).`,
          type: 'success',
        })
      } else {
        addNotification({ message: 'Falha ao validar e retomar downloads.', type: 'error' })
      }
      queryClient.invalidateQueries({ queryKey: ['download-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['incomplete-downloads'] })
      queryClient.invalidateQueries({ queryKey: ['download-global-logs'] })
    } finally {
      setResumingAll(false)
    }
  }

  const handleClearGlobalLogs = async () => {
    setClearingLogs(true)
    setConfirmClearLogs(false)
    try {
      await api.clearDownloadLogs()
      addNotification({ message: 'Histórico geral de logs de downloads limpo.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['download-global-logs'] })
    } finally {
      setClearingLogs(false)
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
      <Head title="Downloads Ativos & Logs — Nexus N.O.M.A.D." />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8 max-w-7xl space-y-8 nomad-page-enter">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
                <IconDownload className="text-desert-orange" size={34} />
                <span>Gerenciador de Downloads &amp; Logs</span>
              </h1>
              <p className="text-text-secondary text-sm">
                Fila inteligente com tolerância a falhas (envio ao fim da fila, máx. 3 tentativas), auto-reparo de pastas e auditoria completa em PT-BR.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-default text-text-primary">
                Ativos/Fila: <strong className="text-desert-orange">{activeCount}</strong>
              </span>
              {failedCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 font-bold">
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

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 nomad-stagger-grid">
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
              <IconMapRoute size={22} className="text-desert-green-foreground shrink-0" />
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

          {/* Seletor Principal de Visualização */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-desert-green text-white border-desert-green shadow-sm'
                    : 'bg-surface-secondary text-text-secondary border-border-default hover:text-text-primary'
                }`}
              >
                <IconDownload size={16} />
                <span>Fila, Ativos &amp; Erros ({downloads.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-desert-orange text-white border-desert-orange shadow-sm'
                    : 'bg-surface-secondary text-text-secondary border-border-default hover:text-text-primary'
                }`}
              >
                <IconHistory size={16} />
                <span>Log Detalhado Geral (PT-BR)</span>
              </button>
            </div>
          </div>

          {activeTab === 'queue' ? (
            <>
              {/* Política da Fila Segura */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-text-secondary flex items-start gap-3">
                <IconShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold text-text-primary block">
                    Fila Resiliente Pós-Atualização &amp; Reenvio ao Fim da Fila (Máx. 3 Tentativas)
                  </span>
                  <p>
                    Downloads ativos não são cancelados ao atualizar o sistema. Se 1 item dentre 100 falhar (ex.: timeout ou DNS),
                    ele registra o motivo exato em português, repara links de pastas secundárias se necessário e vai para o{' '}
                    <strong>final da fila</strong> respeitando os itens na frente. Apenas após <strong>3 tentativas</strong> sem sucesso o item é cancelado com registro completo — clique em{' '}
                    <strong>&quot;Ver Log (PT-BR)&quot;</strong> em qualquer cartão para inspecionar tudo.
                  </p>
                </div>
              </div>

              {/* Seção 1: Fila e Downloads Ativos */}
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StyledSectionHeader title="Fila e Downloads em Curso" className="!mb-0" />
                  <div className="flex flex-wrap items-center gap-2">
                    {activeCount > 0 &&
                      (confirmCancelAll ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelAllQueue}
                            disabled={cancellingAll}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                          >
                            <IconTrash size={14} />
                            <span>Confirmar Cancelamento ({activeCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelAll(false)}
                            className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-xs text-text-secondary cursor-pointer"
                          >
                            Manter
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelAll(true)}
                          disabled={cancellingAll}
                          className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Cancelar todos os downloads ativos ou aguardando na fila"
                        >
                          <IconTrash size={14} />
                          <span>Limpar Fila ({activeCount})</span>
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={handleResumeAll}
                      disabled={resumingAll}
                      className="px-3.5 py-1.5 rounded-lg border border-emerald-500/45 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Validar erros acumulados, reparar links de pastas e reenfileirar ao final da fila"
                    >
                      {resumingAll ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconArrowForwardUp size={15} />
                      )}
                      <span>
                        {failedCount > 0
                          ? `Validar Erros (${failedCount}) e Enviar ao Fim da Fila`
                          : 'Retomar / Validar Fila'}
                      </span>
                    </button>
                  </div>
                </div>
                <ActiveDownloads withHeader={false} />
                {downloads.length === 0 && (
                  <div className="p-8 rounded-xl border border-dashed border-border-default bg-surface-secondary/40 text-center space-y-2">
                    <IconDownload size={28} className="mx-auto text-text-muted" />
                    <p className="text-sm font-medium text-text-primary">
                      Nenhum download ativo ou pendente no momento.
                    </p>
                    <p className="text-xs text-text-muted">
                      Consulte o <strong>Log Detalhado Geral (PT-BR)</strong> na aba ao lado para rever downloads passados ou inicie novos downloads em ZIM / Mapas.
                    </p>
                  </div>
                )}
              </section>

              {/* Seção 2: Arquivos Temporários & Incompletos em Disco (.tmp) */}
              <section className="space-y-4 pt-4 border-t border-border-default/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <StyledSectionHeader
                      title="Arquivos Incompletos &amp; Temporários em Disco (.tmp)"
                      className="!mb-0"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Arquivos parciais gravados no disco. Downloads ativos ou na fila continuam de onde pararam sem perder dados.
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

                    {orphanedFiles.length > 0 &&
                      (confirmClearAll ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleClearOrphaned}
                            disabled={clearingOrphaned}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {clearingOrphaned ? (
                              <IconLoader2 size={14} className="animate-spin" />
                            ) : (
                              <IconTrash size={14} />
                            )}
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
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Excluir apenas arquivos temporários órfãos que não pertencem a downloads da fila"
                        >
                          <IconTrash size={14} />
                          <span>Limpar Órfãos ({formatBytes(orphanedBytes, 1)})</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Banner explicativo sobre velocidade */}
                <div className="p-3.5 rounded-xl border border-desert-tan/30 bg-desert-tan/5 text-xs text-text-secondary flex items-start gap-3">
                  <IconInfoCircle size={18} className="text-desert-tan shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-text-primary block">
                      Por que os downloads de acervos Kiwix / ZIM baixam a ~300 - 600 KB/s?
                    </span>
                    <p>
                      Os espelhos mundiais da Kiwix/openZIM limitam a banda por conexão. O N.O.M.A.D. processa até 3 downloads paralelos com margem de timeout estendida (120s). Se a conexão oscilar ou o servidor reiniciar, o download retoma automaticamente do byte gravado no arquivo temporário.
                    </p>
                  </div>
                </div>

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
                                  ? 'text-emerald-400 shrink-0'
                                  : f.status === 'queued'
                                    ? 'text-desert-tan shrink-0'
                                    : 'text-desert-orange shrink-0'
                              }
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary truncate">
                                  {f.name}
                                </span>
                                <span className="text-[0.625rem] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted border border-border-default shrink-0">
                                  {f.category}
                                </span>
                                {f.diskLabel && (
                                  <span
                                    className={`text-[0.625rem] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                                      f.diskPath &&
                                      (f.diskPath.startsWith('/mnt') ||
                                        f.diskPath.startsWith('/media') ||
                                        f.diskPath.startsWith('/run/media'))
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-semibold'
                                        : 'bg-surface-secondary text-text-secondary border-border-default'
                                    }`}
                                    title={`Gravado em: ${f.realPath || f.tempPath}`}
                                  >
                                    HD: {f.diskLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-muted truncate font-mono mt-0.5">
                                {f.realPath || f.tempPath}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-mono font-bold text-text-primary">
                                {formatBytes(f.sizeBytes, 1)}
                              </div>
                              <div className="text-[0.625rem] text-text-muted">no disco</div>
                            </div>

                            <div>
                              {f.status === 'active' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  Órfão / Incompleto
                                </span>
                              )}
                            </div>

                            {f.status === 'orphaned' && (
                              <div>
                                {isConfirming ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteIncomplete(f.tempPath)}
                                      disabled={isDeleting}
                                      className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold hover:opacity-90 transition-colors cursor-pointer"
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
                                    className="p-1.5 rounded-lg border border-border-default hover:border-red-500/50 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
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
                    <p className="text-[0.6875rem] text-text-muted">
                      O armazenamento está limpo e sem sobras de downloads interrompidos.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : (
            /* ABA 2: LOG DETALHADO GERAL (TUDO EM PT-BR) */
            <section className="space-y-4 nomad-animate-in">
              <div className="p-4 rounded-xl border border-border-default bg-surface-primary space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {[
                      { id: 'all', label: 'Todos os Eventos' },
                      { id: 'errors', label: 'Erros, Desvios & Cancelamentos' },
                      { id: 'recovery', label: 'Recuperação Pós-Update & Reparos' },
                      { id: 'completed', label: 'Concluídos' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLogFilter(opt.id as typeof logFilter)}
                        className={`px-3 py-1.5 rounded-md font-semibold border transition-colors cursor-pointer ${
                          logFilter === opt.id
                            ? 'bg-desert-orange text-white border-desert-orange'
                            : 'bg-surface-secondary text-text-secondary border-border-subtle hover:text-text-primary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void refetchLogs()}
                      className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-xs font-semibold text-text-primary hover:border-desert-orange inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <IconRefresh size={14} className={isFetchingLogs ? 'animate-spin text-desert-orange' : ''} />
                      <span>Atualizar</span>
                    </button>

                    {confirmClearLogs ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleClearGlobalLogs}
                          disabled={clearingLogs}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {clearingLogs ? 'Limpando...' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearLogs(false)}
                          className="px-2 py-1.5 rounded-lg bg-surface-secondary text-xs text-text-muted cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearLogs(true)}
                        className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-xs text-text-secondary hover:text-red-400 hover:border-red-500/40 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <IconTrash size={14} />
                        <span>Limpar Histórico</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <IconSearch
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Buscar no histórico por nome, arquivo (ex: 20261118.pmtiles), erro ou motivo em PT-BR..."
                    className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border-default focus:border-desert-orange rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
              </div>

              {globalLogs.length === 0 ? (
                <div className="p-10 rounded-xl border border-dashed border-border-default bg-surface-primary text-center space-y-2">
                  <IconHistory size={30} className="mx-auto text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">
                    Nenhum registro encontrado neste filtro.
                  </p>
                  <p className="text-xs text-text-muted">
                    Todos os novos downloads, reparos de pastas e desvios para o final da fila ficarão auditados aqui em português.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {globalLogs.map((entry) => {
                    const isError =
                      entry.eventType === 'failed_attempt' ||
                      entry.eventType === 'cancelled_max_retries' ||
                      entry.eventType === 'cancelled_user'
                    const isSuccess = entry.eventType === 'completed'
                    const isWarning =
                      entry.eventType === 'requeued_tail' ||
                      entry.eventType === 'boot_recovery' ||
                      entry.eventType === 'retried_manual' ||
                      entry.eventType === 'directory_repaired'

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border bg-surface-primary space-y-1.5 nomad-interactive-card ${
                          isError
                            ? 'border-red-500/35'
                            : isWarning
                              ? 'border-amber-500/35'
                              : isSuccess
                                ? 'border-emerald-500/35'
                                : 'border-border-subtle'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            {isError ? (
                              <IconAlertTriangle size={15} className="text-red-400 shrink-0" />
                            ) : isSuccess ? (
                              <IconCheck size={15} className="text-emerald-400 shrink-0" />
                            ) : (
                              <IconArrowForwardUp size={15} className="text-amber-400 shrink-0" />
                            )}
                            <span className="text-sm font-bold text-text-primary truncate">
                              {entry.title || entry.jobId}
                            </span>
                            <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-secondary">
                              Tentativa {entry.attempt}/{entry.maxAttempts}
                            </span>
                            {entry.errorCode && (
                              <span className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400">
                                {entry.errorCode}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[0.6875rem] font-mono text-text-muted">
                              {formatLogTimestamp(entry.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedAuditJob(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border-default bg-surface-secondary hover:border-desert-orange text-[0.7rem] font-semibold text-text-primary hover:text-desert-orange cursor-pointer"
                            >
                              <IconFileText size={13} />
                              <span>Ver Log Individual</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-medium text-text-primary leading-relaxed">
                          {entry.summaryPt}
                        </p>
                        {entry.detailsPt && (
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {entry.detailsPt}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Modal para inspecionar linha do tempo completa de qualquer item clicado no Log Geral */}
      <DownloadLogModal
        isOpen={Boolean(selectedAuditJob)}
        onClose={() => setSelectedAuditJob(null)}
        download={
          selectedAuditJob
            ? {
                jobId: selectedAuditJob.jobId,
                url: selectedAuditJob.url || '',
                filepath: selectedAuditJob.filepath || '',
                title: selectedAuditJob.title,
                filetype: selectedAuditJob.filetype || 'download',
                attempt: selectedAuditJob.attempt,
                maxAttempts: selectedAuditJob.maxAttempts,
              }
            : null
        }
      />
    </SettingsLayout>
  )
}
