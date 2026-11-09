import { IconAlertTriangle } from '@tabler/icons-react'

/**
 * "When to use what" — top-of-page safety banner.
 *
 * A prominent amber callout that renders at the TOP of both the condition index
 * and detail pages: results are FDA label-indication matches, NOT
 * recommendations, NOT an FDA endorsement, and NOT a drug-interaction checker.
 * It leads the page (not a footnote) so the caveat is read before any result.
 */
export default function SafetyBanner() {
  return (
    <div role="alert" className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <IconAlertTriangle
          size={22}
          className="mt-0.5 flex-shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">Referência puramente informativa — não constitui aconselhamento médico.</p>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
            <li>
              Estes resultados relacionam indicações textuais de bulas oficiais a sintomas. Eles{' '}
              <strong>não são uma recomendação médica</strong> e <strong>não possuem endosso da FDA</strong>.
            </li>
            <li>
              Isto <strong>não é um verificador cruzado de interações medicamentosas</strong>. Leia a bula completa
              do produto físico e consulte um médico ou farmacêutico antes de combinar remédios.
            </li>
            <li>
              Em caso de emergência ou sintomas graves/persistentes,{' '}
              <strong>procure atendimento médico imediatamente ou acione o socorro de urgência</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
