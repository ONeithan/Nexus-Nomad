import { useState } from 'react'
import Footer from '~/components/Footer'
import ChatButton from '~/components/chat/ChatButton'
import ChatModal from '~/components/chat/ChatModal'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import { SERVICE_NAMES } from '../../constants/service_names'
import { Link, router } from '@inertiajs/react'
import { IconArrowLeft, IconServer } from '@tabler/icons-react'
import classNames from 'classnames'

export default function AppLayout({
  children,
  compact = false,
}: {
  children: React.ReactNode
  /**
   * Compact header for focused tool pages (e.g. Drug Reference): a small inline
   * logo + title instead of the full-height branding block, so the tool's own
   * controls sit near the top of the viewport instead of ~230px down.
   */
  compact?: boolean
}) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const aiAssistantInstalled = useServiceInstalledStatus(SERVICE_NAMES.OLLAMA)
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/home'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior limpa com acesso direto aos Discos & Armazenamento conectados */}
      <div className="w-full bg-surface-primary border-b border-border-subtle px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isHome ? (
            <Link
              href="/home"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-desert-green text-sm font-medium text-text-primary transition-colors"
            >
              <IconArrowLeft size={18} />
              <span>Voltar ao Início</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-desert-green px-2.5 py-1 rounded-full bg-desert-green-lighter border border-desert-green-light">
              <span className="h-2 w-2 rounded-full bg-desert-green" />
              Servidor Offline • PT-BR
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/system#discos"
            title="Ver discos físicos conectados, partições e armazenamento do servidor"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-desert-green bg-desert-green text-white hover:opacity-90 text-sm font-semibold shadow-sm transition-opacity"
          >
            <IconServer size={17} />
            <span>Discos &amp; Armazenamento</span>
          </Link>
        </div>
      </div>

      <div
        className={classNames(
          'flex cursor-pointer items-center justify-center',
          compact ? 'gap-3 p-3 flex-row' : 'gap-2 p-3 flex-col'
        )}
        onClick={() => router.visit('/home')}
      >
        <img
          src="/nomad-primary.svg"
          alt="Logo Nexus Project NOMAD"
          className={compact ? 'h-12 w-12 object-contain' : 'h-36 w-36 object-contain'}
        />
        <h1
          className={classNames(
            'font-bold text-desert-green',
            compact ? 'text-2xl' : 'text-4xl md:text-5xl'
          )}
        >
          Centro de Comando
        </h1>
      </div>

      <hr className="text-desert-green font-semibold h-[1.5px] bg-desert-green border-none mt-0" />
      <div className="flex-1 w-full bg-desert">{children}</div>
      <Footer />

      {aiAssistantInstalled.isInstalled && (
        <>
          <ChatButton onClick={() => setIsChatOpen(true)} />
          <ChatModal open={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
      )}
    </div>
  )
}
