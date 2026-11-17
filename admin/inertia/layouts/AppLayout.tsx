import { useState } from 'react'
import Footer from '~/components/Footer'
import ChatButton from '~/components/chat/ChatButton'
import ChatModal from '~/components/chat/ChatModal'
import TacticalBootGate, { lockTacticalConsole, rebootNomadSystem } from '~/components/TacticalBootGate'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import { SERVICE_NAMES } from '../../constants/service_names'
import { Link, router, usePage } from '@inertiajs/react'
import { IconArrowLeft, IconHome, IconLock, IconServer, IconBook, IconRotateClockwise, IconSettings } from '@tabler/icons-react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
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
  const [isRebootModalOpen, setIsRebootModalOpen] = useState(false)
  const aiAssistantInstalled = useServiceInstalledStatus(SERVICE_NAMES.OLLAMA)
  const page = usePage()
  const currentPath = page.url || ''
  const isHome =
    currentPath === '/home' ||
    currentPath === '/' ||
    currentPath.startsWith('/home?') ||
    currentPath.startsWith('/?')
  const isSupplyDepot = currentPath.startsWith('/supply-depot')

  const hideClassicBranding = isHome

  return (
    <TacticalBootGate>
      <div className="min-h-screen flex flex-col">
        {/* Barra superior HUD com navegação inteligente e acesso às Configurações */}
        <div className="w-full bg-surface-primary border-b border-border-subtle px-4 sm:px-6 py-2.5 sticky top-0 z-40 shadow-sm">
          <div className={classNames(
            'flex flex-wrap items-center justify-between gap-3 w-full mx-auto',
            isHome ? 'max-w-[1360px]' : 'w-full'
          )}>
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
                <Link
                  href="/home"
                  title="N.O.M.A.D. - Centro de Comando & Operações"
                  className="inline-flex items-center gap-2.5 transition-transform hover:scale-[1.01]"
                >
                  <img
                    src="/nomad-primary.svg"
                    alt="Nexus N.O.M.A.D."
                    className="h-7 w-7 object-contain"
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-stencil tracking-wider uppercase text-base sm:text-lg font-extrabold text-desert-tan">
                      N.O.M.A.D.
                    </span>
                    <span className="text-border-default font-light hidden sm:inline">|</span>
                    <span className="text-xs sm:text-sm font-bold tracking-wider text-text-primary uppercase hidden sm:inline font-mono-mil">
                      CENTRO DE COMANDO &amp; OPERAÇÕES
                    </span>
                  </div>
                </Link>

                <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono-mil">
                  <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border-default text-desert-green font-bold inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-desert-green nomad-telemetry-dot" />
                    RESTRITO // OFF-GRID
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border-default text-text-muted">
                    MIL-STD-810H
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border-default text-desert-tan font-bold">
                    NÓ: NEXUS-01
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isHome ? (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-surface-secondary border border-border-subtle text-[11px] font-mono-mil mr-1">
                <span className="w-2 h-2 rounded-full bg-desert-green nomad-telemetry-dot" />
                <span className="text-text-muted uppercase">STATUS:</span>
                <span className="text-desert-olive font-bold">100% NOMINAL</span>
              </div>
            ) : isSupplyDepot ? (
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                title="Abrir Catálogo Completo & Guia Operacional das Aplicações"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-desert-orange/40 bg-desert-orange/10 hover:bg-desert-orange hover:text-white text-xs sm:text-sm font-semibold text-desert-orange transition-colors cursor-pointer"
              >
                <IconBook size={16} />
                <span>Catálogo &amp; Guias</span>
              </button>
            ) : (
              <Link
                href="/settings/system#discos"
                title="Ver discos físicos conectados, partições e armazenamento do servidor"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-desert-green bg-desert-green text-white hover:opacity-90 text-xs sm:text-sm font-semibold shadow-sm transition-opacity"
              >
                <IconServer size={16} />
                <span className="hidden md:inline">Discos &amp; Armazenamento</span>
              </Link>
            )}

            <Link
              href="/settings/system"
              title="Configurações do Sistema"
              aria-label="Configurações do Sistema"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-desert-tan text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <IconSettings size={16} />
              <span className="hidden sm:inline">Configurações</span>
            </Link>
            <button
              type="button"
              onClick={() => lockTacticalConsole()}
              title="Bloquear terminal e retornar à tela de Login / Boot Tático"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default bg-surface-secondary hover:border-status-warning text-xs sm:text-sm font-semibold text-text-secondary hover:text-status-warning transition-colors cursor-pointer"
            >
              <IconLock size={15} />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRebootModalOpen(true)}
              title="Reiniciar exclusivamente o contêiner do Nexus N.O.M.A.D."
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-desert-orange/40 bg-desert-orange/10 hover:bg-desert-orange hover:text-black text-xs sm:text-sm font-semibold text-desert-orange transition-colors cursor-pointer"
            >
              <IconRotateClockwise size={15} />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
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

        {/* Modal Tático de Reinicialização do N.O.M.A.D. */}
        <Dialog
          open={isRebootModalOpen}
          onClose={() => setIsRebootModalOpen(false)}
          className="relative z-50"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-primary border border-desert-orange/60 p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center gap-3 text-desert-orange mb-3">
                  <IconRotateClockwise size={26} className="shrink-0" />
                  <h3 className="text-base font-bold text-text-primary">
                    Reiniciar Nexus N.O.M.A.D.
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Esta ação reinicia <strong>apenas o contêiner do Nexus N.O.M.A.D.</strong>. Suas aplicações ativas no Portainer/Docker (Kiwix, Ollama, Jellyfin, etc.) <strong>NÃO</strong> serão interrompidas.
                </p>
                <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-[11px] text-text-muted mb-5 space-y-1">
                  <div>• O sistema exibirá a tela de inicialização do N.O.M.A.D. enquanto o contêiner reinicia.</div>
                  <div>• Ao finalizar, retornará automaticamente ao Centro de Comando.</div>
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRebootModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRebootModalOpen(false)
                      rebootNomadSystem()
                    }}
                    className="px-4 py-1.5 rounded-lg bg-desert-orange hover:bg-desert-orange-dark text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconRotateClockwise size={14} />
                    <span>Confirmar e Reiniciar</span>
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </div>
    </TacticalBootGate>
  )
}
