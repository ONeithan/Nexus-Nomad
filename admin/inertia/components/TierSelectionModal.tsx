import { Fragment, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Dialog, Transition } from '@headlessui/react'
import { IconX, IconCheck, IconInfoCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import type { CategoryWithStatus, SpecTier, SpecResource } from '../../types/collections'
import { resolveTierResources } from '~/lib/collections'
import { formatBytes } from '~/lib/util'
import api from '~/lib/api'
import classNames from 'classnames'
import DynamicIcon, { DynamicIconName } from './DynamicIcon'
import StyledButton from './StyledButton'
import KbGuardrailModal from './KbGuardrailModal'
import { evaluateGuardrail, type GuardrailVerdict } from '~/lib/kb_guardrail'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'

/**
 * Filename for the embed-estimate registry lookup. Strips the URL path so
 * patterns like `wikipedia_en_simple_` continue to match upstream filenames
 * regardless of mirror domain.
 */
const RESOURCE_TITLE_TRANSLATIONS: Record<string, string> = {
  'Medical Library': 'Biblioteca Médica de Emergência',
  'NHS Medicines A to Z': 'Guia de Remédios e Posologia (NHS A a Z)',
  'Military Medicine': 'Medicina Militar e Tática de Combate',
  'CDC Health Information': 'Manual de Saúde Pública e Doenças (CDC)',
  'MedlinePlus': 'Enciclopédia de Saúde MedlinePlus (NIH)',
  'FDA Drug Reference': 'Referência Farmacológica e Bulas de Medicamentos (FDA)',
  'Wikipedia Medicine': 'Wikipédia Médica Ilustrada',
  'LibreTexts Medicine': 'Livros Didáticos de Medicina (LibreTexts)',
  'LibrePathology': 'Patologia Clínica e Diagnóstico de Doenças (LibrePathology)',
  'Water Treatment Library': 'Guia de Captação e Purificação de Água',
  'Food for Preppers': 'Alimentação e Racionamento para Sobrevivência',
  'A Library of Knots': 'Manual Ilustrado de Nós, Amarras e Suturas',
  'Canadian Prepper: Winter Prepping': 'Sobrevivência no Frio Extremo e Inverno Rigoroso',
  'Canadian Prepper: Bug Out Roll': 'Mochila de Fuga e Equipamentos Essenciais (Bug Out Bag)',
  'Ready.gov': 'Plano Oficial de Desastres e Emergências (Ready.gov)',
  'The Great Outdoors Q&A': 'Sobrevivência Selvagem e Trekking (Stack Exchange)',
  'Amateur Radio Q&A': 'Rádio Amadorismo e Comunicação de Crise (Q&A)',
  'Canadian Prepper: Bug Out Concepts': 'Estratégias e Rotas de Evacuação Tática',
  'Urban Prepper': 'Preparação e Defesa para Emergências Urbanas',
  'Canadian Prepper: Prepping Food': 'Armazenamento Alimentar de Longo Prazo',
  'Post Disaster Resource Library': 'Recuperação, Abrigo e Saneamento Pós-Desastre',
  'Hundred Rabbits': 'Vida Autossuficiente e Energia Solar Off-Grid (Hundred Rabbits)',
  'Project Gutenberg: Military Science': 'Estratégia e Ciência Militar Clássica (Gutenberg)',
  'CD3WD: Appropriate Technology Library': 'Tecnologia Apropriada e Engenharia de Aldeia (CD3WD)',
  'Wikibooks': 'Livros Didáticos Livres (Wikibooks)',
  'TED-Ed': 'Aulas e Animações Educativas (TED-Ed)',
  'Wikiversity': 'Universidade Aberta (Wikiversity)',
  'LibreTexts Mathematics': 'Matemática e Cálculo Diferencial (LibreTexts)',
  'LibreTexts Physics': 'Física Clássica e Moderna (LibreTexts)',
  'LibreTexts Chemistry': 'Química Geral e Orgânica (LibreTexts)',
  'LibreTexts Biology': 'Biologia Geral e Genética (LibreTexts)',
  'Wikibooks (With Images)': 'Livros Didáticos Ilustrados (Wikibooks Maxi)',
  'TED Conference': 'Conferências Globais TED (Arquivo de Vídeos)',
  'LibreTexts Humanities': 'Ciências Humanas, Filosofia e História (LibreTexts)',
  'LibreTexts Geosciences': 'Geociências, Climatologia e Geologia (LibreTexts)',
  'LibreTexts Engineering': 'Engenharia e Estruturas Mecânicas (LibreTexts)',
  'LibreTexts Business': 'Administração, Finanças e Gestão Prática (LibreTexts)',
  'Woodworking Q&A': 'Marcenaria e Carpintaria Prática (Stack Exchange)',
  'Motor Vehicle Maintenance Q&A': 'Mecânica Automotiva e Conserto de Veículos (Q&A)',
  'DIY & Home Improvement Q&A': 'Reformas, Hidráulica e Elétrica Residencial (Q&A)',
  'iFixit Repair Guides': 'Manuais Oficiais de Reparo iFixit',
  'FOSS Cooking': 'Culinária Básica e Nutritiva (FOSS Cooking)',
  'Based.Cooking': 'Receitas Sem Firula (Based.Cooking)',
  'Gardening Q&A': 'Hortas, Cultivo e Jardinagem Produtiva (Q&A)',
  'Cooking Q&A': 'Técnicas Culinárias e Segurança dos Alimentos (Q&A)',
  'Learning Self-Reliance: Homesteading': 'Vida no Campo e Autossuficiência Rural (Homesteading)',
  'Project Gutenberg: Agriculture': 'Tratados Históricos de Agropecuária (Gutenberg)',
  'freeCodeCamp': 'Cursos de Programação Web (freeCodeCamp)',
  'Python Documentation': 'Documentação Oficial do Python',
  'JavaScript Documentation': 'Documentação Oficial de JavaScript (MDN)',
  'HTML Documentation': 'Manual de HTML5 (MDN)',
  'CSS Documentation': 'Manual de CSS3 e Estilos (MDN)',
  'Arduino Q&A': 'Automação e Microcontroladores Arduino (Q&A)',
  'Raspberry Pi Q&A': 'Sistemas Embarcados e Raspberry Pi (Q&A)',
  'Node.js Documentation': 'Documentação Oficial do Node.js',
  'React Documentation': 'Documentação Oficial do React',
  'Git Documentation': 'Manual de Controle de Versão Git',
  'Electronics Q&A': 'Engenharia Eletrônica e Projetos de Circuitos (Q&A)',
  'Robotics Q&A': 'Robótica, Sensores e Atuadores (Q&A)',
  'Docker Documentation': 'Manual de Contêineres Docker',
  'Linux Documentation': 'Manual do Sistema Operacional Linux e Terminal Bash',
}

function resourceFilename(resource: SpecResource): string {
  const last = resource.url.split('/').pop()
  return last && last.length > 0 ? last : resource.id
}

interface TierSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryWithStatus | null
  selectedTierSlug?: string | null
  onSelectTier: (category: CategoryWithStatus, tier: SpecTier) => void
}

