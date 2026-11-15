import { Head, Link } from '@inertiajs/react'
import { IconDownload, IconFolder, IconMapRoute, IconRobot, IconZoom } from '@tabler/icons-react'
import SettingsLayout from '~/layouts/SettingsLayout'
import ActiveDownloads from '~/components/ActiveDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import useDownloads from '~/hooks/useDownloads'

export default function SettingsDownloads() {
  const { data: downloads = [] } = useDownloads({})
  const activeCount = downloads.filter((d) => d.status !== 'completed' && d.status !== 'failed').length
  const failedCount = downloads.filter((d) => d.status === 'failed').length

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

          <section className="space-y-4">
            <StyledSectionHeader title="Fila e Downloads em Curso" />
            <ActiveDownloads withHeader={false} />
            {downloads.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-border-default bg-surface-secondary/40 text-center space-y-2">
                <IconDownload size={28} className="mx-auto text-text-muted" />
                <p className="text-sm font-medium text-text-primary">
                  Nenhum download ativo ou pendente no momento.
                </p>
                <p className="text-xs text-text-muted">
                  Se algum download travou após reinicialização, verifique os arquivos em{' '}
                  <Link href="/settings/storage" className="text-desert-orange underline">
                    Armazenamento &amp; Samba
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </SettingsLayout>
  )
}

