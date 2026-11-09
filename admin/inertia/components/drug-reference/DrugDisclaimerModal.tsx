import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { IconAlertTriangle } from '@tabler/icons-react'
import StyledButton from '~/components/StyledButton'

/**
 * localStorage key for the Drug Reference disclaimer acknowledgement. Versioned:
 * bump the suffix if the disclaimer text changes materially so every browser is
 * re-prompted. Per-browser by design — a new browser/device gets the gate again.
 */
export const DRUG_DISCLAIMER_ACK_KEY = 'nomad:drugReferenceDisclaimer:v1'

export function hasAcknowledgedDrugDisclaimer(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(DRUG_DISCLAIMER_ACK_KEY) === 'ack'
  } catch {
    return false
  }
}

/**
 * First-open disclaimer gate for the Drug Reference. Blocks the page until the
 * user acknowledges (no backdrop / Escape dismissal). On acknowledgement the
 * acceptance is saved to this browser's localStorage so it isn't shown again on
 * this browser — other browsers/devices see it on their first open.
 */
export default function DrugDisclaimerModal({ open, onAcknowledge }: { open: boolean; onAcknowledge: () => void }) {
  const acknowledge = () => {
    try {
      window.localStorage.setItem(DRUG_DISCLAIMER_ACK_KEY, 'ack')
    } catch {
      // Private mode / storage disabled — still let them through for this session.
    }
    onAcknowledge()
  }

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
          <DialogPanel className="relative w-full transform overflow-hidden rounded-lg bg-surface-primary px-5 pb-5 pt-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-lg sm:p-6">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-desert-orange/15 text-desert-orange-dark">
                <IconAlertTriangle size={26} />
              </span>
              <DialogTitle as="h3" className="mt-4 text-lg font-bold text-text-primary">
                Antes de usar o Guia de Medicamentos
              </DialogTitle>
            </div>

            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <p>
                Esta ferramenta exibe informações gerais de saúde extraídas de <strong>bulas oficiais da FDA</strong> e
                correlaciona sintomas a opções de venda livre (isentos de prescrição médica). É fornecida exclusivamente para fins <strong>informativos e de referência offline</strong>.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Não constitui aconselhamento médico</strong> nem substitui a consulta com médicos, farmacêuticos ou enfermeiros.
                </li>
                <li>
                  <strong>Não é um verificador cruzado de interações medicamentosas</strong>. Sempre leia a bula completa do produto físico que você possui e consulte um profissional de saúde antes de combinar medicamentos.
                </li>
                <li>
                  A correspondência por situação e sintomas provém do texto descritivo das bulas, não de recomendações clínicas — podendo estar incompleta ou incluir produtos não convencionais.
                </li>
                <li>
                  Siga sempre as instruções e advertências contidas no <strong>produto físico real que você possui</strong>; dosagens e contraindicações variam entre fabricantes e apresentações.
                </li>
                <li>
                  Em caso de emergência ou se os sintomas forem graves, persistirem ou piorarem,{' '}
                  <strong>procure atendimento médico imediatamente ou acione os serviços de urgência</strong>.
                </li>
              </ul>
              <p className="text-xs text-text-muted">
                Dados extraídos do openFDA (U.S. FDA, domínio público). O NOMAD não possui afiliação ou endosso governamental.
              </p>
            </div>

            <div className="mt-6">
              <StyledButton variant="action" fullWidth onClick={acknowledge}>
                Compreendo e aceito — Continuar
              </StyledButton>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
