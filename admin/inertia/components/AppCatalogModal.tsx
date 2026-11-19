import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Link } from '@inertiajs/react'
import {
  IconSearch,
  IconBook,
  IconExternalLink,
  IconX,
  IconBulb,
  IconTarget,
  IconCpu,
  IconListCheck,
  IconApps,
  IconCheck,
  IconMaximize,
  IconMinimize,
} from '@tabler/icons-react'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import AppCredentialsCard from '~/components/AppCredentialsCard'
import {
  APP_CATALOG,
  AppCatalogEntry,
  searchAppCatalog,
} from '../../constants/app_catalog_data'

interface AppCatalogModalProps {
  isOpen: boolean
  onClose: () => void
  initialAppId?: string | null
  installedServiceNames?: Set<string>
  onOpenApp?: (appId: string) => void
  onInstallApp?: (appId: string) => void
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

export default function AppCatalogModal({
  isOpen,
  onClose,
  initialAppId,
  installedServiceNames = new Set(),
}: AppCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAppId, setSelectedAppId] = useState<string>(
    initialAppId || 'nomad_kiwix_server'
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [singleAppMode, setSingleAppMode] = useState(Boolean(initialAppId))

  // Sync selectedAppId & singleAppMode when modal opens or initialAppId changes
  useEffect(() => {
    if (isOpen) {
      setSingleAppMode(Boolean(initialAppId))
      if (initialAppId) {
        setSelectedAppId(initialAppId)
        setSearchQuery('')
      }
    }
  }, [isOpen, initialAppId])

  // Filtered catalog list
  const filteredApps = useMemo(() => {
    return searchAppCatalog(searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory])

  // Active selected app entry
  const activeApp: AppCatalogEntry = useMemo(() => {
    const found = APP_CATALOG.find(
      (app) => app.id.toLowerCase() === selectedAppId.toLowerCase()
    )
    if (found) return found
    return filteredApps[0] || APP_CATALOG[0]
  }, [selectedAppId, filteredApps])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div
        className={`fixed inset-0 flex items-center justify-center transition-all ${
          isFullscreen ? 'p-0 overflow-hidden' : 'p-3 sm:p-6 overflow-y-auto'
        }`}
      >
        <DialogPanel
          transition
          className={`relative bg-surface-primary flex flex-col overflow-hidden transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in ${
            isFullscreen
              ? 'w-screen h-screen max-w-none max-h-none rounded-none border-none z-50'
              : 'rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] max-h-[900px] border border-border-subtle'
          }`}
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary/70 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-desert-green/15 border border-desert-green/30 flex items-center justify-center text-desert-green">
                <IconApps size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-mono-mil tracking-wide uppercase text-text-primary">
                    {singleAppMode && activeApp
                      ? `Guia Operacional — ${activeApp.friendlyName}`
                      : 'Catálogo & Guia Operacional N.O.M.A.D.'}
                  </h2>
                  {!singleAppMode && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-desert-green/10 text-desert-green border border-desert-green/30 font-semibold">
                      {APP_CATALOG.length} Aplicações
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {singleAppMode
                    ? 'Manual individual com login/senha padrão, finalidade, recursos e exemplo prático de uso.'
                    : 'Propósito operacional, arquitetura de funcionamento e exemplos práticos da vida real para cada aplicação.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {singleAppMode ? (
                <button
                  type="button"
                  onClick={() => setSingleAppMode(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-desert-green/15 border border-desert-green/30 hover:bg-desert-green/25 text-desert-green transition-colors cursor-pointer"
                >
                  <IconApps size={14} />
                  <span>Ver Catálogo Completo ({APP_CATALOG.length} Apps)</span>
                </button>
              ) : (
                <Link
                  href={`/catalog?app=${activeApp?.id || ''}&category=${selectedCategory}`}
                  onClick={onClose}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-secondary border border-border-subtle hover:border-desert-green hover:text-desert-green text-text-primary transition-colors"
                  title="Abrir como Página Completa Dedicada"
                >
                  <span>Ver como Página</span>
                  <IconExternalLink size={14} className="opacity-70" />
                </Link>
              )}

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title={isFullscreen ? 'Modo Janela' : 'Modo Tela Inteira / Página'}
              >
                {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Fechar Catálogo"
              >
                <IconX size={20} />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar (hidden in individual app mode) */}
          {!singleAppMode && (
          <div className="p-4 border-b border-border-subtle bg-surface-primary space-y-3">
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
                autoFocus
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
          )}

          {/* Content Body: Two Columns (or focused single column when singleAppMode is active) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Column: Apps List */}
            {!singleAppMode && (
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border-subtle overflow-y-auto bg-surface-secondary/30 divide-y divide-border-subtle/40">
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
                  const isInstalled = installedServiceNames.has(app.id)
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
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
                        <div className="flex items-center gap-2 mt-1.5 text-[0.625rem] text-text-muted">
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
            )}

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
                          <h3 className="text-xl font-bold text-text-primary">
                            {activeApp.friendlyName}
                          </h3>
                          {activeApp.isNative ? (
                            <span className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                              Nativo N.O.M.A.D.
                            </span>
                          ) : (
                            <span className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">
                              Arsenal Docker
                            </span>
                          )}
                          {installedServiceNames.has(activeApp.id) && (
                            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-desert-green/15 text-desert-green border border-desert-green/30">
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
                      <span>Abrir Manual Individual</span>
                      <IconExternalLink size={13} className="opacity-70" />
                    </a>
                  </div>

                  {/* Credentials Card: Login & Senha Padrão */}
                  <AppCredentialsCard appId={activeApp.id} />

                  {/* Section 1: Para que serve */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-desert-orange font-bold text-sm uppercase tracking-wider font-mono-mil">
                      <IconTarget size={18} />
                      <span>1. Para que serve este aplicativo</span>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm text-text-primary leading-relaxed font-sans">
                      {activeApp.purpose}
                    </div>
                  </div>

                  {/* Section 2: O que ele faz */}
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

                  {/* Section 3: Como funciona */}
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

          {/* Footer info bar */}
          <div className="px-6 py-3 border-t border-border-subtle bg-surface-secondary/70 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <span>
              {singleAppMode && activeApp ? (
                <>
                  Visualizando guia individual de <strong>{activeApp.friendlyName}</strong> (
                  <button
                    type="button"
                    onClick={() => setSingleAppMode(false)}
                    className="text-desert-green hover:underline font-semibold cursor-pointer"
                  >
                    Ver todos os {APP_CATALOG.length} aplicativos
                  </button>
                  )
                </>
              ) : (
                <>
                  Exibindo <strong>{filteredApps.length}</strong> de{' '}
                  <strong>{APP_CATALOG.length}</strong> aplicações homologadas.
                </>
              )}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={`/catalog?app=${activeApp?.id || ''}&category=${selectedCategory}`}
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium"
              >
                <IconExternalLink size={13} />
                Abrir Página Completa
              </Link>
              <span>•</span>
              <a
                href={`/docs/supply-depot-apps#${activeApp?.docsAnchor || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-desert-green hover:underline flex items-center gap-1 font-semibold"
              >
                <IconBook size={14} />
                Manual Individual Offline
              </a>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