const TierSelectionModal: React.FC<TierSelectionModalProps> = ({
  isOpen,
  onClose,
  category,
  selectedTierSlug,
  onSelectTier,
}) => {
  // Local selection state - initialized from prop
  const [localSelectedSlug, setLocalSelectedSlug] = useState<string | null>(null)
  const [targetDisk, setTargetDisk] = useState<string>('')

  const { data: storageOverview } = useQuery({
    queryKey: ['storage-overview'],
    queryFn: async () => {
      const res = await axios.get<{
        storageRoot: string
        preferredDownloadDisk: string
        mountTargets: { label: string; path: string; freeBytes: number; totalBytes: number }[]
      }>('/api/system/storage/overview')
      return res.data
    },
    staleTime: 60_000,
  })

  // Reset local selection when modal opens or category changes
  useEffect(() => {
    if (isOpen && category) {
      setLocalSelectedSlug(selectedTierSlug || null)
    }
  }, [isOpen, category, selectedTierSlug])

  // Get all resources for a tier (including inherited resources). Defined as a
  // hook-safe closure (always callable, returns [] when no category) so the
  // memo below can depend on `category` without breaking hook order.
  const getAllResourcesForTier = (tier: SpecTier): SpecResource[] => {
    if (!category) return []
    return resolveTierResources(tier, category.tiers)
  }

  // Pre-compute the selected tier's resources outside the JSX so hooks below
  // don't re-run on every render. Empty array when no selection.
  const selectedTierResources = useMemo<SpecResource[]>(() => {
    if (!category || !localSelectedSlug) return []
    const tier = category.tiers.find((t) => t.slug === localSelectedSlug)
    return tier ? resolveTierResources(tier, category.tiers) : []
  }, [category, localSelectedSlug])

  const embedEstimateRequest = useMemo(
    () =>
      selectedTierResources.map((r) => ({
        filename: resourceFilename(r),
        sizeBytes: Math.round(r.size_mb * 1024 * 1024),
      })),
    [selectedTierResources]
  )

  const { data: embedEstimate, isLoading: isEstimating } = useQuery({
    queryKey: ['embedEstimateBatch', embedEstimateRequest],
    queryFn: () => api.estimateEmbeddingBatch(embedEstimateRequest),
    enabled: embedEstimateRequest.length > 0,
    staleTime: 5 * 60_000,
  })

  const { data: ingestPolicySetting } = useQuery({
    queryKey: ['ingestPolicy'],
    queryFn: () => api.getSetting('rag.defaultIngestPolicy'),
  })

  // System info for the disk-free side of the guardrail. Shared queryKey with
  // the home / easy-setup pages so we don't refetch when the user already has
  // a fresh copy in cache from a sibling component.
  const { data: systemInfo } = useSystemInfo({ enabled: true })

  // Open state for the guardrail modal — separate from the tier modal so the
  // user sees the warning as an overlay without losing their tier selection
  // underneath. Cancel returns to the tier modal as-is; Proceed closes both
  // and runs the original onSelectTier path.
  const [guardrailVerdict, setGuardrailVerdict] = useState<GuardrailVerdict | null>(null)

  // Compute disk-free bytes from system info; 0 means "unknown", which the
  // guardrail helper treats as "skip the relative-disk check".
  // Must be declared before the `!category` early return so the hook count
  // stays constant across renders (category transitions null → non-null when
  // the user opens the modal).
  const freeBytes = useMemo<number>(() => {
    const primary = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)
    if (!primary) return 0
    return Math.max(0, primary.totalSize - primary.totalUsed)
  }, [systemInfo])

  const availableDisks = useMemo(() => {
    const list = [...(storageOverview?.mountTargets || [])]
    if (systemInfo?.disk && Array.isArray(systemInfo.disk)) {
      for (const d of systemInfo.disk) {
        if (d.filesystems && Array.isArray(d.filesystems)) {
          for (const fs of d.filesystems) {
            if (fs.mount && !list.some((item) => item.path === fs.mount)) {
              list.push({
                label: `Disco ${d.name} (${fs.mount}) • ${d.model || d.vendor || 'Disco Local'}`,
                path: fs.mount,
                freeBytes: Math.max(0, (fs.size || 0) - (fs.used || 0)),
                totalBytes: fs.size || 0,
              })
            }
          }
        }
      }
    }
    return list
  }, [storageOverview?.mountTargets, systemInfo?.disk])

  const ingestPolicy: 'Always' | 'Manual' =
    ingestPolicySetting?.value === 'Manual' ? 'Manual' : 'Always'

  if (!category) return null

  const getTierTotalSize = (tier: SpecTier): number => {
    return getAllResourcesForTier(tier).reduce((acc, r) => acc + r.size_mb * 1024 * 1024, 0)
  }

  const handleTierClick = (tier: SpecTier) => {
    // Toggle selection: if clicking the same tier, deselect it
    if (localSelectedSlug === tier.slug) {
      setLocalSelectedSlug(null)
    } else {
      setLocalSelectedSlug(tier.slug)
    }
  }

  /**
   * Runs the original onSelectTier-then-onClose flow. Pulled out of
   * handleSubmit so the guardrail modal's confirm path can call it after
   * the user has consented to the large operation.
   */
  const finalizeSubmit = async () => {
    if (!localSelectedSlug || !category) return
    const selectedTier = category.tiers.find((t) => t.slug === localSelectedSlug)
    if (selectedTier) {
      const chosenDisk = targetDisk || storageOverview?.preferredDownloadDisk || storageOverview?.storageRoot
      if (chosenDisk && chosenDisk !== storageOverview?.storageRoot) {
        try {
          await axios.post('/api/system/storage/move', {
            sourcePath: `${storageOverview?.storageRoot || '/storage'}/zim`,
            targetDiskPath: chosenDisk,
            createSymlink: true,
          })
        } catch (e) {
          console.warn('Could not map storage to selected disk before tier download', e)
        }
      }
      onSelectTier(category, selectedTier)
    }
    onClose()
  }

  const handleSubmit = () => {
    if (!localSelectedSlug || !category) return

    // Guardrail only runs when we have an estimate AND the global policy
    // would auto-index this batch. Under Manual the user has already opted
    // out of automatic ingestion, so the bulk-disk warning would be a false
    // alarm — the files would just queue as pending_decision.
    if (ingestPolicy === 'Always' && embedEstimate) {
      const verdict = evaluateGuardrail({
        estimateBytes: embedEstimate.totalBytes,
        freeBytes,
      })
      if (verdict.trips) {
        setGuardrailVerdict(verdict)
        return
      }
    }

    finalizeSubmit()
  }

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-surface-primary shadow-xl transition-all">
                {/* Header */}
                <div className="bg-desert-green px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DynamicIcon
                        icon={category.icon as DynamicIconName}
                        className="w-8 h-8 text-white mr-3"
                      />
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-white">
                          {category.name}
                        </Dialog.Title>
                        <p className="text-sm text-text-muted">{category.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <IconX size={24} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-text-secondary mb-6">
                    Selecione um nível com base na sua capacidade de armazenamento e necessidades. Os níveis superiores incluem todo o conteúdo dos níveis anteriores.
                  </p>

                  <div className="space-y-4">
                    {category.tiers.map((tier) => {
                      const totalSize = getTierTotalSize(tier)
                      const isSelected = localSelectedSlug === tier.slug
                      const includedTierName = tier.includesTier
                        ? category.tiers.find(t => t.slug === tier.includesTier)?.name
                        : null
                      // Only show this tier's own resources (not inherited)
                      const ownResources = tier.resources
                      const ownResourceCount = ownResources.length

                      return (
                        <div
                          key={tier.slug}
                          onClick={() => handleTierClick(tier)}
                          className={classNames(
                            'border-2 rounded-lg p-5 cursor-pointer transition-all',
                            isSelected
                              ? 'border-desert-green bg-desert-green/5 shadow-md'
                              : 'border-border-subtle hover:border-desert-green/50 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-text-primary">
                                  {tier.name}
                                </h3>
                                {includedTierName && (
                                  <span className="text-xs text-text-muted">
                                    (inclui {includedTierName})
                                  </span>
                                )}
                              </div>
                              <p className="text-text-secondary text-sm mb-3">{tier.description}</p>

                              {/* Resources preview - only show this tier's own resources */}
                              <div className="bg-surface-secondary rounded p-3">
                                <p className="text-xs text-text-muted mb-2 font-medium">
                                  {includedTierName ? (
                                    <>
                                      {ownResourceCount} {ownResourceCount === 1 ? 'recurso adicional' : 'recursos adicionais'}
                                      <span className="text-text-muted"> (mais tudo de {includedTierName})</span>
                                    </>
                                  ) : (
                                    <>{ownResourceCount} {ownResourceCount === 1 ? 'recurso incluído' : 'recursos incluídos'}</>
                                  )}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {ownResources.map((resource, idx) => {
                                    const translatedTitle = RESOURCE_TITLE_TRANSLATIONS[resource.title] || resource.title
                                    return (
                                      <div key={idx} className="flex items-start text-sm">
                                        <IconCheck size={14} className="text-desert-green mr-1.5 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <span className="text-text-primary">{translatedTitle}</span>
                                          <span className="text-text-muted text-xs ml-1">
                                            ({formatBytes(resource.size_mb * 1024 * 1024, 0)})
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="ml-4 text-right flex-shrink-0">
                              <div className="text-lg font-semibold text-text-primary">
                                {formatBytes(totalSize, 1)}
                              </div>
                              <div className={classNames(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center mt-2 ml-auto',
                                isSelected
                                  ? 'border-desert-green bg-desert-green'
                                  : 'border-border-default'
                              )}>
                                {isSelected && <IconCheck size={16} className="text-white" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Embedding-cost preview — visible whenever a tier is
                      selected. The estimate uses #891's ratio registry to
                      project how much extra disk space the AI Assistant will
                      need for these files on top of the raw downloads. */}
                  {localSelectedSlug && embedEstimate && embedEstimate.totalBytes > 0 && (
                    <div className="mt-4 bg-surface-secondary border border-border-subtle rounded p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <DynamicIcon icon="IconBrain" className="w-5 h-5 text-desert-green flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-text-primary">
                            <span className="font-medium">+~{formatBytes(embedEstimate.totalBytes, 1)}</span>
                            {' '}de armazenamento adicional se estes arquivos forem indexados para o Assistente de IA
                            {embedEstimate.hasUnknown && (
                              <span className="text-text-muted"> (estimativa exclui arquivos sem dados prévios)</span>
                            )}
                            .
                          </p>
                          <p className="text-text-muted text-xs mt-1">
                            {ingestPolicy === 'Always' ? (
                              <>
                                Sua configuração de <strong>Auto-indexação</strong> está em <strong>Sempre</strong>, portanto estes arquivos serão indexados automaticamente após o download.
                              </>
                            ) : (
                              <>
                                Sua configuração de <strong>Auto-indexação</strong> está em <strong>Manual</strong>, portanto estes arquivos permanecerão sem indexar até que você os ative nas configurações da Base de Conhecimento.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seletor de HD de Destino */}
                  {availableDisks.length > 0 && (
                    <div className="mt-4 p-3.5 bg-surface-secondary border border-border-default rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
                          <span>💾 Salvar coleção no disco:</span>
                        </span>
                        <span className="text-[11px] text-text-secondary">Destino de gravação ZIM</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableDisks.map((disk) => {
                          const isChosen = (targetDisk || storageOverview?.preferredDownloadDisk || storageOverview?.storageRoot) === disk.path
                          return (
                            <div
                              key={`tier-disk-${disk.path}`}
                              onClick={() => setTargetDisk(disk.path)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isChosen
                                  ? 'border-desert-green bg-desert-green/10 font-bold'
                                  : 'border-border-subtle bg-surface-primary hover:border-desert-tan'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="text-text-primary truncate">{disk.label}</div>
                                <div className="text-[10px] font-mono text-text-secondary truncate">
                                  {disk.path} • Livre: {formatBytes(disk.freeBytes, 1)}
                                </div>
                              </div>
                              {isChosen && <IconCheck size={16} className="text-desert-green shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info note */}
                  <div className="mt-4 flex items-start gap-2 text-sm text-text-muted bg-blue-50 p-3 rounded">
                    <IconInfoCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p>
                      Você pode alterar sua seleção a qualquer momento. Clique em Confirmar Seleção para aplicar.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-surface-secondary px-6 py-4 flex justify-end gap-3">
                  <StyledButton
                    variant='primary'
                    size='lg'
                    onClick={handleSubmit}
                    disabled={!localSelectedSlug || (embedEstimateRequest.length > 0 && isEstimating)}
                  >
                    Confirmar Seleção
                  </StyledButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    {guardrailVerdict && (
      <KbGuardrailModal
        isOpen={true}
        verdict={guardrailVerdict}
        onConfirm={() => {
          setGuardrailVerdict(null)
          finalizeSubmit()
        }}
        onCancel={() => setGuardrailVerdict(null)}
      />
    )}
    </>
  )
}

export default TierSelectionModal
