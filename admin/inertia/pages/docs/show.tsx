import { Head, Link } from '@inertiajs/react'
import { useEffect } from 'react'
import { IconArrowLeft, IconHome, IconBook2 } from '@tabler/icons-react'
import MarkdocRenderer from '~/components/MarkdocRenderer'
import DocsLayout from '~/layouts/DocsLayout'

export default function Show({ content }: { content: any }) {
  // Deep-link support: when arriving at /docs/<slug>#<anchor> (e.g. from a Supply Depot app's
  // "Docs" menu item), scroll to that section. The content renders synchronously from props, so a
  // double rAF lets the headings paint before we look one up.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!hash) return
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    )
  }, [content])

  return (
    <DocsLayout>
      <Head title="Manuais & Guias | Nexus NOMAD" />
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
              <span className="text-text-primary font-medium flex items-center gap-1">
                <IconBook2 size={16} className="text-desert-green" />
                Manuais & Conhecimento
              </span>
            </div>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-desert-green/10 text-desert-green hover:bg-desert-green hover:text-white transition-colors border border-desert-green/20"
            >
              <IconArrowLeft size={16} />
              Voltar ao Início
            </Link>
          </div>

          {/* Main Markdown Content */}
          <div className="bg-surface-primary rounded-xl border border-border-subtle p-6 sm:p-10 shadow-sm">
            <MarkdocRenderer content={content} />
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
