import { Head, Link, router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import {
  IconApps,
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconFileText,
  IconHome,
  IconKey,
  IconLockOpen,
  IconSearch,
  IconUserPlus,
} from '@tabler/icons-react'
import MarkdocRenderer from '~/components/MarkdocRenderer'
import DocsLayout from '~/layouts/DocsLayout'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import AppCredentialsCard from '~/components/AppCredentialsCard'
import {
  APP_CATALOG,
  getAppDefaultCredentials,
  type AppCatalogEntry,
} from '../../../constants/app_catalog_data'

const KOLIBRI_EXTRA_ENTRY: AppCatalogEntry = {
  id: 'nomad_kolibri_2',
  friendlyName: 'Plataforma Educacional (Kolibri)',
  category: 'education',
  secondaryCategories: [],
  port: '8310',
  icon: 'IconSchool',
  isNative: true,
  purpose:
    'Escola interativa offline completa com cursos em vídeo, Khan Academy em português, exercícios gamificados e trilhas de estudo sem necessidade de internet.',
  features: [
    'Canais educacionais completos em vídeo e HTML5 interativo (Khan Academy, PhET, StoryWeaver)',
    'Acompanhamento de progresso de alunos, turmas e famílias totalmente offline',
    'Servidor dedicado de conteúdo interativo na porta 8311 para exercícios HTML5/SCORM',
    'Suporte a importação de canais via rede local ou arquivos exportados',
  ],
  howItWorks:
    'Executa a plataforma Learning Equality Kolibri 0.19+ com banco local em /kolibri, servindo a interface web na porta 8310 e exercícios interativos isolados na porta 8311.',
  realWorldExample:
    'Em uma propriedade rural ou durante falta prolongada de internet, crianças e adultos acompanham aulas de matemática, ciências e programação em Português pelo Wi-Fi local.',
  docsAnchor: 'nomad-kolibri-2',
}

const ALL_APP_DOCS: AppCatalogEntry[] = [...APP_CATALOG, KOLIBRI_EXTRA_ENTRY]

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

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'IA & Agentes',
  'home-family': 'Família & Casa',
  finance: 'Finanças',
  security: 'Segurança & VPN',
  networking: 'Redes & DNS',
  media: 'Mídia & Som',
  automation: 'Automação',
  workshop: 'Oficina & Hardware',
  communication: 'Comunicação',
  utility: 'Utilitários',
  education: 'Educação',
  productivity: 'Produtividade',
}

function findAppByIdentifier(identifier: string): AppCatalogEntry | undefined {
  const clean = (identifier || '').trim().toLowerCase()
  if (!clean) return undefined
  const anchor = clean.startsWith('app-') ? clean.slice(4) : clean
  return ALL_APP_DOCS.find(
    (app) =>
      app.docsAnchor.toLowerCase() === anchor ||
      app.id.toLowerCase() === clean ||
      app.id.replace(/_/g, '-').toLowerCase() === anchor
  )
}

