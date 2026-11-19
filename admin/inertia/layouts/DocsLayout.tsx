import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { IconApps, IconBook2, IconSearch } from '@tabler/icons-react'
import StyledSidebar from '~/components/StyledSidebar'
import api from '~/lib/api'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { url } = usePage()
  const { data, isLoading } = useQuery<Array<{ title: string; slug: string }>>({
    queryKey: ['docs'],
    queryFn: async () => (await api.listDocs()) ?? [],
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const currentPath = useMemo(() => {
    const raw =
      url || (typeof window !== 'undefined' ? window.location.pathname : '')
    return raw.split('?')[0].split('#')[0]
  }, [url])

  const isViewingIndividualAppDoc = currentPath.startsWith('/docs/app-')
  const [sidebarTab, setSidebarTab] = useState<'system' | 'apps'>(() =>
    isViewingIndividualAppDoc ? 'apps' : 'system'
  )
  const [sidebarSearch, setSidebarSearch] = useState('')

  useEffect(() => {
    if (isViewingIndividualAppDoc) {
      setSidebarTab('apps')
    }
  }, [isViewingIndividualAppDoc])

  const { systemDocs, appDocs } = useMemo(() => {
    if (isLoading || !data) return { systemDocs: [], appDocs: [] }
    const system: Array<{ title: string; slug: string }> = []
    const apps: Array<{ title: string; slug: string }> = []
    for (const doc of data) {
      if (doc.slug.startsWith('app-')) {
        apps.push(doc)
      } else {
        system.push(doc)
      }
    }
    return { systemDocs: system, appDocs: apps }
  }, [data, isLoading])

  const items = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase()
    const pool = sidebarTab === 'apps' ? appDocs : systemDocs

    return pool
      .filter((doc) => {
        if (!q) return true
        return doc.title.toLowerCase().includes(q) || doc.slug.toLowerCase().includes(q)
      })
      .map((doc) => ({
        name:
          sidebarTab === 'apps'
            ? doc.title.replace(/^App:\s*/i, '')
            : doc.title,
        href: `/docs/${doc.slug}`,
        current: false,
      }))
  }, [sidebarTab, systemDocs, appDocs, sidebarSearch])

  const topSlot = (
    <div className="space-y-2.5">
      {/* Quick Search inside sidebar */}
      <div className="relative">
        <IconSearch
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          placeholder="Filtrar manuais..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-primary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-desert-orange"
        />
      </div>

      {/* Category Switcher: Sistema/Sobrevivência vs Apps Individuais */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setSidebarTab('system')}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[0.7rem] font-semibold border transition-colors cursor-pointer ${
            sidebarTab === 'system'
              ? 'bg-desert-green text-white border-desert-green'
              : 'bg-surface-primary/60 text-text-primary border-border-default hover:border-desert-green'
          }`}
        >
          <IconBook2 size={13} />
          <span>Sistema ({systemDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('apps')}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[0.7rem] font-semibold border transition-colors cursor-pointer ${
            sidebarTab === 'apps'
              ? 'bg-desert-green text-white border-desert-green'
              : 'bg-surface-primary/60 text-text-primary border-border-default hover:border-desert-green'
          }`}
        >
          <IconApps size={13} />
          <span>Apps ({appDocs.length})</span>
        </button>
      </div>

      {/* Shortcut to Dedicated App Manuals Hub Screen */}
      <Link
        href="/docs/supply-depot-apps"
        className={`flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
          currentPath === '/docs/supply-depot-apps'
            ? 'bg-desert-orange text-white border-desert-orange'
            : 'bg-desert-orange/15 text-desert-orange border-desert-orange/30 hover:bg-desert-orange hover:text-white'
        }`}
      >
        <IconApps size={14} />
        <span>Catálogo de Manuais ({appDocs.length || 114})</span>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-row bg-desert-white">
      <StyledSidebar
        title="Manuais & Guias"
        items={items}
        topSlot={topSlot}
        emptyMessage="Nenhum manual encontrado para essa busca."
      />
      {children}
    </div>
  )
}
