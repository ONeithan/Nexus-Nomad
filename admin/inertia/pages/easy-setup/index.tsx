import { Head, router, usePage } from '@inertiajs/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useMemo } from 'react'
import AppLayout from '~/layouts/AppLayout'
import StyledButton from '~/components/StyledButton'
import api from '~/lib/api'
import { ServiceSlim } from '../../../types/services'
import CuratedCollectionCard from '~/components/CuratedCollectionCard'
import CategoryCard from '~/components/CategoryCard'
import CreatorPackCard from '~/components/CreatorPackCard'
import TierSelectionModal from '~/components/TierSelectionModal'
import WikipediaSelector from '~/components/WikipediaSelector'
import LoadingSpinner from '~/components/LoadingSpinner'
import Alert from '~/components/Alert'
import { IconCheck, IconCpu, IconBooks } from '@tabler/icons-react'
import StorageProjectionBar from '~/components/StorageProjectionBar'
import { useNotifications } from '~/context/NotificationContext'
import useInternetStatus from '~/hooks/useInternetStatus'
import useCreatorPacks from '~/hooks/useCreatorPacks'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import classNames from 'classnames'
import type { CategoryWithStatus, SpecTier, SpecResource } from '../../../types/collections'
import { resolveTierResources } from '~/lib/collections'
import { SERVICE_NAMES } from '../../../constants/service_names'

// Capability definitions - maps user-friendly categories to services
interface Capability {
  id: string
  name: string
  technicalName: string
  description: string
  features: string[]
  services: string[] // service_name values that this capability installs
  icon: string
}

function buildCoreCapabilities(aiAssistantName: string): Capability[] {
  return [
    {
      id: 'information',
      name: 'Biblioteca Offline',
      technicalName: 'Kiwix',
      description:
        'Acesso offline à Wikipédia, referências médicas, guias práticos e enciclopédias',
      features: [
        'Wikipédia completa offline',
        'Referências médicas e guias de primeiros socorros',
        'Guias de reparo faça-você-mesmo e conteúdos práticos',
        'Livros e literatura do Projeto Gutenberg',
      ],
      services: [SERVICE_NAMES.KIWIX],
      icon: 'IconBooks',
    },
    {
      id: 'education',
      name: 'Plataforma Educacional',
      technicalName: 'Kolibri',
      description: 'Plataforma interativa de aprendizado com cursos em vídeo e exercícios',
      features: [
        'Cursos de matemática e ciências da Khan Academy',
        'Conteúdo curricular do ensino fundamental e médio',
        'Exercícios interativos e questionários',
        'Acompanhamento de progresso para estudantes',
      ],
      services: [SERVICE_NAMES.KOLIBRI_GEN2],
      icon: 'IconSchool',
    },
    {
      id: 'ai',
      name: aiAssistantName,
      technicalName: 'Ollama',
      description: 'Chat de IA local que roda inteiramente no seu hardware — sem precisar de internet',
      features: [
        'Conversas privadas que nunca saem do seu dispositivo',
        'Sem necessidade de conexão com a internet após a configuração',
        'Tire dúvidas, receba ajuda com textos e desenvolva ideias',
        'Roda no seu próprio hardware com modelos de IA locais',
      ],
      services: [SERVICE_NAMES.OLLAMA],
      icon: 'IconRobot',
    },
  ]
}

// Additional tools (Notes, Data Tools, and the rest of the catalog) are no
// longer surfaced in onboarding — they live in Supply Depot, where the full
// app catalog is browsable any time. Step 1 keeps the focus on the three core
// capabilities and points users to Supply Depot for everything else.

// Stable step IDs. Creator Packs (4) and AI (5) are BOTH optional, so the set of
// active steps is computed at runtime (see `activeSteps`) and navigation walks
// that ordered list rather than doing hardcoded skip math.
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Aplicativos',
  2: 'Mapas',
  3: 'Conteúdo',
  4: 'Pacotes de Criadores',
  5: 'IA',
  6: 'Revisão',
}

const CURATED_MAP_COLLECTIONS_KEY = 'curated-map-collections'
const CURATED_CATEGORIES_KEY = 'curated-categories'
const WIKIPEDIA_STATE_KEY = 'wikipedia-state'