export default function Show({ content, slug }: { content: any; slug?: string }) {
  const { url } = usePage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const currentPath = useMemo(() => {
    const raw =
      url || (typeof window !== 'undefined' ? window.location.pathname : '')
    return raw.split('?')[0].split('#')[0]
  }, [url])

  const resolvedSlug = useMemo(() => {
    if (slug) return slug.toLowerCase()
    const match = currentPath.match(/^\/docs\/([^/?#]+)/)
    return match ? decodeURIComponent(match[1]).toLowerCase() : ''
  }, [slug, currentPath])

  const isAppManualIndex = resolvedSlug === 'supply-depot-apps'

  const focusedApp: AppCatalogEntry | undefined = useMemo(() => {
    if (!resolvedSlug.startsWith('app-')) return undefined
    return findAppByIdentifier(resolvedSlug)
  }, [resolvedSlug])

  // Redirect legacy /docs/supply-depot-apps#<anchor> or ?app=<anchor> URLs directly to the individual document
  useEffect(() => {
    if (!isAppManualIndex || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const appParam = params.get('app')
    const hash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
    const candidate = findAppByIdentifier(appParam || hash)
    if (candidate) {
      router.visit(`/docs/app-${candidate.docsAnchor}`, { replace: true })
    }
  }, [isAppManualIndex])

  // Deep-link hash scroll for regular survival/system docs
  useEffect(() => {
    if (focusedApp || isAppManualIndex || typeof window === 'undefined') return
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!hash) return
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    )
  }, [content, focusedApp, isAppManualIndex])

  // Prev / Next individual manual navigation
  const { prevApp, nextApp } = useMemo(() => {
    if (!focusedApp) return { prevApp: undefined, nextApp: undefined }
    const idx = ALL_APP_DOCS.findIndex((a) => a.id === focusedApp.id)
    return {
      prevApp: idx > 0 ? ALL_APP_DOCS[idx - 1] : undefined,
      nextApp: idx >= 0 && idx < ALL_APP_DOCS.length - 1 ? ALL_APP_DOCS[idx + 1] : undefined,
    }
  }, [focusedApp])

  // Filtered list for the Dedicated App Manuals Hub (/docs/supply-depot-apps)
  const filteredHubApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return ALL_APP_DOCS.filter((app) => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'native') {
          if (!app.isNative) return false
        } else {
          const matchesCat =
            app.category === selectedCategory ||
            (app.secondaryCategories && app.secondaryCategories.includes(selectedCategory))
          if (!matchesCat) return false
        }
      }
      if (!q) return true
      const creds = getAppDefaultCredentials(app.id)
      return (
        app.friendlyName.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.docsAnchor.toLowerCase().includes(q) ||
        app.purpose.toLowerCase().includes(q) ||
        String(app.port).includes(q) ||
        creds.username.toLowerCase().includes(q) ||
        creds.password.toLowerCase().includes(q)
      )
    })
  }, [searchQuery, selectedCategory])

  const pageTitle = focusedApp
    ? `${focusedApp.friendlyName} | Manual Individual NOMAD`
    : isAppManualIndex
      ? 'Central de Manuais Individuais de Aplicativos | Nexus NOMAD'
      : 'Manuais & Guias | Nexus NOMAD'

  return (
    <DocsLayout>
      <Head title={pageTitle} />
      <div className="xl:pl-80 pt-8 pb-16 px-6 sm:px-8 lg:px-12 w-full">
        <div className={isAppManualIndex ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'}>
          {/* Top Bar with Navigation & Breadcrumb */}
          <div className="mb-6 pb-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <Link href="/home" className="hover:text-desert-orange flex items-center gap-1 transition-colors">
                <IconHome size={16} />
                <span>Início</span>
              </Link>
              <span>/</span>
              {focusedApp ? (
                <>
                  <Link href="/docs/supply-depot-apps" className="hover:text-desert-orange transition-colors">
                    Manuais Individuais ({ALL_APP_DOCS.length})
                  </Link>
                  <span>/</span>
                  <span className="text-text-primary font-medium flex items-center gap-1">
                    <IconBook2 size={16} className="text-desert-orange" />
                    {focusedApp.friendlyName}
                  </span>
                </>
              ) : isAppManualIndex ? (
                <span className="text-text-primary font-medium flex items-center gap-1">
                  <IconApps size={16} className="text-desert-orange" />
                  Manuais Individuais de Aplicativos ({ALL_APP_DOCS.length} Documentos)
                </span>
              ) : (
                <span className="text-text-primary font-medium flex items-center gap-1">
                  <IconBook2 size={16} className="text-desert-orange" />
                  Manuais &amp; Conhecimento
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {focusedApp && (
                <Link
                  href="/docs/supply-depot-apps"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary hover:border-desert-orange hover:text-desert-orange transition-colors border border-border-subtle"
                >
                  <IconApps size={15} />
                  <span>Ver Todos os {ALL_APP_DOCS.length} Manuais</span>
                </Link>
              )}
              <Link
                href="/supply-depot"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-desert-green text-white hover:bg-btn-green-hover transition-colors border border-desert-green"
              >
                <IconArrowLeft size={16} />
                <span>Central de Aplicativos</span>
              </Link>
            </div>
          </div>

          {/* MODO 1: Documento Individual de Aplicativo (/docs/app-<docsAnchor>) */}
          {focusedApp ? (
            <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 sm:p-10 shadow-sm space-y-6">
              {/* App Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border-subtle">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-desert-green/20 border border-desert-green/40 flex items-center justify-center text-desert-green-foreground shadow-sm shrink-0">
                    <DynamicIcon
                      icon={(focusedApp.icon as DynamicIconName) || 'IconBrandDocker'}
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-text-primary">
                        {focusedApp.friendlyName}
                      </h1>
                      {focusedApp.isNative ? (
                        <span className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          Nativo N.O.M.A.D.
                        </span>
                      ) : (
                        <span className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          Arsenal Docker
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-mono px-2.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border-subtle">
                        <IconFileText size={12} />
                        app-{focusedApp.docsAnchor}.md
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-text-muted">
                      <span className="font-mono text-text-secondary bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                        ID: {focusedApp.id}
                      </span>
                      <span>•</span>
                      <span className="font-mono bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                        Porta TCP: {focusedApp.port}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-text-secondary">
                        Categoria: {CATEGORY_LABELS[focusedApp.category] || focusedApp.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick App Switcher -> Navigates directly to the app's individual document */}
                <select
                  value={focusedApp.docsAnchor}
                  onChange={(e) => {
                    router.visit(`/docs/app-${e.target.value}`)
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-surface-secondary border border-border-subtle text-text-primary focus:outline-none focus:border-desert-orange max-w-xs"
                  aria-label="Trocar de documento individual"
                >
                  {ALL_APP_DOCS.map((app) => (
                    <option key={app.id} value={app.docsAnchor}>
                      {app.friendlyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interactive Login & Password Card */}
              <AppCredentialsCard appId={focusedApp.id} />

              {/* Full Individual Markdown Document Rendered by Markdoc */}
              <div className="pt-2 border-t border-border-subtle">
                <MarkdocRenderer content={content} />
              </div>

              {/* Prev / Next Document Footer */}
              <div className="pt-5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
                {prevApp ? (
                  <Link
                    href={`/docs/app-${prevApp.docsAnchor}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-border-subtle hover:border-desert-orange text-xs font-semibold text-text-primary transition-colors"
                  >
                    <IconArrowLeft size={14} />
                    <span>Anterior: {prevApp.friendlyName}</span>
                  </Link>
                ) : (
                  <div />
                )}
                {nextApp && (
                  <Link
                    href={`/docs/app-${nextApp.docsAnchor}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-border-subtle hover:border-desert-orange text-xs font-semibold text-text-primary transition-colors"
                  >
                    <span>Próximo: {nextApp.friendlyName}</span>
                    <IconArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ) : isAppManualIndex ? (
            /* MODO 2: Tela Dedicada de Catálogo dos Manuais Individuais (/docs/supply-depot-apps) */
            <div className="space-y-6">
              {/* Hero Header */}
              <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                        Catálogo de Manuais Individuais de Aplicativos
                      </h1>
                      <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-desert-green text-white font-semibold">
                        {ALL_APP_DOCS.length} Documentos (.md)
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary max-w-3xl">
                      Cada programa do Arsenal N.O.M.A.D. possui seu próprio documento individual exclusivo
                      (<code className="font-mono text-xs bg-surface-secondary px-1.5 py-0.5 rounded border border-border-subtle">app-&lt;programa&gt;.md</code>),
                      contendo usuário e senha padrão de acesso, finalidade detalhada, recursos, arquitetura e exemplo real de uso.
                    </p>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <IconSearch
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar documento por aplicativo, login/senha padrão, porta TCP ou finalidade..."
                    className="w-full pl-10 pr-20 py-2.5 bg-surface-secondary border border-border-default focus:border-desert-orange rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text-primary px-2 py-1 bg-surface-primary rounded border border-border-subtle cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {CATEGORY_TABS.map((cat) => {
                    const active = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-desert-green text-white shadow-sm'
                            : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border-subtle'
                        }`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Count Bar */}
              <div className="flex items-center justify-between text-xs text-text-secondary px-1">
                <span>
                  Exibindo <strong>{filteredHubApps.length}</strong> de{' '}
                  <strong>{ALL_APP_DOCS.length}</strong> documentos individuais
                </span>
                <span className="font-mono text-text-muted">Clique em qualquer cartão para abrir seu manual exclusivo</span>
              </div>

              {/* Individual Document Cards Grid */}
              {filteredHubApps.length === 0 ? (
                <div className="bg-surface-primary rounded-xl border border-border-subtle p-10 text-center space-y-3">
                  <p className="text-sm text-text-secondary">
                    Nenhum documento individual encontrado para essa pesquisa.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                    }}
                    className="px-4 py-2 rounded-lg bg-desert-green text-white text-xs font-semibold cursor-pointer"
                  >
                    Mostrar Todos os {ALL_APP_DOCS.length} Documentos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHubApps.map((app) => {
                    const creds = getAppDefaultCredentials(app.id)
                    const catLabel = CATEGORY_LABELS[app.category] || app.category
                    return (
                      <Link
                        key={app.id}
                        href={`/docs/app-${app.docsAnchor}`}
                        className="group bg-surface-primary rounded-xl border border-border-subtle hover:border-desert-orange p-4 flex flex-col justify-between gap-3 shadow-sm transition-all"
                      >
                        <div className="space-y-2.5">
                          {/* Top icon & name */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border-subtle group-hover:border-desert-orange/50 flex items-center justify-center text-desert-green-foreground shrink-0">
                              <DynamicIcon
                                icon={(app.icon as DynamicIconName) || 'IconBrandDocker'}
                                className="w-5 h-5"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="text-sm font-bold text-text-primary group-hover:text-desert-orange transition-colors line-clamp-1">
                                {app.friendlyName}
                              </h2>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[0.65rem] text-text-muted">
                                <span className="font-mono px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle">
                                  :{app.port}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle">
                                  {catLabel}
                                </span>
                                {app.isNative ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-semibold">
                                    Nativo
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">
                                    Docker
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Purpose summary */}
                          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                            {app.purpose}
                          </p>

                          {/* Credentials Quick Pill */}
                          <div
                            className={`px-2.5 py-1.5 rounded-lg border text-[0.7rem] flex items-center gap-1.5 truncate ${
                              creds.mode === 'fixed'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : creds.mode === 'setup'
                                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-500'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                            }`}
                          >
                            {creds.mode === 'fixed' ? (
                              <IconKey size={13} className="shrink-0" />
                            ) : creds.mode === 'setup' ? (
                              <IconUserPlus size={13} className="shrink-0" />
                            ) : (
                              <IconLockOpen size={13} className="shrink-0" />
                            )}
                            <span className="truncate font-mono">
                              {creds.mode === 'fixed'
                                ? `${creds.username} / ${creds.password}`
                                : creds.username}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-[0.7rem]">
                          <span className="font-mono text-text-muted truncate max-w-[65%]">
                            app-{app.docsAnchor}.md
                          </span>
                          <span className="font-semibold text-desert-orange group-hover:underline inline-flex items-center gap-1">
                            <span>Abrir Manual</span>
                            <IconArrowRight size={13} />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* MODO 3: Manuais de Sobrevivência e Documentação do Sistema */
            <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 sm:p-10 shadow-sm">
              <MarkdocRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    </DocsLayout>
  )
}
