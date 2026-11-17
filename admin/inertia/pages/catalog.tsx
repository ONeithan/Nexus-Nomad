import { useState, useMemo } from 'react'
import { Head, Link } from '@inertiajs/react'
import {
  IconSearch,
  IconBook,
  IconExternalLink,
  IconBulb,
  IconTarget,
  IconCpu,
  IconListCheck,
  IconApps,
  IconCheck,
  IconArrowLeft,
} from '@tabler/icons-react'
import AppLayout from '~/layouts/AppLayout'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import {
  APP_CATALOG,
  AppCatalogEntry,
  searchAppCatalog,
} from '../../constants/app_catalog_data'

interface CatalogPageProps {
  installedServiceNames?: string[]
  initialAppId?: string | null
  initialCategory?: string
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'native', label: 'Nativos NOMAD' },
  { id: 'ai', label: 'IA & Agentes' },
  { id: 'home-family', label: 'Família & Casa' },
  { id: 'finance', label: 'Finanças' },
  { id: 'security', label: 'Segurança & VPN' },
  { id: 'networking', label: 'Redes & DNS' },
  { id: 'media', label: 'Mídia & Som' },
  { id: 'automation', label: 'Automação' },
  { id: 'workshop', label: 'Oficina & Hardware' },
  { id: 'communication', label: 'Comunicação' },
  { id: 'utility', label: 'Utilitários' },
  { id: 'education', label: 'Educação' },
  { id: 'productivity', label: 'Produtividade' },
]

