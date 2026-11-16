import { useState } from 'react'
import Footer from '~/components/Footer'
import ChatButton from '~/components/chat/ChatButton'
import ChatModal from '~/components/chat/ChatModal'
import TacticalBootGate, { lockTacticalConsole } from '~/components/TacticalBootGate'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import { useThemeContext } from '~/providers/ThemeProvider'
import { SERVICE_NAMES } from '../../constants/service_names'
import { Link, router } from '@inertiajs/react'
import { IconArrowLeft, IconHome, IconLock, IconServer, IconBook } from '@tabler/icons-react'
import classNames from 'classnames'
import AppCatalogModal from '~/components/AppCatalogModal'

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
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const aiAssistantInstalled = useServiceInstalledStatus(SERVICE_NAMES.OLLAMA)
  const { effectiveTacticalHome } = useThemeContext()
  const isHome =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/home' || window.location.pathname === '/')

  const hideClassicBranding = isHome && effectiveTacticalHome

  return (
    <TacticalBootGate>
      <div className="min-h-screen flex flex-col">
        {/* Barra superior com navegação inteligente e acesso aos Discos & Armazenamento */}
        <div className="w-full bg-surface-primary border-b border-border-subtle px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isHome ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.history.length > 1) {
                      window.history.back()
                    } else {
                      router.visit('/home')
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-desert-orange text-sm font-medium text-text-primary transition-colors cursor-pointer"
                >
                  <IconArrowLeft size={17} />
                  <span>Voltar</span>
                </button>
                <Link
                  href="/home"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-desert-green text-sm font-medium text-text-primary transition-colors"
                >
                  <IconHome size={17} />
                  <span>Início</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-desert-green px-2.5 py-1 rounded-full bg-desert-green-lighter border border-desert-green-light">
                  <span className="h-2 w-2 rounded-full bg-desert-orange animate-pulse" />
                  Servidor Offline • PT-BR
                </span>
                <Link
                  href="/home"
                  title="Ir para o Início do Nexus N.O.M.A.D."
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border-subtle bg-surface-secondary hover:border-desert-orange transition-colors"
                >
                  <img
                    src="/nomad-primary.svg"
                    alt="Nexus N.O.M.A.D."
                    className="h-4 w-4 object-contain"
                  />
                  <span className="text-xs font-bold tracking-wider text-text-primary uppercase">
                    Nexus N.O.M.A.D.
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              title="Abrir Catálogo Completo & Guia Operacional das 114 Aplicações"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-desert-orange/40 bg-desert-orange/10 hover:bg-desert-orange hover:text-white text-xs sm:text-sm font-semibold text-desert-orange transition-colors cursor-pointer"
            >
              <IconBook size={16} />
              <span>Catálogo &amp; Guias</span>
            </button>
            <Link
              href="/settings/system#discos"
              title="Ver discos físicos conectados, partições e armazenamento do servidor"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-desert-green bg-desert-green text-white hover:opacity-90 text-xs sm:text-sm font-semibold shadow-sm transition-opacity"
            >
              <IconServer size={16} />
              <span>Discos &amp; Armazenamento</span>
            </Link>
            <button
              type="button"
              onClick={() => lockTacticalConsole()}
              title="Bloquear terminal e retornar à tela de Login / Boot Tático"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-status-warning text-xs font-semibold text-text-secondary hover:text-status-warning transition-colors cursor-pointer"
            >
              <IconLock size={15} />
              <span className="hidden md:inline">Bloquear</span>
            </button>
          </div>
        </div>

        {!hideClassicBranding && (
          <>
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
          </>
        )}

        <div className="flex-1 w-full bg-desert">{children}</div>
        <Footer />

        {aiAssistantInstalled.isInstalled && (
          <>
            <ChatButton onClick={() => setIsChatOpen(true)} />
            <ChatModal open={isChatOpen} onClose={() => setIsChatOpen(false)} />
          </>
        )}

        <AppCatalogModal
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
        />
      </div>
    </TacticalBootGate>
  )
}
