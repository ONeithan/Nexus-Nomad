import { useState } from 'react'
import { Link } from '@inertiajs/react'
import {
  IconDownload,
  IconChevronRight,
  IconChevronLeft,
  IconLoader2,
  IconCheck,
} from '@tabler/icons-react'
import useDownloads from '~/hooks/useDownloads'
import { extractFileName, formatBytes } from '~/lib/util'

/**
 * Painel lateral esquerdo compacto e expansível para monitorar
 * downloads ativos em qualquer tela do Nexus N.O.M.A.D.
 */
export default function LeftDownloadsDrawer() {
  const { data: downloads = [] } = useDownloads({})
  const [expanded, setExpanded] = useState(false)

  const activeList = downloads.filter((d) => d.status !== 'completed')
  const hasActive = activeList.length > 0
  const maxProgress = hasActive
    ? Math.max(...activeList.map((d) => Math.round(d.progress || 0)))
    : 0

  return (
    <div className="fixed left-3 top-24 z-40 flex items-start pointer-events-none">
      <div className="pointer-events-auto flex items-start gap-1.5">
        {/* Botão / Pílula fixa na lateral esquerda */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          title="Monitor de Downloads Ativos"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-md backdrop-blur-sm transition-all cursor-pointer ${
            hasActive
              ? 'bg-surface-primary/95 border-desert-orange text-text-primary hover:border-desert-orange-light'
              : 'bg-surface-primary/90 border-border-default text-text-secondary hover:text-text-primary hover:border-desert-green'
          }`}
        >
          {hasActive ? (
            <IconLoader2 size={16} className="text-desert-orange animate-spin shrink-0" />
          ) : (
            <IconDownload size={16} className="text-desert-green shrink-0" />
          )}
          <div className="text-left leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-wider">
              {hasActive ? `Downloads (${activeList.length})` : 'Downloads'}
            </div>
            <div className="text-[10px] text-text-muted font-mono">
              {hasActive ? `${maxProgress}% em curso` : 'Nenhum ativo'}
            </div>
          </div>
          {expanded ? <IconChevronLeft size={15} /> : <IconChevronRight size={15} />}
        </button>

        {/* Painel expansível com detalhes em tempo real */}
        {expanded && (
          <div className="nomad-modal-animate w-80 max-w-[82vw] max-h-[68vh] flex flex-col rounded-xl border border-border-default bg-surface-primary shadow-xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-border-subtle bg-surface-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconDownload size={16} className="text-desert-orange" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Downloads Ativos
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-primary border border-border-subtle text-text-secondary">
                {activeList.length}
              </span>
            </div>

            <div className="p-3 space-y-2.5 overflow-y-auto themed-scrollbar">
              {activeList.length === 0 ? (
                <div className="py-5 text-center space-y-1.5">
                  <IconCheck size={22} className="mx-auto text-desert-green opacity-80" />
                  <p className="text-xs font-medium text-text-secondary">
                    Nenhum download em andamento.
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Inicie downloads no Explorador ZIM, Mapas ou Modelos IA.
                  </p>
                </div>
              ) : (
                activeList.map((dl) => {
                  const pct = Math.min(100, Math.max(0, Math.round(dl.progress || 0)))
                  const name = extractFileName(dl.filename || dl.url)
                  const isFailed = dl.status === 'failed'
                  return (
                    <div
                      key={dl.jobId}
                      className="p-2.5 rounded-lg border border-border-subtle bg-surface-secondary space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="text-xs font-medium text-text-primary truncate"
                          title={name}
                        >
                          {name}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold shrink-0 ${
                            isFailed ? 'text-desert-red' : 'text-desert-orange'
                          }`}
                        >
                          {isFailed ? 'Erro' : `${pct}%`}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-surface-primary rounded-full overflow-hidden border border-border-subtle">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFailed ? 'bg-desert-red' : 'bg-desert-orange'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                        <span>
                          {dl.downloadedBytes ? formatBytes(dl.downloadedBytes) : '0 B'}
                          {dl.totalBytes ? ` / ${formatBytes(dl.totalBytes)}` : ''}
                        </span>
                        <span className="uppercase">
                          {dl.status === 'waiting' || dl.status === 'delayed'
                            ? 'Na fila'
                            : isFailed
                              ? 'Falhou'
                              : 'Baixando'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-3.5 py-2 border-t border-border-subtle bg-surface-secondary flex items-center justify-between text-[11px]">
              <Link
                href="/settings/zim/remote-explorer"
                onClick={() => setExpanded(false)}
                className="text-desert-orange hover:underline font-medium"
              >
                Explorador ZIM
              </Link>
              <Link
                href="/maps"
                onClick={() => setExpanded(false)}
                className="text-desert-green hover:underline font-medium"
              >
                Mapas Offline
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