export default function CatalogPage({
  installedServiceNames = [],
  initialAppId,
  initialCategory = 'all',
}: CatalogPageProps) {
  const installedSet = useMemo(() => new Set(installedServiceNames), [installedServiceNames])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedAppId, setSelectedAppId] = useState<string>(
    initialAppId || 'nomad_kiwix_server'
  )

  const filteredApps = useMemo(() => {
    return searchAppCatalog(searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory])

  const activeApp: AppCatalogEntry = useMemo(() => {
    const found = APP_CATALOG.find(
      (app) => app.id.toLowerCase() === selectedAppId.toLowerCase()
    )
    if (found) return found
    return filteredApps[0] || APP_CATALOG[0]
  }, [selectedAppId, filteredApps])

  return (
    <AppLayout>
      <Head title="Catálogo & Guia Operacional N.O.M.A.D." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Bar */}
        <div className="bg-surface-primary border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-desert-green/15 border border-desert-green/30 flex items-center justify-center text-desert-green">
              <IconApps size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold font-mono-mil tracking-wide uppercase text-text-primary">
                  Catálogo & Guia Operacional N.O.M.A.D.
                </h1>
                <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-desert-green/10 text-desert-green border border-desert-green/30 font-semibold">
                  {APP_CATALOG.length} Aplicações
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                Propósito operacional, arquitetura de funcionamento e exemplos práticos da vida real para cada aplicação do homelab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-secondary border border-border-subtle hover:border-desert-green text-text-primary text-xs font-semibold transition-colors"
            >
              <IconArrowLeft size={16} />
              <span>Centro de Comando</span>
            </Link>

            <a
              href="/docs/supply-depot-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-desert-green/15 border border-desert-green/30 hover:bg-desert-green/25 text-desert-green text-xs font-semibold transition-colors"
            >
              <IconBook size={16} />
              <span>Manual Offline</span>
              <IconExternalLink size={14} className="opacity-70" />
            </a>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface-primary border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
          <div className="relative">
            <IconSearch
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, finalidade, tecnologia, porta ou exemplo de uso (ex: 'fotos', 'finanças', 'RTX', '8520')..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-subtle focus:border-desert-green rounded-lg text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary px-2 py-1 bg-surface-primary rounded border border-border-subtle"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CATEGORY_TABS.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-desert-green text-white font-semibold shadow-sm'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80 border border-border-subtle/50'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="bg-surface-primary border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
          {/* Left Column: Apps List */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border-subtle overflow-y-auto bg-surface-secondary/20 divide-y divide-border-subtle/40">
            {filteredApps.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm space-y-2">
                <p>Nenhuma aplicação encontrada para essa pesquisa.</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="text-xs text-desert-green underline cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              filteredApps.map((app) => {
                const isSelected = activeApp && activeApp.id === app.id
                const isInstalled = installedSet.has(app.id)
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-desert-green/10 border-l-4 border-desert-green text-desert-green-darker'
                        : 'hover:bg-surface-secondary text-text-primary'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        isSelected
                          ? 'bg-desert-green text-white border-desert-green'
                          : 'bg-surface-secondary text-text-muted border-border-subtle'
                      }`}
                    >
                      <DynamicIcon
                        icon={(app.icon as DynamicIconName) || 'IconBrandDocker'}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-sm truncate text-text-primary">
                          {app.friendlyName}
                        </span>
                        {isInstalled && (
                          <span
                            className="w-2 h-2 rounded-full bg-desert-green flex-shrink-0"
                            title="Instalado"
                          />
                        )}
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                        {app.purpose}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted">
                        <span className="font-mono">Porta {app.port}</span>
                        <span>•</span>
                        <span className="uppercase">{app.category}</span>
                        {app.isNative && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500 font-semibold">NATIVO</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Column: Detailed View */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-surface-primary">
            {activeApp ? (
              <>
                {/* App Detail Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-desert-green/15 border border-desert-green/30 flex items-center justify-center text-desert-green shadow-sm">
                      <DynamicIcon
                        icon={
                          (activeApp.icon as DynamicIconName) || 'IconBrandDocker'
                        }
                        className="w-8 h-8"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-text-primary">
                          {activeApp.friendlyName}
                        </h2>
                        {activeApp.isNative ? (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                            Nativo N.O.M.A.D.
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">
                            Arsenal Docker
                          </span>
                        )}
                        {installedSet.has(activeApp.id) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-desert-green/15 text-desert-green border border-desert-green/30">
                            <IconCheck size={12} /> Instalado
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
                        <span className="font-mono text-text-secondary bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                          ID: {activeApp.id}
                        </span>
                        <span>•</span>
                        <span className="font-mono bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                          Porta TCP: {activeApp.port}
                        </span>
                        <span>•</span>
                        <span className="capitalize font-medium">
                          Categoria: {activeApp.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/docs/supply-depot-apps#${activeApp.docsAnchor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-secondary border border-border-subtle hover:border-desert-green hover:text-desert-green text-text-primary transition-colors"
                  >
                    <IconBook size={15} />
                    <span>Abrir no Manual</span>
                    <IconExternalLink size={13} className="opacity-70" />
                  </a>
                </div>

                {/* Section 1: Para que serve */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-desert-orange font-bold text-sm uppercase tracking-wider font-mono-mil">
                    <IconTarget size={18} />
                    <span>1. Para que serve este aplicativo</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm text-text-primary leading-relaxed">
                    {activeApp.purpose}
                  </div>
                </div>

                {/* Section 2: Principais Recursos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-desert-green font-bold text-sm uppercase tracking-wider font-mono-mil">
                    <IconListCheck size={18} />
                    <span>2. Principais recursos e o que ele faz</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeApp.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle text-xs text-text-secondary flex items-start gap-2"
                      >
                        <IconCheck size={16} className="text-desert-green flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 3: Como Funciona */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-500 font-bold text-sm uppercase tracking-wider font-mono-mil">
                    <IconCpu size={18} />
                    <span>3. Como funciona (Arquitetura e Fluxo de Dados)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {activeApp.howItWorks}
                  </div>
                </div>

                {/* Section 4: Exemplo Real de Uso */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider font-mono-mil">
                    <IconBulb size={18} />
                    <span>4. Exemplo Real de Uso (Cenário da Vida Prática)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    {activeApp.realWorldExample}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-text-muted">
                Selecione uma aplicação ao lado para ver todos os detalhes.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