export default function EasySetupWizard(props: {
  system: { services: ServiceSlim[]; remoteOllamaUrl: string }
}) {
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const resolvedAiName =
    !aiAssistantName || aiAssistantName === 'AI Assistant' ? 'Assistente de IA' : aiAssistantName
  const CORE_CAPABILITIES = buildCoreCapabilities(resolvedAiName)

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedMapCollections, setSelectedMapCollections] = useState<string[]>([])
  const [selectedCreatorPacks, setSelectedCreatorPacks] = useState<string[]>([])
  const [selectedAiModels, setSelectedAiModels] = useState<string[]>([])
  // Auto-index policy for the AI Assistant Knowledge Base. Defaults to
  // 'Manual' ("Ask me first"): auto-indexing has real cost and resource
  // implications a non-technical user won't anticipate from the toggle alone,
  // so we default to the safe choice and let them opt in. Persisted to
  // KVStore['rag.defaultIngestPolicy'] on wizard submit (same key #894's KB
  // modal toggle reads/writes) so the JIT prompt at first chat sees a decided
  // policy and doesn't ask again.
  const [ingestPolicy, setIngestPolicy] = useState<'Always' | 'Manual'>('Manual')
  const [isProcessing, setIsProcessing] = useState(false)
  const [remoteOllamaEnabled, setRemoteOllamaEnabled] = useState(
    () => !!props.system.remoteOllamaUrl
  )
  const [remoteOllamaUrl, setRemoteOllamaUrl] = useState(() => props.system.remoteOllamaUrl ?? '')
  const [remoteOllamaUrlError, setRemoteOllamaUrlError] = useState<string | null>(null)

  // Category/tier selection state
  const [selectedTiers, setSelectedTiers] = useState<Map<string, SpecTier>>(new Map())
  const [tierModalOpen, setTierModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryWithStatus | null>(null)

  // Wikipedia selection state
  const [selectedWikipedia, setSelectedWikipedia] = useState<string | null>(null)

  const { addNotification } = useNotifications()
  const { isOnline } = useInternetStatus()
  const queryClient = useQueryClient()
  const { data: systemInfo } = useSystemInfo({ enabled: true })
  // Creator Packs are hidden entirely on builds without the release-injected key.
  const { configured: creatorPacksConfigured, packs: creatorPacks } = useCreatorPacks()

  const anySelectionMade =
    selectedServices.length > 0 ||
    selectedMapCollections.length > 0 ||
    selectedCreatorPacks.length > 0 ||
    selectedTiers.size > 0 ||
    selectedAiModels.length > 0 ||
    (selectedWikipedia !== null && selectedWikipedia !== 'none')

  const { data: mapCollections, isLoading: isLoadingMaps } = useQuery({
    queryKey: [CURATED_MAP_COLLECTIONS_KEY],
    queryFn: () => api.listCuratedMapCollections(),
    refetchOnWindowFocus: false,
  })

  // Fetch curated categories with tiers
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: [CURATED_CATEGORIES_KEY],
    queryFn: () => api.listCuratedCategories(),
    refetchOnWindowFocus: false,
  })

  const { data: recommendedModels, isLoading: isLoadingRecommendedModels } = useQuery({
    queryKey: ['recommended-ollama-models'],
    queryFn: async () => {
      const res = await api.getAvailableModels({ recommendedOnly: true })
      if (!res) {
        return []
      }
      return res.models
    },
    refetchOnWindowFocus: false,
  })

  // Fetch Wikipedia options and current state
  const { data: wikipediaState, isLoading: isLoadingWikipedia } = useQuery({
    queryKey: [WIKIPEDIA_STATE_KEY],
    queryFn: () => api.getWikipediaState(),
    refetchOnWindowFocus: false,
  })

  // All services for display purposes
  const allServices = props.system.services

  const availableServices = props.system.services.filter(
    (service) => !service.installed && service.installation_status !== 'installing'
  )

  // Services that are already installed
  const installedServices = props.system.services.filter((service) => service.installed)

  // Canonical "is AI part of this user's setup?" predicate (RFC #883 / issue #905).
  // Single source consumed by step-indicator render, navigation skip logic, the
  // review summary, and handleFinish. The AI step renders if and only if this
  // is true; if false, the wizard collapses to 4 steps and the AI step is
  // skipped on both forward and back nav.
  const isAiInSetup = useMemo(
    () =>
      selectedServices.includes(SERVICE_NAMES.OLLAMA) ||
      installedServices.some((s) => s.service_name === SERVICE_NAMES.OLLAMA) ||
      remoteOllamaEnabled,
    [selectedServices, installedServices, remoteOllamaEnabled]
  )

  // Ordered list of the steps actually shown to THIS user. Creator Packs (4) and
  // AI (5) are both optional; everything else is fixed. Navigation walks this
  // list (see handleNext/handleBack), so a step's absence needs no skip math.
  const activeSteps = useMemo<WizardStep[]>(() => {
    const steps: WizardStep[] = [1, 2, 3]
    if (creatorPacksConfigured) steps.push(4)
    if (isAiInSetup) steps.push(5)
    steps.push(6)
    return steps
  }, [creatorPacksConfigured, isAiInSetup])

  const toggleMapCollection = (slug: string) => {
    setSelectedMapCollections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const toggleCreatorPack = (id: string) => {
    setSelectedCreatorPacks((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleAiModel = (modelName: string) => {
    setSelectedAiModels((prev) =>
      prev.includes(modelName) ? prev.filter((m) => m !== modelName) : [...prev, modelName]
    )
  }

  // Category/tier handlers
  const handleCategoryClick = (category: CategoryWithStatus) => {
    if (!isOnline) return
    setActiveCategory(category)
    setTierModalOpen(true)
  }

  const handleTierSelect = (category: CategoryWithStatus, tier: SpecTier) => {
    setSelectedTiers((prev) => {
      const newMap = new Map(prev)
      // If same tier is selected, deselect it
      if (prev.get(category.slug)?.slug === tier.slug) {
        newMap.delete(category.slug)
      } else {
        newMap.set(category.slug, tier)
      }
      return newMap
    })
  }

  const closeTierModal = () => {
    setTierModalOpen(false)
    setActiveCategory(null)
  }

  // Get all resources from selected tiers for storage projection
  const getSelectedTierResources = (): SpecResource[] => {
    if (!categories) return []
    const resources: SpecResource[] = []
    selectedTiers.forEach((tier, categorySlug) => {
      const category = categories.find((c) => c.slug === categorySlug)
      if (category) {
        resources.push(...resolveTierResources(tier, category.tiers))
      }
    })
    return resources
  }

  // Calculate total projected storage from all selections
  const projectedStorageBytes = useMemo(() => {
    let totalBytes = 0

    // Add tier resources
    const tierResources = getSelectedTierResources()
    totalBytes += tierResources.reduce((sum, r) => sum + (r.size_mb ?? 0) * 1024 * 1024, 0)

    // Add map collections
    if (mapCollections) {
      selectedMapCollections.forEach((slug) => {
        const collection = mapCollections.find((c) => c.slug === slug)
        if (collection) {
          totalBytes += collection.resources.reduce((sum, r) => sum + r.size_mb * 1024 * 1024, 0)
        }
      })
    }

    // Add creator packs
    selectedCreatorPacks.forEach((id) => {
      const pack = creatorPacks.find((p) => p.id === id)
      if (pack) {
        totalBytes += pack.size_mb * 1024 * 1024
      }
    })

    // Add AI models
    if (recommendedModels) {
      selectedAiModels.forEach((modelName) => {
        const model = recommendedModels.find((m) => m.name === modelName)
        if (model?.tags?.[0]?.size) {
          // Parse size string like "4.7GB" or "1.5GB"
          const sizeStr = model.tags[0].size
          const match = sizeStr.match(/^([\d.]+)\s*(GB|MB|KB)?$/i)
          if (match) {
            const value = parseFloat(match[1])
            const unit = (match[2] || 'GB').toUpperCase()
            if (unit === 'GB') {
              totalBytes += value * 1024 * 1024 * 1024
            } else if (unit === 'MB') {
              totalBytes += value * 1024 * 1024
            } else if (unit === 'KB') {
              totalBytes += value * 1024
            }
          }
        }
      })
    }

    // Add Wikipedia selection
    if (selectedWikipedia && wikipediaState) {
      const option = wikipediaState.options.find((o) => o.id === selectedWikipedia)
      if (option && option.size_mb > 0) {
        totalBytes += option.size_mb * 1024 * 1024
      }
    }

    return totalBytes
  }, [
    selectedTiers,
    selectedMapCollections,
    selectedCreatorPacks,
    selectedAiModels,
    selectedWikipedia,
    categories,
    mapCollections,
    creatorPacks,
    recommendedModels,
    wikipediaState,
  ])

  // Get primary disk/filesystem info for storage projection
  const storageInfo = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)

  // The review step is always the last active step. Read by canProceedToNextStep
  // and the bottom-bar Next-vs-Finish switch.
  const finalStep: WizardStep = activeSteps[activeSteps.length - 1]

  const canProceedToNextStep = () => {
    if (!isOnline) return false // Must be online to proceed
    // Every step before the review is skippable; the review step shows Finish, not Next.
    return currentStep < finalStep
  }

  // Navigate to the next/previous ACTIVE step relative to the current one. Using
  // a value comparison (not indexOf) keeps nav correct even if currentStep goes
  // momentarily stale — e.g. the user disables AI while standing on the AI step,
  // dropping it from activeSteps; the next click still lands on the right step.
  const handleNext = () => {
    const next = activeSteps.find((s) => s > currentStep)
    if (next !== undefined) setCurrentStep(next)
  }

  const handleBack = () => {
    const prev = [...activeSteps].reverse().find((s) => s < currentStep)
    if (prev !== undefined) setCurrentStep(prev)
  }

  const handleFinish = async () => {
    if (!isOnline) {
      addNotification({
        type: 'error',
        message: 'Você precisa de uma conexão com a internet para concluir a configuração.',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Persist the auto-index policy choice before kicking off downloads so
      // any content that finishes during this same wizard run sees the right
      // policy. Skipped when AI is not in the user's setup; the KV stays null
      // and the first-chat JIT prompt (#899) handles the decision later if/when
      // the user enables AI. Uses the canonical isAiInSetup predicate so step
      // 3 / step 4 / step 5 / handleFinish never disagree (issue #905).
      if (isAiInSetup) {
        try {
          await api.updateSetting('rag.defaultIngestPolicy', ingestPolicy)
        } catch (err) {
          // Non-fatal: the user can still set the policy from the KB modal.
          console.warn('Could not persist ingest policy from wizard:', err)
        }
      }

      // If using remote Ollama, configure it first before other installs
      if (remoteOllamaEnabled && remoteOllamaUrl) {
        const remoteResult = await api.configureRemoteOllama(remoteOllamaUrl)
        if (!remoteResult?.success) {
          const msg = (remoteResult as any)?.message || 'Falha ao configurar o Ollama remoto.'
          setRemoteOllamaUrlError(msg)
          setIsProcessing(false)
          setCurrentStep(1)
          return
        }
      }

      // All of these ops don't actually wait for completion, they just kick off the process, so we can run them in parallel without awaiting each one sequentially
      // Exclude Ollama from local install when using remote mode
      const servicesToInstall = remoteOllamaEnabled
        ? selectedServices.filter((s) => s !== SERVICE_NAMES.OLLAMA)
        : selectedServices
      const installPromises = servicesToInstall.map((serviceName) => api.installService(serviceName))

      await Promise.all(installPromises)

      // Download collections, category tiers, and AI models
      const categoryTierPromises: Promise<any>[] = []
      selectedTiers.forEach((tier, categorySlug) => {
        categoryTierPromises.push(api.downloadCategoryTier(categorySlug, tier.slug))
      })

      const downloadPromises = [
        ...selectedMapCollections.map((slug) => api.downloadMapCollection(slug)),
        ...categoryTierPromises,
        ...selectedCreatorPacks.map((id) => api.installCreatorPack(id)),
        ...selectedAiModels.map((modelName) => api.downloadModel(modelName)),
      ]

      await Promise.all(downloadPromises)

      // Select Wikipedia option if one was chosen
      if (selectedWikipedia && selectedWikipedia !== wikipediaState?.currentSelection?.optionId) {
        await api.selectWikipedia(selectedWikipedia)
      }

      addNotification({
        type: 'success',
        message: 'Assistente de configuração concluído! Suas seleções estão sendo processadas.',
      })

      router.visit('/easy-setup/complete')
    } catch (error) {
      console.error('Error during setup:', error)
      addNotification({
        type: 'error',
        message: 'Ocorreu um erro durante a configuração. Alguns itens podem não ter sido processados.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const refreshManifests = useMutation({
    mutationFn: () => api.refreshManifests(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CURATED_MAP_COLLECTIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [CURATED_CATEGORIES_KEY] })
    },
  })

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  // Refresh manifests on mount to ensure we have latest data
  useEffect(() => {
    if (!refreshManifests.isPending) {
      refreshManifests.mutate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set Easy Setup as visited when user lands on this page
  useEffect(() => {
    const markAsVisited = async () => {
      try {
        await api.updateSetting('ui.hasVisitedEasySetup', 'true')
      } catch (error) {
        // Silent fail - this is non-critical
        console.warn('Failed to mark Easy Setup as visited:', error)
      }
    }

    markAsVisited()
  }, [])

  const renderStepIndicator = () => {
    // `step` is the stable WizardStep value (1=Apps, 2=Maps, 3=Content,
    // 4=Creator Packs, 5=AI, 6=Review). Only the ACTIVE steps are shown, and
    // `displayNumber` is the sequential position in the dot (always 1..N) so
    // there's no gap when Creator Packs and/or AI are absent.
    const steps = activeSteps.map((step, idx) => ({
      step,
      label: STEP_LABELS[step],
      displayNumber: idx + 1,
    }))

    return (
      <nav aria-label="Progresso" className="px-6 pt-6">
        <ol
          role="list"
          className="divide-y divide-border-default rounded-md md:flex md:divide-y-0 md:justify-between border border-desert-green"
        >
          {steps.map((step, stepIdx) => (
            <li key={step.step} className="relative md:flex-1 md:flex md:justify-center">
              {currentStep > step.step ? (
                <div className="group flex w-full items-center md:justify-center">
                  <span className="flex items-center px-6 py-2 text-sm font-medium">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-desert-green">
                      <IconCheck aria-hidden="true" className="size-6 text-white" />
                    </span>
                    <span className="ml-4 text-lg font-medium text-text-primary">{step.label}</span>
                  </span>
                </div>
              ) : currentStep === step.step ? (
                <div
                  aria-current="step"
                  className="flex items-center px-6 py-2 text-sm font-medium md:justify-center"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-desert-green border-2 border-desert-green">
                    <span className="text-white">{step.displayNumber}</span>
                  </span>
                  <span className="ml-4 text-lg font-medium text-desert-green">{step.label}</span>
                </div>
              ) : (
                <div className="group flex items-center md:justify-center">
                  <span className="flex items-center px-6 py-2 text-sm font-medium">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border-default">
                      <span className="text-text-muted">{step.displayNumber}</span>
                    </span>
                    <span className="ml-4 text-lg font-medium text-text-muted">{step.label}</span>
                  </span>
                </div>
              )}

              {stepIdx !== steps.length - 1 ? (
                <>
                  {/* Arrow separator for lg screens and up */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-0 hidden h-full w-5 md:block"
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 22 80"
                      preserveAspectRatio="none"
                      className={`size-full ${currentStep > step.step ? 'text-desert-green' : 'text-text-muted'}`}
                    >
                      <path
                        d="M0 -2L20 40L0 82"
                        stroke="currentcolor"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  // Check if a capability is selected (all its services are in selectedServices)
  const isCapabilitySelected = (capability: Capability) => {
    return capability.services.every((service) => selectedServices.includes(service))
  }

  // Check if a capability is already installed (all its services are installed)
  const isCapabilityInstalled = (capability: Capability) => {
    return capability.services.every((service) =>
      installedServices.some((s) => s.service_name === service)
    )
  }

  // Check if a capability exists in the system (has at least one matching service)
  const capabilityExists = (capability: Capability) => {
    return capability.services.some((service) =>
      allServices.some((s) => s.service_name === service)
    )
  }

  // Toggle all services for a capability (only if not already installed)
  const toggleCapability = (capability: Capability) => {
    // Don't allow toggling installed capabilities
    if (isCapabilityInstalled(capability)) return

    const isSelected = isCapabilitySelected(capability)

    // Toggling AI off needs to clear dependent state that lives in the AI
    // step (model picks, ingest policy, remote Ollama config). If the user
    // has any of that filled in, confirm before discarding so a stray click
    // doesn't quietly wipe their setup.
    if (capability.id === 'ai' && isSelected) {
      const hasAiSelections =
        selectedAiModels.length > 0 ||
        ingestPolicy !== 'Manual' ||
        remoteOllamaEnabled
      if (hasAiSelections) {
        const confirmed = window.confirm(
          'Desativar a IA descartará suas escolhas de modelos de IA, política de indexação e configuração do Ollama remoto. Continuar?'
        )
        if (!confirmed) return
      }
      setSelectedAiModels([])
      setIngestPolicy('Manual')
      setRemoteOllamaEnabled(false)
      setRemoteOllamaUrl('')
      setRemoteOllamaUrlError(null)
    }

    if (isSelected) {
      // Deselect all services in this capability
      setSelectedServices((prev) => prev.filter((s) => !capability.services.includes(s)))
    } else {
      // Select all available services in this capability
      const servicesToAdd = capability.services.filter((service) =>
        availableServices.some((s) => s.service_name === service)
      )
      setSelectedServices((prev) => [...new Set([...prev, ...servicesToAdd])])
    }
  }

  const renderCapabilityCard = (capability: Capability, isCore: boolean = true) => {
    const selected = isCapabilitySelected(capability)
    const installed = isCapabilityInstalled(capability)
    const exists = capabilityExists(capability)

    if (!exists) return null

    // Determine visual state: installed (locked), selected (user chose it), or default
    const isChecked = installed || selected

    return (
      <div
        key={capability.id}
        onClick={() => toggleCapability(capability)}
        className={classNames(
          'p-6 rounded-lg border-2 transition-all',
          installed
            ? 'border-desert-green bg-desert-green/20 cursor-default'
            : selected
              ? 'border-desert-green bg-desert-green shadow-md cursor-pointer'
              : 'border-desert-stone-light bg-surface-primary hover:border-desert-green hover:shadow-sm cursor-pointer'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={classNames(
                  'text-xl font-bold',
                  installed ? 'text-text-primary' : selected ? 'text-white' : 'text-text-primary'
                )}
              >
                {capability.name}
              </h3>
              {installed && (
                <span className="text-xs bg-desert-green text-white px-2 py-0.5 rounded-full">
                  Instalado
                </span>
              )}
            </div>
            <p
              className={classNames(
                'text-sm mt-0.5',
                installed ? 'text-text-muted' : selected ? 'text-green-100' : 'text-text-muted'
              )}
            >
              Desenvolvido com {capability.technicalName}
            </p>
            <p
              className={classNames(
                'text-sm mt-3',
                installed ? 'text-text-secondary' : selected ? 'text-white' : 'text-text-secondary'
              )}
            >
              {capability.description}
            </p>
            {isCore && (
              <ul
                className={classNames(
                  'mt-3 space-y-1',
                  installed ? 'text-text-secondary' : selected ? 'text-white' : 'text-text-secondary'
                )}
              >
                {capability.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <span
                      className={classNames(
                        'mr-2',
                        installed
                          ? 'text-desert-green'
                          : selected
                            ? 'text-white'
                            : 'text-desert-green'
                      )}
                    >
                      •
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            className={classNames(
              'ml-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
              isChecked
                ? installed
                  ? 'border-desert-green bg-desert-green'
                  : 'border-white bg-white'
                : 'border-desert-stone'
            )}
          >
            {isChecked && (
              <IconCheck size={20} className={installed ? 'text-white' : 'text-desert-green'} />
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStep1 = () => {
    // Show all capabilities that exist in the system (including installed ones)
    const existingCoreCapabilities = CORE_CAPABILITIES.filter(capabilityExists)

    // Check if ALL core capabilities are already installed (nothing left to install)
    const allInstalled =
      existingCoreCapabilities.length > 0 &&
      existingCoreCapabilities.every(isCapabilityInstalled)

    return (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">O que você quer que o NOMAD faça?</h2>
          <p className="text-text-secondary">
            Selecione as capacidades de que você precisa. Você sempre pode adicionar mais depois.
          </p>
        </div>

        {allInstalled ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">
              Todas as capacidades disponíveis já estão instaladas!
            </p>
            <StyledButton
              variant="primary"
              className="mt-4"
              onClick={() => router.visit('/settings/apps')}
            >
              Gerenciar Aplicativos
            </StyledButton>
          </div>
        ) : (
          <>
            {/* Core Capabilities */}
            {existingCoreCapabilities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Capacidades Principais</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {existingCoreCapabilities.map((capability) => {
                    if (capability.id === 'ai') {
                      const isAiSelected = isCapabilitySelected(capability)
                      return (
                        <div key={capability.id}>
                          {renderCapabilityCard(capability, true)}
                          {isAiSelected && !isCapabilityInstalled(capability) && (
                            <div
                              className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={remoteOllamaEnabled}
                                  onChange={(e) => {
                                    setRemoteOllamaEnabled(e.target.checked)
                                    setRemoteOllamaUrlError(null)
                                  }}
                                  className="w-4 h-4 accent-desert-green"
                                />
                                <span className="text-sm font-medium text-gray-700">Usar instância remota do Ollama</span>
                              </label>
                              {remoteOllamaEnabled && (
                                <div className="mt-3">
                                  <input
                                    type="text"
                                    value={remoteOllamaUrl}
                                    onChange={(e) => {
                                      setRemoteOllamaUrl(e.target.value)
                                      setRemoteOllamaUrlError(null)
                                    }}
                                    placeholder="http://192.168.1.100:11434"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-desert-green"
                                  />
                                  {remoteOllamaUrlError && (
                                    <p className="mt-1 text-xs text-red-600">{remoteOllamaUrlError}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }
                    return renderCapabilityCard(capability, true)
                  })}
                </div>
              </div>
            )}

            {/* Everything beyond the core capabilities lives in Supply Depot,
                the browsable app catalog. Keep onboarding focused and point
                users there for Notes, Data Tools, and the rest. */}
            <div className="border-t border-desert-stone-light pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-surface-secondary p-4">
                <div>
                  <h3 className="text-md font-medium text-text-primary mb-1">
                    Procurando mais aplicativos?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Notas, ferramentas de dados e o catálogo completo de aplicativos extras estão
                    disponíveis a qualquer momento na Central de Aplicativos.
                  </p>
                </div>
                <StyledButton
                  variant="secondary"
                  onClick={() => router.visit('/supply-depot')}
                  className="flex-shrink-0"
                >
                  Abrir Central de Aplicativos
                </StyledButton>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Escolher Regiões de Mapa</h2>
        <p className="text-text-secondary">
          Selecione coleções de regiões de mapa para baixar para uso offline. Você sempre pode
          baixar mais regiões depois.
        </p>
      </div>
      <div className="mx-auto max-w-2xl rounded-lg border border-border-subtle bg-surface-secondary p-3 text-center">
        <p className="text-sm text-text-secondary">
          Precisa apenas de um país específico ou quer o mundo inteiro? Países individuais e um mapa
          global completo podem ser instalados a qualquer momento pelo{' '}
          <button
            type="button"
            onClick={() => router.visit('/settings/maps')}
            className="font-medium text-desert-green underline"
          >
            Gerenciador de Mapas
          </button>
          .
        </p>
      </div>
      {isLoadingMaps ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : mapCollections && mapCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapCollections.map((collection) => (
            <div
              key={collection.slug}
              onClick={() =>
                isOnline && !collection.all_installed && toggleMapCollection(collection.slug)
              }
              className={classNames(
                'relative',
                selectedMapCollections.includes(collection.slug) &&
                'ring-4 ring-desert-green rounded-lg',
                collection.all_installed && 'opacity-75',
                !isOnline && 'opacity-50 cursor-not-allowed'
              )}
            >
              <CuratedCollectionCard collection={collection} />
              {selectedMapCollections.includes(collection.slug) && (
                <div className="absolute top-2 right-2 bg-desert-green rounded-full p-1">
                  <IconCheck size={32} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">Nenhuma coleção de mapas disponível no momento.</p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => {
    // Issue #905: AI moved to its own conditional Step 4. Step 3 is now
    // content-only (Wikipedia + curated tiers), gated on the Information
    // capability (Kiwix).
    const isInformationSelected =
      selectedServices.includes(SERVICE_NAMES.KIWIX) ||
      installedServices.some((s) => s.service_name === SERVICE_NAMES.KIWIX)

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Escolher Conteúdo</h2>
          <p className="text-text-secondary">
            {isInformationSelected
              ? 'Selecione categorias de conteúdo para conhecimento offline.'
              : 'Configure o conteúdo para as capacidades selecionadas.'}
          </p>
        </div>

        {/* Wikipedia Selection - Only show if Information capability is selected */}
        {isInformationSelected && (
          <div className="mb-8">
            {isLoadingWikipedia ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : wikipediaState && wikipediaState.options.length > 0 ? (
              <WikipediaSelector
                options={wikipediaState.options}
                currentSelection={wikipediaState.currentSelection}
                selectedOptionId={selectedWikipedia}
                onSelect={(optionId) => isOnline && setSelectedWikipedia(optionId)}
                disabled={!isOnline}
              />
            ) : null}
          </div>
        )}

        {/* Curated Categories with Tiers - Only show if Information capability is selected */}
        {isInformationSelected && (
          <>
            {/* Divider between Wikipedia and Additional Content */}
            <hr className="my-8 border-border-subtle" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center shadow-sm">
                <IconBooks className="w-6 h-6 text-text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Conteúdo Adicional</h3>
                <p className="text-sm text-text-muted">Coleções curadas para consulta offline</p>
              </div>
            </div>

            {isLoadingCategories ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : categories && categories.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.slug}
                      category={category}
                      selectedTier={selectedTiers.get(category.slug) || null}
                      onClick={handleCategoryClick}
                    />
                  ))}
                </div>

                {/* Tier Selection Modal */}
                <TierSelectionModal
                  isOpen={tierModalOpen}
                  onClose={closeTierModal}
                  category={activeCategory}
                  selectedTierSlug={
                    activeCategory
                      ? selectedTiers.get(activeCategory.slug)?.slug || activeCategory.installedTierSlug
                      : null
                  }
                  onSelectTier={handleTierSelect}
                />
              </>
            ) : null}

          </>
        )}

        {/* Show message if no content-bearing capabilities are selected */}
        {!isInformationSelected && (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">
              Nenhuma capacidade baseada em conteúdo selecionada. Você pode pular esta etapa ou
              voltar para selecionar capacidades que utilizam conteúdo.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderCreatorPacks = () => {
    // Creator Packs step. Only present when this build is configured (see
    // activeSteps); a fork built without the key never reaches it. Selection is
    // by pack id, held in selectedCreatorPacks; installs fire in handleFinish.
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Pacotes de Criadores</h2>
          <p className="text-text-secondary">
            Coleções de vídeos de criadores de conteúdo, baixadas para visualização offline no Kiwix.
          </p>
        </div>

        {creatorPacks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {creatorPacks.map((pack) => (
              <CreatorPackCard
                key={pack.id}
                pack={pack}
                selected={selectedCreatorPacks.includes(pack.id)}
                onClick={
                  pack.status === 'installed' && !pack.available_update_version
                    ? undefined
                    : () => isOnline && toggleCreatorPack(pack.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">Nenhum pacote de criador disponível no momento.</p>
          </div>
        )}
      </div>
    )
  }

  const renderStep4 = () => {
    // AI step (issue #905). Only rendered when isAiInSetup is true; otherwise
    // the wizard's step array drops it and forward/back nav jumps Content → Review.
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Configurar {resolvedAiName}</h2>
          <p className="text-text-secondary">
            Escolha modelos para baixar e defina como o {resolvedAiName} lida com novos conteúdos.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center shadow-sm">
            <IconCpu className="w-6 h-6 text-text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text-primary">Modelos de IA</h3>
            <p className="text-sm text-text-muted">Selecione modelos para baixar para IA offline</p>
          </div>
        </div>
        {remoteOllamaEnabled && remoteOllamaUrl ? (
          <Alert
            title="Ollama remoto selecionado"
            message="Os modelos são gerenciados na máquina remota. Você pode adicionar modelos em Configurações > Assistente de IA após a configuração; observe que isso só é compatível ao usar o Ollama, e não o LM Studio ou outros softwares compatíveis com a API da OpenAI."
            type="info"
            variant="bordered"
          />
        ) : isLoadingRecommendedModels ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : recommendedModels && recommendedModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedModels.map((model) => (
              <div
                key={model.name}
                onClick={() => isOnline && toggleAiModel(model.name)}
                className={classNames(
                  'p-4 rounded-lg border-2 transition-all cursor-pointer',
                  selectedAiModels.includes(model.name)
                    ? 'border-desert-green bg-desert-green shadow-md'
                    : 'border-desert-stone-light bg-surface-primary hover:border-desert-green hover:shadow-sm',
                  !isOnline && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4
                      className={classNames(
                        'text-lg font-semibold mb-1',
                        selectedAiModels.includes(model.name) ? 'text-white' : 'text-text-primary'
                      )}
                    >
                      {model.name}
                    </h4>
                    <p
                      className={classNames(
                        'text-sm mb-2',
                        selectedAiModels.includes(model.name) ? 'text-white' : 'text-text-secondary'
                      )}
                    >
                      {model.description}
                    </p>
                    {model.tags?.[0]?.size && (
                      <div
                        className={classNames(
                          'text-xs',
                          selectedAiModels.includes(model.name)
                            ? 'text-green-100'
                            : 'text-text-muted'
                        )}
                      >
                        Tamanho: {model.tags[0].size}
                      </div>
                    )}
                    {model.tags?.[0]?.input.toLowerCase().includes('image') && (
                      <div
                        className={classNames(
                          'mt-1 text-xs font-medium',
                          selectedAiModels.includes(model.name)
                            ? 'text-green-100'
                            : 'text-desert-green'
                        )}
                      >
                        Suporta imagens
                      </div>
                    )}
                  </div>
                  <div
                    className={classNames(
                      'ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                      selectedAiModels.includes(model.name)
                        ? 'border-white bg-white'
                        : 'border-desert-stone'
                    )}
                  >
                    {selectedAiModels.includes(model.name) && (
                      <IconCheck size={16} className="text-desert-green" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-surface-secondary rounded-lg">
            <p className="text-text-secondary">Nenhum modelo de IA recomendado disponível no momento.</p>
          </div>
        )}

        {/* Auto-index policy — choose now so the JIT prompt at first chat
            doesn't ask again (RFC #883 Phase 3 task 13). Persisted to
            rag.defaultIngestPolicy on wizard submit. */}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <h4 className="text-lg font-semibold text-text-primary mb-1">
            Indexar automaticamente novos conteúdos para o {resolvedAiName}?
          </h4>
          <p className="text-sm text-text-muted mb-4">
            Quando você adicionar novos arquivos ZIM, documentos ou conteúdos curados, o {resolvedAiName} deve indexá-los automaticamente para poder pesquisá-los ao responder às suas perguntas?
          </p>
          <div className="inline-flex rounded-md border border-border-default overflow-hidden" role="group">
            <button
              type="button"
              onClick={() => setIngestPolicy('Always')}
              className={classNames(
                'px-5 py-2 text-sm font-medium transition-colors',
                ingestPolicy === 'Always'
                  ? 'bg-desert-green text-white'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
              )}
            >
              Sim, sempre
            </button>
            <button
              type="button"
              onClick={() => setIngestPolicy('Manual')}
              className={classNames(
                'px-5 py-2 text-sm font-medium transition-colors border-l border-border-default',
                ingestPolicy === 'Manual'
                  ? 'bg-desert-green text-white'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
              )}
            >
              Perguntar primeiro
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">
            Você pode alterar isso a qualquer momento no painel Base de Conhecimento dentro do Chat de IA.
          </p>
        </div>
      </div>
    )
  }

  const renderStep5 = () => {
    const hasSelections =
      selectedServices.length > 0 ||
      selectedMapCollections.length > 0 ||
      selectedCreatorPacks.length > 0 ||
      selectedTiers.size > 0 ||
      selectedAiModels.length > 0 ||
      (selectedWikipedia !== null && selectedWikipedia !== 'none')

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Revise Suas Seleções</h2>
          <p className="text-text-secondary">Revise suas escolhas antes de iniciar o processo de configuração.</p>
        </div>

        {!hasSelections ? (
          <Alert
            title="Nenhuma Seleção Feita"
            message="Você não selecionou nada para instalar ou baixar. Você pode voltar para fazer seleções ou retornar à página inicial."
            type="info"
            variant="bordered"
          />
        ) : (
          <div className="space-y-6">
            {selectedServices.length > 0 && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Capacidades para Instalar
                </h3>
                <ul className="space-y-2">
                  {CORE_CAPABILITIES.filter((cap) =>
                    cap.services.some((s) => selectedServices.includes(s))
                  ).map((capability) => (
                      <li key={capability.id} className="flex items-center">
                        <IconCheck size={20} className="text-desert-green mr-2" />
                        <span className="text-text-primary">
                          {capability.name}
                          <span className="text-text-muted text-sm ml-2">
                            ({capability.technicalName})
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {selectedMapCollections.length > 0 && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Coleções de Mapas para Baixar ({selectedMapCollections.length})
                </h3>
                <ul className="space-y-2">
                  {selectedMapCollections.map((slug) => {
                    const collection = mapCollections?.find((c) => c.slug === slug)
                    return (
                      <li key={slug} className="flex items-center">
                        <IconCheck size={20} className="text-desert-green mr-2" />
                        <span className="text-text-primary">{collection?.name || slug}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {selectedCreatorPacks.length > 0 && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Pacotes de Criadores para Instalar ({selectedCreatorPacks.length})
                </h3>
                <ul className="space-y-2">
                  {selectedCreatorPacks.map((id) => {
                    const pack = creatorPacks.find((p) => p.id === id)
                    return (
                      <li key={id} className="flex items-center">
                        <IconCheck size={20} className="text-desert-green mr-2" />
                        <span className="text-text-primary">{pack?.name || id}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {selectedTiers.size > 0 && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Categorias de Conteúdo ({selectedTiers.size})
                </h3>
                {Array.from(selectedTiers.entries()).map(([categorySlug, tier]) => {
                  const category = categories?.find((c) => c.slug === categorySlug)
                  if (!category) return null
                  const resources = resolveTierResources(tier, category.tiers)
                  return (
                    <div key={categorySlug} className="mb-4 last:mb-0">
                      <div className="flex items-center mb-2">
                        <IconCheck size={20} className="text-desert-green mr-2" />
                        <span className="text-text-primary font-medium">
                          {category.name} - {tier.name}
                        </span>
                        <span className="text-text-muted text-sm ml-2">
                          ({resources.length} {resources.length === 1 ? 'arquivo' : 'arquivos'})
                        </span>
                      </div>
                      <ul className="ml-7 space-y-1">
                        {resources.map((resource, idx) => (
                          <li key={idx} className="text-sm text-text-secondary">
                            {resource.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedWikipedia && selectedWikipedia !== 'none' && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Wikipédia</h3>
                {(() => {
                  const option = wikipediaState?.options.find((o) => o.id === selectedWikipedia)
                  return option ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <IconCheck size={20} className="text-desert-green mr-2" />
                        <span className="text-text-primary">{option.name}</span>
                      </div>
                      <span className="text-text-muted text-sm">
                        {option.size_mb > 0
                          ? `${(option.size_mb / 1024).toFixed(1)} GB`
                          : 'Sem download'}
                      </span>
                    </div>
                  ) : null
                })()}
              </div>
            )}

            {selectedAiModels.length > 0 && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Modelos de IA para Baixar ({selectedAiModels.length})
                </h3>
                <ul className="space-y-2">
                  {selectedAiModels.map((modelName) => {
                    const model = recommendedModels?.find((m) => m.name === modelName)
                    return (
                      <li key={modelName} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconCheck size={20} className="text-desert-green mr-2" />
                          <span className="text-text-primary">{modelName}</span>
                        </div>
                        {model?.tags?.[0]?.size && (
                          <span className="text-text-muted text-sm">{model.tags[0].size}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {isAiInSetup && (
              <div className="bg-surface-primary rounded-lg border-2 border-desert-stone-light p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Configuração de Indexação Automática
                </h3>
                <p className="text-text-secondary text-sm">
                  {ingestPolicy === 'Always' ? (
                    <>
                      Novos conteúdos serão <strong>indexados automaticamente</strong> assim que chegarem para que o {resolvedAiName} possa pesquisá-los.
                    </>
                  ) : (
                    <>
                      Novos conteúdos <strong>aguardarão sua confirmação</strong> no painel Base de Conhecimento antes que o {resolvedAiName} os indexe.
                    </>
                  )}
                </p>
              </div>
            )}

            <Alert
              title="Pronto para Começar"
              message="Clique em 'Concluir Configuração' para começar a instalar aplicativos e baixar conteúdos. Isso pode levar algum tempo dependendo da sua conexão com a internet e do tamanho dos downloads."
              type="info"
              variant="solid"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <AppLayout>
      <Head title="Assistente de Configuração Rápida" />
      {!isOnline && (
        <Alert
          title="Sem Conexão com a Internet"
          message="Você precisará de uma conexão com a internet para prosseguir. Conecte-se à internet e tente novamente."
          type="warning"
          variant="solid"
          className="mb-8"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-surface-primary rounded-md shadow-md">
          {renderStepIndicator()}
          {storageInfo && (
            <div className="px-6 pt-4">
              <StorageProjectionBar
                totalSize={storageInfo.totalSize}
                currentUsed={storageInfo.totalUsed}
                projectedAddition={projectedStorageBytes}
              />
            </div>
          )}
          <div className="p-6 min-h-fit">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && creatorPacksConfigured && renderCreatorPacks()}
            {currentStep === 5 && isAiInSetup && renderStep4()}
            {currentStep === 6 && renderStep5()}

            <div className="flex justify-between mt-8 pt-4 border-t border-desert-stone-light">
              <div className="flex space-x-4 items-center">
                {currentStep > 1 && (
                  <StyledButton
                    onClick={handleBack}
                    disabled={isProcessing}
                    variant="outline"
                    icon="IconChevronLeft"
                  >
                    Voltar
                  </StyledButton>
                )}

                <p className="text-sm text-text-secondary">
                  {(() => {
                    const count = CORE_CAPABILITIES.filter((cap) =>
                      cap.services.some((s) => selectedServices.includes(s))
                    ).length
                    return `${count} ${count === 1 ? 'capacidade' : 'capacidades'}`
                  })()}
                  , {selectedMapCollections.length}{' '}
                  {selectedMapCollections.length === 1 ? 'região de mapa' : 'regiões de mapa'},{' '}
                  {selectedTiers.size}{' '}
                  {selectedTiers.size === 1 ? 'categoria de conteúdo' : 'categorias de conteúdo'},{' '}
                  {creatorPacksConfigured && (
                    <>
                      {selectedCreatorPacks.length}{' '}
                      {selectedCreatorPacks.length === 1
                        ? 'pacote de criador'
                        : 'pacotes de criadores'}
                      ,{' '}
                    </>
                  )}
                  {selectedAiModels.length}{' '}
                  {selectedAiModels.length === 1
                    ? 'modelo de IA selecionado'
                    : 'modelos de IA selecionados'}
                </p>
              </div>

              <div className="flex space-x-4">
                <StyledButton
                  onClick={() => router.visit('/home')}
                  disabled={isProcessing}
                  variant="outline"
                >
                  Cancelar e Ir ao Início
                </StyledButton>

                {currentStep < finalStep ? (
                  <StyledButton
                    onClick={handleNext}
                    disabled={!canProceedToNextStep() || isProcessing}
                    variant="primary"
                    icon="IconChevronRight"
                  >
                    Próximo
                  </StyledButton>
                ) : (
                  <StyledButton
                    onClick={handleFinish}
                    disabled={isProcessing || !isOnline || !anySelectionMade}
                    loading={isProcessing}
                    variant="success"
                    icon="IconCheck"
                  >
                    Concluir Configuração
                  </StyledButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
