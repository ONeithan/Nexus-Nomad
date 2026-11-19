import { Head, Link } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowLeft,
  IconHome,
  IconBook2,
  IconTarget,
  IconListCheck,
  IconCpu,
  IconBulb,
  IconCheck,
  IconApps,
} from '@tabler/icons-react'
import MarkdocRenderer from '~/components/MarkdocRenderer'
import DocsLayout from '~/layouts/DocsLayout'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import AppCredentialsCard from '~/components/AppCredentialsCard'
import { APP_CATALOG, type AppCatalogEntry } from '../../../constants/app_catalog_data'

function resolveTargetSlug(): string {
  if (typeof window === 'undefined') return ''
  const path = window.location.pathname || ''
  if (!path.includes('supply-depot-apps')) return ''
  const params = new URLSearchParams(window.location.search)
  const appParam = params.get('app')?.trim().toLowerCase()
  if (appParam) return appParam
  return decodeURIComponent((window.location.hash || '').replace(/^#/, '')).trim().toLowerCase()
}

export default function Show({ content }: { content: any }) {
  const [targetSlug, setTargetSlug] = useState<string>(() => resolveTargetSlug())

  useEffect(() => {
    const syncSlug = () => setTargetSlug(resolveTargetSlug())
    syncSlug()
    window.addEventListener('hashchange', syncSlug)
    return () => window.removeEventListener('hashchange', syncSlug)
  }, [content])

  const focusedApp: AppCatalogEntry | undefined = useMemo(() => {
    if (!targetSlug) return undefined
    return APP_CATALOG.find(
      (app) =>
        app.docsAnchor.toLowerCase() === targetSlug ||
        app.id.toLowerCase() === targetSlug ||
        app.id.replace(/_/g, '-').toLowerCase() === targetSlug
    )
  }, [targetSlug])

  // Deep-link support for non-Supply-Depot markdown docs
  useEffect(() => {
    if (focusedApp) return
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!hash) return
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    )
  }, [content, focusedApp])

  return (
    <DocsLayout>
      <Head title={focusedApp ? `${focusedApp.friendlyName} | Manual NOMAD` : 'Manuais & Guias | Nexus NOMAD'} />
      <div className="xl:pl-80 pt-8 pb-16 px-6 sm:px-8 lg:px-12 w-full">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar with Navigation & Breadcrumb */}
          <div className="mb-6 pb-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Link href="/home" className="hover:text-desert-green flex items-center gap-1 transition-colors">
                <IconHome size={16} />
                <span>Início</span>
              </Link>
              <span>/</span>
              {focusedApp ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSlug('')
                      if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', '/docs/supply-depot-apps')
                      }
                    }}
                    className="hover:text-desert-green transition-colors cursor-pointer"
                  >
                    Manuais de Aplicativos
                  </button>
                  <span>/</span>
                  <span className="text-text-primary font-medium flex items-center gap-1">
                    <IconBook2 size={16} className="text-desert-green" />
                    {focusedApp.friendlyName}
                  </span>
                </>
              ) : (
                <span className="text-text-primary font-medium flex items-center gap-1">
                  <IconBook2 size={16} className="text-desert-green" />
                  Manuais &amp; Conhecimento
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {focusedApp && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetSlug('')
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', '/docs/supply-depot-apps')
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary hover:border-desert-green hover:text-desert-green transition-colors border border-border-subtle cursor-pointer"
                >
                  <IconApps size={15} />
                  <span>Ver Todos ({APP_CATALOG.length})</span>
                </button>
              )}
              <Link
                href="/supply-depot"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-desert-green/10 text-desert-green hover:bg-desert-green hover:text-white transition-colors border border-desert-green/20"
              >
                <IconArrowLeft size={16} />
                <span>Central de Aplicativos</span>
              </Link>
            </div>
          </div>

          {/* Individual App Documentation View OR Full Markdown Content */}
          {focusedApp ? (
            <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 sm:p-10 shadow-sm space-y-6">
              {/* App Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border-subtle">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-desert-green/15 border border-desert-green/30 flex items-center justify-center text-desert-green shadow-sm shrink-0">
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
                      <span className="capitalize font-medium">
                        Categoria: {focusedApp.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick App Switcher */}
                <select
                  value={focusedApp.docsAnchor}
                  onChange={(e) => {
                    const nextAnchor = e.target.value
                    setTargetSlug(nextAnchor)
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', `/docs/supply-depot-apps#${nextAnchor}`)
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-surface-secondary border border-border-subtle text-text-primary focus:outline-none focus:border-desert-green"
                  aria-label="Trocar de aplicativo"
                >
                  {APP_CATALOG.map((app) => (
                    <option key={app.id} value={app.docsAnchor}>
                      {app.friendlyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Login & Password Card */}
              <AppCredentialsCard appId={focusedApp.id} />

              {/* Section 1: Para que serve */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-desert-orange font-bold text-sm uppercase tracking-wider font-mono-mil">
                  <IconTarget size={18} />
                  <span>1. Para que serve este aplicativo</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm text-text-primary leading-relaxed">
                  {focusedApp.purpose}
                </div>
              </div>

              {/* Section 2: Principais recursos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-desert-green font-bold text-sm uppercase tracking-wider font-mono-mil">
                  <IconListCheck size={18} />
                  <span>2. Principais recursos e o que ele faz</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {focusedApp.features.map((feat, idx) => (
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
                  {focusedApp.howItWorks}
                </div>
              </div>

              {/* Section 4: Exemplo Real de Uso */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider font-mono-mil">
                  <IconBulb size={18} />
                  <span>4. Exemplo Real de Uso (Cenário da Vida Prática)</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  {focusedApp.realWorldExample}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 sm:p-10 shadow-sm">
              <MarkdocRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    </DocsLayout>
  )
}
