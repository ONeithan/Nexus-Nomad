import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { router } from '@inertiajs/react'
import {
  IconArrowRight,
  IconBrain,
  IconExternalLink,
  IconMessages,
  IconRobot,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import type { AiEngineOption } from '~/hooks/useAiStatus'

interface AiChooserModalProps {
  open: boolean
  onClose: () => void
  engines: AiEngineOption[]
  /** When true (e.g. AppLayout floating button), triggers the native ChatModal instead of navigating to /chat */
  onSelectNativeModal?: () => void
}

export default function AiChooserModal({
  open,
  onClose,
  engines,
  onSelectNativeModal,
}: AiChooserModalProps) {
  const handleChoose = (engine: AiEngineOption) => {
    onClose()
    if (engine.isInternal) {
      if (onSelectNativeModal) {
        onSelectNativeModal()
      } else {
        router.visit(engine.href)
      }
      return
    }
    window.open(engine.href, '_blank', 'noopener,noreferrer')
  }

  const renderIcon = (engine: AiEngineOption) => {
    if (engine.id === 'open_webui') {
      return <IconMessages size={22} className="text-emerald-400" />
    }
    if (engine.id === 'dify') {
      return <IconRobot size={22} className="text-amber-400" />
    }
    return <IconBrain size={22} className="text-desert-olive" />
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 z-10 w-full overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-xl rounded-2xl bg-surface-primary border border-border-default p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
              <div>
                <DialogTitle as="h3" className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <IconBrain size={22} className="text-desert-green shrink-0" />
                  <span>Escolher Interface de IA Conectada</span>
                </DialogTitle>
                <p className="text-xs text-text-secondary mt-1">
                  Detectamos {engines.length} motores/interfaces de IA instalados. Selecione qual você deseja abrir agora:
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default cursor-pointer"
                aria-label="Fechar"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {engines.map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => handleChoose(engine)}
                  className="w-full text-left p-4 rounded-xl border border-border-default bg-surface-secondary hover:border-desert-green hover:bg-surface-elevated transition-all flex items-start justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-surface-primary border border-border-default flex items-center justify-center shrink-0">
                      {renderIcon(engine)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-text-primary group-hover:text-desert-green transition-colors">
                          {engine.title}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-mono font-bold border ${
                            engine.online
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-desert-orange/15 text-desert-orange border-desert-orange/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              engine.online ? 'bg-emerald-400 animate-pulse' : 'bg-desert-orange'
                            }`}
                          />
                          {engine.online ? 'ONLINE' : 'PAUSADO'}
                        </span>
                        <span className="text-[0.625rem] font-mono px-2 py-0.5 rounded bg-surface-primary border border-border-subtle text-text-muted">
                          {engine.locationLabel}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {engine.description}
                      </p>
                      {engine.backendNote && (
                        <p className="text-[0.6875rem] font-mono text-desert-tan">
                          • {engine.backendNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-desert-green shrink-0 mt-1">
                    <span>Abrir</span>
                    {engine.isInternal ? <IconArrowRight size={16} /> : <IconExternalLink size={16} />}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.visit('/settings/models')
                }}
                className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-semibold cursor-pointer"
              >
                <IconSettings size={15} />
                <span>Configurar Conexões &amp; Modelos</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
