import {
  IconBolt,
  IconBox,
  IconHelp,
  IconMapRoute,
  IconPalette,
  IconPill,
  IconSettings,
  IconWifiOff,
  IconPlus,
  IconPencil,
  IconTrash,
  IconExternalLink,
  IconArrowUpRight,
  IconSearch,
  IconAdjustments,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
  IconX,
  IconStar,
  IconStarFilled,
  IconLayoutGrid,
  IconLayoutList,
  IconBook,
  IconCpu,
  IconServer,
  IconDatabase,
  IconCompass,
  IconBrain,
  IconDownload,
  IconCheck,
  IconArrowRight,
  IconActivity,
  IconGauge,
} from '@tabler/icons-react'
import axios from 'axios'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '~/layouts/AppLayout'
import AppCatalogModal from '~/components/AppCatalogModal'
import { formatBytes } from '~/lib/util'
import { getServiceLink } from '~/lib/navigation'
import { ServiceSlim } from '../../types/services'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import { useUpdateAvailable } from '~/hooks/useUpdateAvailable'
import { useSystemSetting } from '~/hooks/useSystemSetting'
import {
  useBenchmarkRerunBanner,
  BENCHMARK_RERUN_BANNER_QUERY_KEY,
} from '~/hooks/useBenchmarkRerunBanner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useDownloads from '~/hooks/useDownloads'
import api from '~/lib/api'
import Alert from '~/components/Alert'
import WhatsNewBanner from '~/components/WhatsNewBanner'
import { SERVICE_NAMES } from '../../constants/service_names'
import LinkTileModal from '~/components/LinkTileModal'
import { useState, useEffect } from 'react'
import { linkTileColor } from '../../constants/link_tile_colors'
import { useThemeContext } from '~/providers/ThemeProvider'
import { getActiveOperator } from '~/components/TacticalBootGate'

export interface DashboardConfig {
  pools: boolean
  poolsCombined: boolean
  cpuCombined: boolean
  cpuUsage: boolean
  cpuModel: boolean
  memory: boolean
  eventLog: boolean
  commandHub: boolean
  pinnedModules: boolean
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  pools: true,
  poolsCombined: true,
  cpuCombined: true,
  cpuUsage: true,
  cpuModel: true,
  memory: true,
  eventLog: true,
  commandHub: true,
  pinnedModules: true,
}

function CircularGauge({
  percentage,
  size = 90,
  strokeWidth = 9,
  color = '#4ade80',
  trackColor = 'rgba(255,255,255,0.08)',
  label,
  sublabel,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const validPercent = Math.min(Math.max(percentage, 0), 100)
  const offset = circumference - (validPercent / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center px-1">
        <span className="font-mono-mil font-bold text-sm sm:text-base leading-tight text-text-primary">
          {label ?? `${Math.round(validPercent)}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] font-mono-mil text-text-muted uppercase leading-tight mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

// Maps is a Core Capability (display_order: 4)
const MAPS_ITEM = {
  label: 'Mapas Offline',
  categoryTag: 'CARTOGRAFIA',
  portLabel: '/MAPS // PMTiles',
  to: '/maps',
  target: '',
  description: 'Navegação e visualização de mapas vetoriais regionais e marcadores sem internet',
  icon: <IconMapRoute size={44} />,
  installed: true,
  displayOrder: 4,
  poweredBy: 'MapLibre + Protomaps',
}

// Drug Reference — offline medical reference tile
const DRUG_REFERENCE_ITEM = {
  label: 'Guia de Medicamentos',
  categoryTag: 'SAÚDE & BIOMEDICINA',
  portLabel: '/DRUG-REFERENCE',
  to: '/drug-reference',
  target: '',
  description: 'Consulta offline de bulas, posologias, interações medicamentosas e busca por sintomas',
  icon: <IconPill size={44} />,
  installed: true,
  displayOrder: 5,
  poweredBy: 'Base Médica Offline',
}

// System items shown after all apps
const SYSTEM_ITEMS = [
  {
    label: 'Configuração Rápida',
    categoryTag: 'ASSISTENTE DE CAMPO',
    portLabel: '/EASY-SETUP',
    to: '/easy-setup',
    target: '',
    description:
      'Assistente passo a passo para selecionar pacotes offline, Wikipédia PT, mapas e IA!',
    icon: <IconBolt size={44} />,
    installed: true,
    displayOrder: 50,
    poweredBy: 'Provisionamento Local',
  },
  {
    label: 'Central de Aplicativos',
    categoryTag: 'ARSENAL DOCKER',
    portLabel: '/SUPPLY-DEPOT',
    to: '/supply-depot',
    target: '',
    description: 'Catálogo de aplicativos e contêineres Docker instaláveis em 1 clique (Local & Portainer)',
    icon: <IconBox size={44} />,
    installed: true,
    displayOrder: 51,
    poweredBy: 'Docker Engine + Portainer',
  },
  {
    label: 'Manuais & Documentação',
    categoryTag: 'DOUTRINA & GUIAS',
    portLabel: '/DOCS/HOME',
    to: '/docs/home',
    target: '',
    description: 'Guias práticos de sobrevivência, água, bioconstrução, medicina e autossuficiência',
    icon: <IconHelp size={44} />,
    installed: true,
    displayOrder: 52,
    poweredBy: 'Acervo Técnico PT-BR',
  },
  {
    label: 'Discos & Configurações',
    categoryTag: 'TELEMETRIA & SISTEMA',
    portLabel: '/SETTINGS/SYSTEM',
    to: '/settings/system#discos',
    target: '',
    description: 'Topologia de discos conectados, uso de hardware, IA remota na LAN e atualizações',
    icon: <IconSettings size={44} />,
    installed: true,
    displayOrder: 53,
    poweredBy: 'Kernel & Storage',
  },
  {
    label: 'Temas & Interface',
    categoryTag: 'PERSONALIZAÇÃO VISUAL',
    portLabel: '/SETTINGS/THEMES',
    to: '/settings/themes',
    target: '',
    description:
      'Troca instantânea entre os temas Militar Tático (MIL-STD-810H), Padrão NOMAD Claro/Noturno, Sobrevivência e Stealth',
    icon: <IconPalette size={44} />,
    installed: true,
    displayOrder: 54,
    poweredBy: 'Motor de Temas em Tempo Real',
  },
]

interface DashboardItem {
  label: string
  categoryTag?: string
  category?: string
  portLabel?: string
  serviceName?: string
  to: string
  target: string
  description: string
  icon: React.ReactNode
  installed: boolean
  displayOrder: number
  poweredBy: string | null
  /** Set only for user-added link tiles, which render differently and can be edited. */
  linkTile?: ServiceSlim
}

const HOME_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'favorites', label: '⭐ Fixados' },
  { id: 'ai', label: 'IA & Cérebro' },
  { id: 'home-family', label: 'Casa & Família' },
  { id: 'finance', label: 'Finanças' },
  { id: 'security', label: 'Segurança' },
  { id: 'networking', label: 'Rede & Rádio' },
  { id: 'media', label: 'Mídia & Som' },
  { id: 'workshop', label: 'Oficina' },
  { id: 'productivity', label: 'Produtividade' },
  { id: 'utility', label: 'Utilitários' },
]

const CATEGORY_TAG_MAP: Record<string, string> = {
  ai: 'INTELIGÊNCIA ARTIFICIAL',
  'home-family': 'CASA & FAMÍLIA',
  finance: 'FINANÇAS & NEGÓCIOS',
  security: 'SEGURANÇA & DEFESA',
  networking: 'REDE & COMUNICAÇÃO',
  media: 'MÍDIA & ENTRETENIMENTO',
  workshop: 'OFICINA & ENGENHARIA',
  productivity: 'PRODUTIVIDADE & DADOS',
  utility: 'UTILITÁRIOS & SISTEMA',
  education: 'EDUCAÇÃO & ACERVO',
}

export default function Home(props: {
  system: {
    services: ServiceSlim[]
  }
  drugReferenceInstalled: boolean
}) {
  const items: DashboardItem[] = []
  const updateInfo = useUpdateAvailable()
  const rerunBanner = useBenchmarkRerunBanner()
  const queryClient = useQueryClient()
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const { effectiveTacticalHome, currentThemeDef } = useThemeContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [densityMode, setDensityMode] = useState<'cards' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'cards'
    try {
      return (localStorage.getItem('nomad:home_density_mode') as any) || 'cards'
    } catch {
      return 'cards'
    }
  })
  const [pinnedServices, setPinnedServices] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('nomad:home_pinned_services')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const saveDensityMode = (mode: 'cards' | 'compact') => {
    setDensityMode(mode)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nomad:home_density_mode', mode)
      } catch {
        // ignore
      }
    }
  }

  const togglePin = (key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = pinnedServices.includes(key)
      ? pinnedServices.filter((k) => k !== key)
      : [...pinnedServices, key]
    setPinnedServices(next)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nomad:home_pinned_services', JSON.stringify(next))
      } catch {
        // ignore
      }
    }
  }

  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [catalogAppId, setCatalogAppId] = useState<string | null>(null)

  const openAppCatalog = (appId?: string) => {
    setCatalogAppId(appId || null)
    setCatalogModalOpen(true)
  }
  const [editingTile, setEditingTile] = useState<ServiceSlim | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [kiwixQuery, setKiwixQuery] = useState('')
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false)
  const [divisionsPrefs, setDivisionsPrefs] = useState<{ order: string[]; hidden: string[] }>(() => {
    if (typeof window === 'undefined') return { order: [], hidden: [] }
    try {
      const raw = localStorage.getItem('nomad:home_divisions_prefs')
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore
    }
    return { order: [], hidden: [] }
  })
  const [activeOperator, setActiveOperator] = useState<{ username: string; level: string }>({
    username: 'ADMINISTRADOR',
    level: 'NÍVEL 05 // COMANDO-GERAL',
  })

  // TrueNAS Dashboard Customization state
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_DASHBOARD_CONFIG
    try {
      const raw = localStorage.getItem('nomad:home_dashboard_config')
      if (raw) return { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(raw) }
    } catch {
      // ignore
    }
    return DEFAULT_DASHBOARD_CONFIG
  })
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false)

  const saveDashboardConfig = (next: DashboardConfig) => {
    setDashboardConfig(next)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nomad:home_dashboard_config', JSON.stringify(next))
      } catch {
        // ignore
      }
    }
  }

  const saveDivisionsPrefs = (next: { order: string[]; hidden: string[] }) => {
    setDivisionsPrefs(next)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nomad:home_divisions_prefs', JSON.stringify(next))
      } catch {
        // ignore
      }
    }
  }

  const { data: sysInfo } = useQuery({
    queryKey: ['home-sys-info'],
    queryFn: () => api.getSystemInfo(),
    refetchInterval: 15000,
  })

  // Storage overview for TrueNAS-style pools
  const { data: storageOverview } = useQuery<{
    storageRoot: string
    preferredDownloadDisk: string
    folderUsage: { name: string; label: string; path: string; sizeBytes: number; fileCount: number }[]
    mountTargets: { label: string; path: string; freeBytes: number; totalBytes: number }[]
  }>({
    queryKey: ['home-storage-overview'],
    queryFn: async () => {
      const res = await axios.get('/api/system/storage/overview')
      return res.data
    },
    refetchInterval: 30000,
  })

  // Telemetry computation
  const cpuPercent = Math.min(Math.max(sysInfo?.currentLoad?.currentLoad ?? 2.5, 0), 100)
  const cpuBrand = sysInfo?.cpu?.brand || 'Processador Intel / AMD x86_64'
  const cpuPhysical = sysInfo?.cpu?.physicalCores || 14
  const cpuCores = sysInfo?.cpu?.cores || 20
  const cpuSpeed = sysInfo?.cpu?.speed || 2.5

  const memTotalBytes = sysInfo?.mem?.total || 33285996544
  const memUsedBytes = sysInfo?.mem?.used || 4509715660
  const memFreeBytes = sysInfo?.mem?.available || sysInfo?.mem?.free || (memTotalBytes - memUsedBytes)
  const memTotalGiB = memTotalBytes / (1024 ** 3)
  const memUsedGiB = memUsedBytes / (1024 ** 3)
  const memFreeGiB = memFreeBytes / (1024 ** 3)
  const memUsedPercent = Math.min(Math.max((memUsedBytes / memTotalBytes) * 100, 0), 100)

  const displayMountTargets = storageOverview?.mountTargets && storageOverview.mountTargets.length > 0
    ? storageOverview.mountTargets
    : [
        {
          label: 'Armazenamento Interno NOMAD (storage)',
          path: '/app/storage',
          freeBytes: (sysInfo?.disk?.[0]?.available ?? 857.9 * 1024 * 1024 * 1024),
          totalBytes: (sysInfo?.disk?.[0]?.total ?? 1000 * 1024 * 1024 * 1024),
        },
        {
          label: 'Disco Secundário (/mnt/nomad_storage)',
          path: '/mnt/nomad_storage',
          freeBytes: 915.8 * 1024 * 1024 * 1024,
          totalBytes: 1000 * 1024 * 1024 * 1024,
        },
      ]

  const totalCombinedBytes = displayMountTargets.reduce((acc, t) => acc + (t.totalBytes || 0), 0)
  const freeCombinedBytes = displayMountTargets.reduce((acc, t) => acc + (t.freeBytes || 0), 0)
  const usedCombinedBytes = Math.max(0, totalCombinedBytes - freeCombinedBytes)
  const combinedPercent = totalCombinedBytes > 0 ? (usedCombinedBytes / totalCombinedBytes) * 100 : 0
  const combinedGaugeColor =
    combinedPercent >= 85 ? '#ef4444' : combinedPercent >= 70 ? '#f59e0b' : '#06b6d4'

  const [clockTime, setClockTime] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: activeDownloads = [] } = useDownloads({})
  const runningDownloads = activeDownloads.filter((d) => d.status !== 'completed' && d.status !== 'failed')
  const currentActiveJob =
    runningDownloads.find((d) => d.status === 'active') || runningDownloads[0]

  const activeDownloadTitle = currentActiveJob
    ? currentActiveJob.title ||
      (currentActiveJob.filepath
        ? currentActiveJob.filepath.split(/[/\\]/).pop()?.replace(/\.(tmp|zim|pmtiles|gguf)$/i, '')
        : currentActiveJob.url) || 'Pacote de Dados'
  : null
  const activeDownloadPercent = currentActiveJob ? Math.round(currentActiveJob.progress || 0) : 0
  const { data: remoteAiSetting } = useSystemSetting({ key: 'ai.remoteOllamaUrl' })
  const ollamaInstalled = props.system.services.some(
    (s) => s.service_name === SERVICE_NAMES.OLLAMA && s.installed
  )
  const aiConfigured = ollamaInstalled || Boolean(remoteAiSetting?.value)

  useEffect(() => {
    const syncOp = () => {
      const op = getActiveOperator()
      const rawUser = op?.username || ''
      const cleanUsername =
        rawUser && !rawUser.toLowerCase().includes('nathan') && !rawUser.toLowerCase().includes('oneithan')
          ? rawUser
          : 'ADMINISTRADOR'
      setActiveOperator({
        username: cleanUsername,
        level: op?.level || 'NÍVEL 05 // COMANDO-GERAL',
      })
    }
    syncOp()
    window.addEventListener('nomad:operator-updated', syncOp)
    return () => window.removeEventListener('nomad:operator-updated', syncOp)
  }, [])

  const refreshServices = () => router.reload({ only: ['system'] })

  const handleDeleteTile = async (serviceName: string) => {
    const result = await api.deleteLinkTile(serviceName)
    setPendingDelete(null)
    if (!result?.success) {
      setLinkError('Não foi possível remover este atalho.')
      return
    }
    refreshServices()
  }

  const handleDismissRerunBanner = async () => {
    await api.updateSetting('benchmark.rerunBannerDismissed', true)
    queryClient.invalidateQueries({ queryKey: BENCHMARK_RERUN_BANNER_QUERY_KEY })
  }

  // Check if user has visited Easy Setup
  const { data: easySetupVisited } = useSystemSetting({
    key: 'ui.hasVisitedEasySetup',
  })
  const shouldHighlightEasySetup = easySetupVisited?.value
    ? String(easySetupVisited.value) !== 'true'
    : false

  props.system.services
    .filter(
      (service) =>
        service.installed &&
        (service.ui_location || service.custom_url) &&
        !service.is_link_tile
    )
    .forEach((service) => {
      const resolvedAiName =
        aiAssistantName &&
        aiAssistantName !== 'AI Assistant' &&
        aiAssistantName !== 'Assistente de IA'
          ? aiAssistantName
          : service.friendly_name && service.friendly_name !== 'AI Assistant'
            ? service.friendly_name
            : 'Assistente de IA'

      const isOllama = service.service_name === SERVICE_NAMES.OLLAMA
      const isKiwix = service.service_name === SERVICE_NAMES.KIWIX
      const catTag =
        service.category && CATEGORY_TAG_MAP[service.category]
          ? CATEGORY_TAG_MAP[service.category]
          : isKiwix
            ? 'ENCICLOPÉDIA & ACERVO ZIM'
            : isOllama
              ? 'INTELIGÊNCIA ARTIFICIAL (RAG)'
              : 'MÓDULO OPERACIONAL'

      items.push({
        label: isOllama ? resolvedAiName : service.friendly_name || service.service_name,
        categoryTag: catTag,
        category: service.category || (isOllama ? 'ai' : isKiwix ? 'education' : 'utility'),
        portLabel: service.ui_location
          ? `${service.ui_location} // ${service.service_name.toUpperCase()}`
          : service.service_name.toUpperCase(),
        serviceName: service.service_name,
        to:
          service.ui_location || service.custom_url
            ? getServiceLink(service.ui_location || '', service.custom_url)
            : '#',
        target: isOllama ? '' : '_blank',
        description:
          service.description ||
          `Acessar o módulo ${service.friendly_name || service.service_name}`,
        icon: service.icon ? (
          <DynamicIcon icon={service.icon as DynamicIconName} className="!size-11" />
        ) : (
          <IconWifiOff size={44} />
        ),
        installed: service.installed,
        displayOrder: service.display_order ?? 100,
        poweredBy: service.powered_by ?? null,
      })
    })

  // User-added link tiles: shortcuts to things NOMAD does not manage.
  props.system.services
    .filter((service) => service.is_link_tile && service.custom_url)
    .forEach((service) => {
      items.push({
        label: service.friendly_name || service.service_name,
        categoryTag: 'ATALHO DE REDE LAN',
        category: 'utility',
        portLabel: 'EXTERNO // LAN',
        serviceName: service.service_name,
        to: getServiceLink('', service.custom_url),
        target: '_blank',
        description: service.description || 'Abre em uma nova guia',
        icon: <DynamicIcon icon={service.icon as DynamicIconName} className="!size-11" />,
        installed: true,
        displayOrder: service.display_order ?? 90,
        poweredBy: 'Atalho Personalizado',
        linkTile: service,
      })
    })

  items.push(MAPS_ITEM)

  if (props.drugReferenceInstalled) {
    items.push(DRUG_REFERENCE_ITEM)
  }

  items.push(...SYSTEM_ITEMS)
  items.sort((a, b) => a.displayOrder - b.displayOrder)

  const installedAppCount = props.system.services.filter((s) => s.installed).length

  return (
    <AppLayout>
      <Head title="Centro de Comando" />
      {updateInfo?.updateAvailable && (
        <div className="flex justify-center items-center p-4 w-full max-w-[1840px] mx-auto 2xl:px-10">
          <Alert
            title="Uma nova atualização está disponível!"
            type="info-inverted"
            variant="solid"
            className="w-full"
            buttonProps={{
              variant: 'primary',
              children: 'Ver Atualizações',
              icon: 'IconSettings',
              onClick: () => router.visit('/settings/update'),
            }}
          />
        </div>
      )}
      <WhatsNewBanner />
      {rerunBanner?.show && (
        <div className="flex justify-center items-center px-4 pt-4 w-full max-w-[1840px] mx-auto 2xl:px-10">
          <Alert
            title="Seu benchmark pode ser recalculado com o Score v2"
            message="O sistema de pontuação de hardware foi atualizado. Execute novamente quando desejar."
            type="info-inverted"
            variant="solid"
            className="w-full"
            dismissible
            onDismiss={handleDismissRerunBanner}
            buttonProps={{
              variant: 'primary',
              children: 'Executar Benchmark',
              icon: 'IconRefresh',
              onClick: () => router.visit('/settings/benchmark'),
            }}
          />
        </div>
      )}

      {effectiveTacticalHome ? (
        /* ====================================================================
           MODO HUD TÁTICO MILITAR COM DASHBOARD TRUENAS & CENTRAIS NOMAD
           ==================================================================== */
        <div className="max-w-[1840px] w-full mx-auto px-4 sm:px-6 2xl:px-10 py-4 space-y-5">
          {/* 1. BARRA OPERACIONAL DO COMANDO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-default/60">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-mil text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-desert-green nomad-telemetry-dot" />
                AUTORIZAÇÃO: <strong className="text-desert-olive">{activeOperator.level}</strong>
              </span>
              <span>•</span>
              <span>
                OPERADOR: <strong className="text-text-primary">{activeOperator.username.toUpperCase()}</strong>
              </span>
              <span>•</span>
              <span>
                NÓ DE CAMPO: <strong className="text-desert-tan">NEXUS-01</strong>
              </span>
              <span>•</span>
              <span>
                REDE: <strong className="text-desert-olive">LAN / OFF-GRID PRONTO</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDashboardModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-mil uppercase border border-border-default bg-surface-secondary hover:border-desert-tan text-text-primary rounded cursor-pointer transition-colors shadow-sm"
              >
                <IconAdjustments size={14} className="text-desert-tan" />
                <span>Personalizar Dashboard</span>
              </button>
            </div>
          </div>

          {/* 2. DASHBOARD DE TELEMETRIA & HARDWARE (ESTILO TRUENAS) */}
          <section className="space-y-3">
            {/* Pools & Discos Físicos */}
            {dashboardConfig.pools && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-desert-tan font-mono-mil text-xs">►</span>
                    <h2 className="text-xs sm:text-sm font-bold font-stencil tracking-wider uppercase text-desert-tan">
                      POOLS &amp; DISCOS FÍSICOS DE ARMAZENAMENTO
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        saveDashboardConfig({
                          ...dashboardConfig,
                          poolsCombined: !dashboardConfig.poolsCombined,
                        })
                      }
                      title={
                        dashboardConfig.poolsCombined
                          ? 'Alternar para visualização em cards separados'
                          : 'Alternar para visualização unificada (2 em 1 só card)'
                      }
                      className="px-2.5 py-1 rounded text-[11px] font-mono-mil border border-border-default bg-surface-secondary hover:border-desert-tan text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {dashboardConfig.poolsCombined ? (
                        <>
                          <IconLayoutGrid size={13} className="text-desert-tan" />
                          <span>VER CARDS SEPARADOS</span>
                        </>
                      ) : (
                        <>
                          <IconBox size={13} className="text-desert-tan" />
                          <span>UNIFICAR (2 EM 1)</span>
                        </>
                      )}
                    </button>
                    <Link
                      href="/settings/system#discos"
                      className="text-[11px] font-mono-mil text-desert-olive hover:underline hidden sm:inline"
                    >
                      GERENCIAR DISCOS &gt;
                    </Link>
                  </div>
                </div>

                {dashboardConfig.poolsCombined ? (
                  /* CARD ÚNICO CONSOLIDADO (2 DISCOS EM 1 SÓ CARD) */
                  <div className="chamfer-box relative p-5 border-t-2 border-t-desert-tan hover:border-desert-tan transition-colors">
                    <div className="rivet absolute top-2.5 left-2.5" />
                    <div className="rivet absolute top-2.5 right-2.5" />
                    <div className="rivet absolute bottom-2.5 left-2.5" />
                    <div className="rivet absolute bottom-2.5 right-2.5" />

                    <div>
                      {/* Top Bar do Card Único */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border-default/60">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-surface-secondary border border-border-default text-desert-tan font-bold">
                            TOPOLOGIA DUAL // 2 DISCOS REAIS
                          </span>
                          <span className="font-stencil font-bold tracking-wide text-base text-text-primary uppercase">
                            Armazenamento Consolidado do Servidor
                          </span>
                        </div>
                        <div className="text-[11px] font-mono-mil text-text-secondary flex items-center gap-2 self-start sm:self-auto">
                          <span>
                            Livre Global:{' '}
                            <strong className="text-desert-olive">{formatBytes(freeCombinedBytes)}</strong>{' '}
                            de {formatBytes(totalCombinedBytes)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-text-primary font-bold">
                            {combinedPercent.toFixed(1)}% EM USO
                          </span>
                        </div>
                      </div>

                      {/* Barra Tática Global de Uso */}
                      <div className="mb-4">
                        <div className="relative h-2 w-full bg-surface-secondary rounded-full overflow-hidden border border-border-default/50">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.max(combinedPercent, 2)}%`,
                              backgroundColor: combinedGaugeColor,
                            }}
                          />
                        </div>
                      </div>

                      {/* As 2 Unidades em Colunas Lado a Lado */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-border-default/40">
                        {displayMountTargets.map((target, idx) => {
                          const total = target.totalBytes || 1
                          const free = target.freeBytes || 0
                          const used = Math.max(0, total - free)
                          const usedPercent = Math.min(Math.max((used / total) * 100, 0), 100)
                          const gaugeColor =
                            usedPercent >= 85 ? '#ef4444' : usedPercent >= 70 ? '#f59e0b' : '#06b6d4'
                          const isInternal =
                            target.path === '/app/storage' ||
                            target.path === '/storage' ||
                            target.label.toLowerCase().includes('interno')
                          const poolTitle = isInternal
                            ? 'NVMe Sistema (Armazenamento Interno)'
                            : `Disco Secundário (HD ${idx})`
                          const roleLabel = isInternal ? 'SISTEMA & DOCKER' : 'DADOS & ACERVO'

                          return (
                            <div key={target.path} className={idx > 0 ? 'pt-3 md:pt-0 md:pl-4' : 'pr-0 md:pr-4'}>
                              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border-subtle/50">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-desert-tan" />
                                  <span className="text-xs font-bold font-stencil uppercase text-text-primary">
                                    {poolTitle}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono-mil px-1.5 py-0.2 rounded bg-surface-secondary border border-border-subtle text-desert-olive font-bold">
                                  {roleLabel}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1 min-w-0 text-[11px] font-mono-mil">
                                  <div className="text-text-secondary truncate">
                                    Ponto: <strong className="text-text-primary">{target.path}</strong>
                                  </div>
                                  <div className="text-text-muted">
                                    Livre: <strong className="text-desert-olive">{formatBytes(free)}</strong> de{' '}
                                    {formatBytes(total)}
                                  </div>
                                  <div className="text-text-muted">
                                    Em Uso: <span className="text-text-primary font-bold">{formatBytes(used)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-desert-green font-bold text-[10px] pt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-desert-green animate-pulse" />
                                    <span>ONLINE // SAUDÁVEL</span>
                                  </div>
                                </div>

                                <CircularGauge
                                  percentage={usedPercent}
                                  size={82}
                                  strokeWidth={8}
                                  color={gaugeColor}
                                  label={`${usedPercent.toFixed(1)}%`}
                                  sublabel="USO"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Rodapé Consolidado */}
                    <div className="pt-3 mt-3 border-t border-border-default/40 flex flex-wrap items-center justify-between text-[10px] font-mono-mil text-text-muted gap-2">
                      <div className="flex items-center gap-3">
                        <span>
                          MAPEAMENTO EM LOTE: <strong className="text-desert-olive">ATIVO</strong>
                        </span>
                        <span>•</span>
                        <span>
                          ERROS FS: <strong className="text-text-primary">0</strong>
                        </span>
                      </div>
                      <Link
                        href="/settings/system#discos"
                        className="text-desert-tan hover:text-desert-orange font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>CONFIGURAR DISCOS &amp; SAMBA</span>
                        <IconArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* MODO CARDS SEPARADOS */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
                    {displayMountTargets.map((target, idx) => {
                      const total = target.totalBytes || 1
                      const free = target.freeBytes || 0
                      const used = Math.max(0, total - free)
                      const usedPercent = Math.min(Math.max((used / total) * 100, 0), 100)
                      const gaugeColor =
                        usedPercent >= 85 ? '#ef4444' : usedPercent >= 70 ? '#f59e0b' : '#06b6d4'
                      const isInternal =
                        target.path === '/app/storage' ||
                        target.path === '/storage' ||
                        target.label.toLowerCase().includes('interno')
                      const poolTitle = isInternal
                        ? 'NVMe Sistema (Pool Interno)'
                        : `Pool Secundário (HD ${idx})`

                      return (
                        <div
                          key={target.path}
                          className="chamfer-box relative p-4 flex flex-col justify-between border-t-2 border-t-desert-tan hover:border-desert-tan transition-colors"
                        >
                          <div className="rivet absolute top-2 left-2" />
                          <div className="rivet absolute top-2 right-2" />
                          <div className="rivet absolute bottom-2 left-2" />
                          <div className="rivet absolute bottom-2 right-2" />

                          <div>
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono-mil px-1.5 py-0.5 rounded bg-surface-secondary border border-border-default text-desert-tan font-bold">
                                  POOL
                                </span>
                                <span className="font-stencil font-bold tracking-wide text-sm text-text-primary uppercase truncate max-w-[220px]">
                                  {poolTitle}
                                </span>
                              </div>
                              <Link
                                href="/settings/system#discos"
                                title="Configurar particionamento e mapeamento"
                                className="text-text-muted hover:text-desert-tan p-1 transition-colors"
                              >
                                <IconAdjustments size={14} />
                              </Link>
                            </div>

                            <div className="flex items-center justify-between gap-3 my-2">
                              <div className="space-y-1 min-w-0">
                                <div className="text-[11px] font-mono-mil text-text-secondary truncate">
                                  Ponto: <strong className="text-text-primary">{target.path}</strong>
                                </div>
                                <div className="text-[11px] font-mono-mil text-text-muted">
                                  Topologia: <span className="text-text-secondary font-bold">1 x FÍSICO</span>
                                </div>
                                <div className="text-[11px] font-mono-mil text-text-muted">
                                  Livre: <strong className="text-desert-olive">{formatBytes(free)}</strong> de{' '}
                                  {formatBytes(total)}
                                </div>
                                <div className="text-[11px] font-mono-mil text-text-muted">
                                  Em Uso: <span className="text-text-primary font-bold">{formatBytes(used)}</span>
                                </div>
                              </div>

                              <CircularGauge
                                percentage={usedPercent}
                                size={88}
                                strokeWidth={9}
                                color={gaugeColor}
                                label={`${usedPercent.toFixed(1)}%`}
                                sublabel="EM USO"
                              />
                            </div>
                          </div>

                          <div className="pt-2 mt-2 border-t border-border-default/40 flex items-center justify-between text-[10px] font-mono-mil">
                            <div className="flex items-center gap-1.5 text-desert-green font-bold">
                              <span className="w-2 h-2 rounded-full bg-desert-green animate-pulse" />
                              <span>ONLINE // SAUDÁVEL</span>
                            </div>
                            <div className="text-text-muted">
                              ERROS FS: <span className="text-text-secondary font-bold">0</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Linha de Processamento, Memória e Log de Eventos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* CPU: MODO UNIFICADO (CARGA + MODELO EM 1 CARD SÓ) */}
              {dashboardConfig.cpuCombined ? (
                <div className="lg:col-span-4 chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-colors">
                  <div className="rivet absolute top-2 left-2" />
                  <div className="rivet absolute top-2 right-2" />
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-stencil tracking-wider uppercase text-desert-tan">
                        Processador &amp; Carga (CPU)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        saveDashboardConfig({
                          ...dashboardConfig,
                          cpuCombined: false,
                        })
                      }
                      title="Separar em 2 cards individuais"
                      className="text-[10px] font-mono-mil text-text-muted hover:text-desert-tan cursor-pointer"
                    >
                      [SEPARAR]
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1">
                    <CircularGauge
                      percentage={cpuPercent}
                      size={86}
                      strokeWidth={8}
                      color="#06b6d4"
                      label={`${Math.round(cpuPercent)}%`}
                      sublabel="CARGA"
                    />
                    <div className="space-y-1 min-w-0 text-[11px] font-mono-mil">
                      <div className="text-xs font-bold text-text-primary line-clamp-1" title={cpuBrand}>
                        {cpuBrand}
                      </div>
                      <div className="text-text-secondary">
                        <strong className="text-desert-tan">{cpuPhysical} Cores / {cpuCores} Threads</strong>
                      </div>
                      <div className="text-text-muted">
                        Frequência: <strong className="text-text-primary">{cpuSpeed} GHz</strong>
                      </div>
                      <div className="text-[10px] text-desert-olive font-bold">
                        {cpuPercent < 10 ? 'CARGA BAIXA // OCIOSO' : 'EM PROCESSAMENTO'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-default/40 flex items-center justify-between text-[10px] font-mono-mil text-text-muted">
                    <span>STATUS TÉRMICO</span>
                    <span className="text-desert-green font-bold">NOMINAL // ESTÁVEL</span>
                  </div>
                </div>
              ) : (
                /* CPU: MODO SEPARADO (2 CARDS) */
                <>
                  {dashboardConfig.cpuUsage && (
                    <div className="lg:col-span-3 chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-colors">
                      <div className="rivet absolute top-2 left-2" />
                      <div className="rivet absolute top-2 right-2" />
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                        <span className="text-xs font-bold font-stencil tracking-wider uppercase text-desert-tan">
                          Utilização da CPU
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            saveDashboardConfig({
                              ...dashboardConfig,
                              cpuCombined: true,
                            })
                          }
                          title="Unificar com o card de modelo"
                          className="text-[10px] font-mono-mil text-text-muted hover:text-desert-tan cursor-pointer"
                        >
                          [UNIR]
                        </button>
                      </div>
                      <div className="flex items-center justify-center py-2">
                        <CircularGauge
                          percentage={cpuPercent}
                          size={96}
                          strokeWidth={9}
                          color="#06b6d4"
                          label={`${Math.round(cpuPercent)}%`}
                          sublabel="MÉDIA"
                        />
                      </div>
                      <div className="pt-2 border-t border-border-default/40 flex items-center justify-between text-[10px] font-mono-mil text-text-muted">
                        <span>CARGA ATUAL</span>
                        <span className="text-desert-olive font-bold">
                          {cpuPercent < 10 ? 'BAIXA // OCIOSO' : 'EM PROCESSAMENTO'}
                        </span>
                      </div>
                    </div>
                  )}

                  {dashboardConfig.cpuModel && (
                    <div className="lg:col-span-3 chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-colors">
                      <div className="rivet absolute top-2 left-2" />
                      <div className="rivet absolute top-2 right-2" />
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                        <span className="text-xs font-bold font-stencil tracking-wider uppercase text-desert-tan">
                          Processador Host
                        </span>
                        <span className="text-[10px] font-mono-mil text-desert-olive font-bold">x86_64</span>
                      </div>
                      <div className="py-2 space-y-1.5">
                        <div
                          className="text-xs font-mono-mil font-bold text-text-primary line-clamp-2"
                          title={cpuBrand}
                        >
                          {cpuBrand}
                        </div>
                        <div className="text-[11px] font-mono-mil text-text-secondary">
                          Núcleos:{' '}
                          <strong className="text-desert-tan">
                            {cpuPhysical} Cores / {cpuCores} Threads
                          </strong>
                        </div>
                        <div className="text-[11px] font-mono-mil text-text-secondary">
                          Frequência: <strong className="text-text-primary">{cpuSpeed} GHz</strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border-default/40 flex items-center justify-between text-[10px] font-mono-mil text-text-muted">
                        <span>STATUS TÉRMICO</span>
                        <span className="text-desert-green font-bold">NOMINAL // ESTÁVEL</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* RAM Memory Card */}
              {dashboardConfig.memory && (
                <div className={`${dashboardConfig.cpuCombined ? 'lg:col-span-4' : 'lg:col-span-3'} chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-colors`}>
                  <div className="rivet absolute top-2 left-2" />
                  <div className="rivet absolute top-2 right-2" />
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                    <span className="text-xs font-bold font-stencil tracking-wider uppercase text-desert-tan">
                      Memória RAM
                    </span>
                    <span className="text-[10px] font-mono-mil text-text-muted">
                      {memTotalGiB.toFixed(1)} GiB TOTAL
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="space-y-1.5 text-[11px] font-mono-mil min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        <span className="text-text-muted">Livre:</span>
                        <strong className="text-text-primary">{memFreeGiB.toFixed(1)} GiB</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-desert-orange shrink-0" />
                        <span className="text-text-muted">Em Uso:</span>
                        <strong className="text-text-primary">{memUsedGiB.toFixed(1)} GiB</strong>
                      </div>
                      <div className="text-[10px] text-text-muted">Serviços + Buffer OS</div>
                    </div>
                    <CircularGauge
                      percentage={memUsedPercent}
                      size={84}
                      strokeWidth={8}
                      color={memUsedPercent > 80 ? '#ef4444' : '#f59e0b'}
                      label={`${Math.round(memUsedPercent)}%`}
                      sublabel="ALOCADA"
                    />
                  </div>
                  <div className="pt-2 border-t border-border-default/40 flex items-center justify-between text-[10px] font-mono-mil text-text-muted">
                    <span>DISPONÍVEL</span>
                    <span className="text-desert-olive font-bold">{memFreeGiB.toFixed(1)} GiB LIVRES</span>
                  </div>
                </div>
              )}

              {/* Log de Eventos e Download Ativo */}
              {dashboardConfig.eventLog && (
                <div className={`${dashboardConfig.cpuCombined ? 'lg:col-span-4' : 'lg:col-span-3'} chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-colors`}>
                  <div className="rivet absolute top-2 left-2" />
                  <div className="rivet absolute top-2 right-2" />
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default/60">
                    <span className="text-xs font-bold font-stencil tracking-wider uppercase text-desert-tan">
                      LOG DE EVENTOS &amp; FILA
                    </span>
                    <span className="w-2 h-2 rounded-full bg-desert-olive nomad-telemetry-dot" />
                  </div>

                  <div className="chamfer-inner p-2.5 font-mono-mil text-[11px] space-y-1.5 text-text-secondary">
                    <div>
                      <span className="text-desert-tan">[MÓDULOS]</span> {installedAppCount} ATIVOS •{' '}
                      {aiConfigured ? 'IA ONLINE' : 'IA NÃO CONFIG.'}
                    </div>
                    {runningDownloads.length > 0 && currentActiveJob ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1 text-desert-tan font-bold">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-desert-green animate-pulse shrink-0" />
                            <span className="text-desert-green font-bold shrink-0">[BAIXANDO]</span>
                            <span
                              className="text-text-primary truncate max-w-[130px]"
                              title={activeDownloadTitle || ''}
                            >
                              {activeDownloadTitle}
                            </span>
                          </span>
                          <span className="text-desert-green font-mono shrink-0">
                            {activeDownloadPercent}%
                          </span>
                        </div>

                        <div className="relative h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden border border-border-default/40">
                          <div
                            className="h-full bg-gradient-to-r from-desert-olive via-desert-green to-desert-tan rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                            style={{ width: `${Math.max(activeDownloadPercent, 3)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <span>
                            {currentActiveJob.downloadedBytes && currentActiveJob.totalBytes
                              ? `${(currentActiveJob.downloadedBytes / (1024 * 1024 * 1024)).toFixed(1)} / ${(currentActiveJob.totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
                              : `${activeDownloadPercent}% concluído`}
                          </span>
                          {runningDownloads.length > 1 && (
                            <Link
                              href="/settings/downloads"
                              className="text-desert-orange hover:underline font-mono"
                            >
                              +{runningDownloads.length - 1} na fila &gt;
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-desert-tan">[FILA]</span> FILA DE DOWNLOADS LIVRE
                      </div>
                    )}
                    <div className="text-desert-olive flex items-center justify-between pt-0.5 border-t border-border-subtle/50">
                      <span>&gt; TEMA {currentThemeDef.shortName.toUpperCase()}</span>
                      <span className="opacity-80 font-mono">
                        {clockTime.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono-mil text-text-muted pt-2 px-1">
                    <span>HOST: NEXUS-NOMAD</span>
                    <span className="text-desert-olive font-bold">STATUS: ONLINE</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. CENTRAIS DE OPERAÇÃO & NAVEGAÇÃO DO SISTEMA (HUB NOMAD) */}
          {dashboardConfig.commandHub && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-border-default/60 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-desert-tan font-mono-mil text-xs">►</span>
                  <h2 className="text-sm sm:text-base font-bold font-stencil tracking-wider uppercase text-text-primary">
                    CENTRAIS DE OPERAÇÃO &amp; NAVEGAÇÃO DO SISTEMA
                  </h2>
                </div>
                <span className="text-[11px] font-mono-mil text-text-muted hidden sm:inline">
                  ACESSO DIRETO AOS PRINCIPAIS AMBIENTES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Supply Depot */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-orange transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-desert-orange/15 text-desert-orange font-bold border border-desert-orange/30">
                        {installedAppCount} MÓDULOS ATIVOS // 114 TOTAL
                      </span>
                      <div className="text-desert-orange p-1.5 rounded bg-desert-orange/10 group-hover:scale-110 transition-transform">
                        <IconBox size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-orange transition-colors">
                      Central de Aplicativos (Supply Depot)
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Catálogo completo de ferramentas off-grid, microsserviços e contêineres Docker instaláveis em 1 clique.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <Link
                      href="/supply-depot"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-desert-orange text-white hover:bg-desert-orange-light text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Abrir Central de Apps</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* 2. Catálogo & Guias */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-desert-tan/15 text-desert-tan font-bold border border-desert-tan/30">
                        114 GUIAS OPERACIONAIS
                      </span>
                      <div className="text-desert-tan p-1.5 rounded bg-desert-tan/10 group-hover:scale-110 transition-transform">
                        <IconBook size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-tan transition-colors">
                      Catálogo &amp; Guias Operacionais
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Manuais de sobrevivência, primeiros socorros, acervo técnico PT-BR e documentação de todas as aplicações.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <button
                      type="button"
                      onClick={() => openAppCatalog()}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-secondary border border-desert-tan/40 text-desert-tan hover:bg-desert-tan hover:text-black text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Explorar Catálogo &amp; Guias</span>
                      <IconBook size={14} />
                    </button>
                  </div>
                </div>

                {/* 3. Discos & Armazenamento */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-green transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-desert-green/15 text-desert-green font-bold border border-desert-green/30">
                        MULTI-HD &amp; SAMBA
                      </span>
                      <div className="text-desert-green p-1.5 rounded bg-desert-green/10 group-hover:scale-110 transition-transform">
                        <IconServer size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-green transition-colors">
                      Discos &amp; Armazenamento
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Topologia dos HDs conectados, mapeamento de downloads em lote entre discos e compartilhamento de rede.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <Link
                      href="/settings/system#discos"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-secondary border border-desert-green/40 text-desert-green hover:bg-desert-green hover:text-white text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Gerenciar Discos &amp; Pools</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* 4. Cartografia Offline */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-desert-tan/15 text-desert-tan font-bold border border-desert-tan/30">
                        MAPAS PMTILES &amp; ROTAS
                      </span>
                      <div className="text-desert-tan p-1.5 rounded bg-desert-tan/10 group-hover:scale-110 transition-transform">
                        <IconCompass size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-tan transition-colors">
                      Cartografia Tática Offline
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Navegação cartográfica e satélite vetorial global sem internet, com marcadores táticos e mapas de campo.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <Link
                      href="/maps"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-secondary border border-desert-tan/40 text-desert-tan hover:bg-desert-tan hover:text-black text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Abrir Cartografia</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* 5. Assistente de IA Local */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-olive transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono-mil px-2 py-0.5 rounded font-bold border ${
                          aiConfigured
                            ? 'bg-desert-green/15 text-desert-green border-desert-green/30'
                            : 'bg-desert-orange/15 text-desert-orange border-desert-orange/30'
                        }`}
                      >
                        {aiConfigured ? 'OLLAMA GGUF & RAG ONLINE' : 'CONFIGURAÇÃO PENDENTE'}
                      </span>
                      <div className="text-desert-olive p-1.5 rounded bg-desert-olive/10 group-hover:scale-110 transition-transform">
                        <IconBrain size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-olive transition-colors">
                      Assistente de IA Local (RAG)
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Modelos neurais locais para diagnóstico tático, indexação de documentos, buscas em livros e raciocínio off-grid.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <Link
                      href={aiConfigured ? '/chat' : '/settings/models'}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-secondary border border-desert-olive/40 text-desert-olive hover:bg-desert-olive hover:text-white text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>{aiConfigured ? 'Iniciar Conversa Tática' : 'Instalar / Configurar IA'}</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* 6. Gerenciador de Downloads */}
                <div className="chamfer-box relative p-4 flex flex-col justify-between hover:border-desert-tan transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono-mil px-2 py-0.5 rounded bg-surface-secondary text-desert-tan font-bold border border-border-default">
                        {runningDownloads.length > 0
                          ? `${runningDownloads.length} BAIXANDO AGORA`
                          : 'FILA RESILIENTE // AUTO-RESUME'}
                      </span>
                      <div className="text-desert-tan p-1.5 rounded bg-surface-secondary group-hover:scale-110 transition-transform">
                        <IconDownload size={22} />
                      </div>
                    </div>
                    <h3 className="text-base font-stencil font-bold tracking-wide uppercase text-text-primary group-hover:text-desert-tan transition-colors">
                      Gerenciador de Downloads
                    </h3>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Controle de pacotes ZIM, mapas e modelos com recuperação automática após quedas e limpeza de arquivos .tmp.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border-default/40">
                    <Link
                      href="/settings/downloads"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-secondary border border-border-default text-text-primary hover:border-desert-tan text-xs font-mono-mil font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Ver Fila &amp; Arquivos .tmp</span>
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. MÓDULOS OPERACIONAIS FIXADOS */}
          {dashboardConfig.pinnedModules && (
            <section className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-desert-tan font-mono-mil text-sm">★</span>
                  <h2 className="text-base sm:text-lg font-bold font-stencil tracking-widest uppercase text-text-primary">
                    MÓDULOS OPERACIONAIS FIXADOS
                  </h2>
                </div>
                <span className="text-xs font-mono-mil text-text-muted hidden sm:inline">
                  ACESSO RÁPIDO AOS SEUS MÓDULOS FAVORITOS
                </span>
              </div>

              {/* Cards Fixados */}
              {(() => {
                const pinnedItems = items.filter((it) =>
                  pinnedServices.includes(it.serviceName || it.label)
                )
                const defaultPicks = items
                  .filter((it) => {
                    const l = it.label.toLowerCase()
                    const s = (it.serviceName || '').toLowerCase()
                    return (
                      l.includes('kiwix') ||
                      s.includes('kiwix') ||
                      l.includes('kolibri') ||
                      s.includes('kolibri') ||
                      l.includes('mapas') ||
                      s.includes('map') ||
                      l.includes('jellyfin') ||
                      s.includes('jellyfin')
                    )
                  })
                  .slice(0, 4)

                const displayedItems = pinnedItems.length > 0 ? pinnedItems : defaultPicks

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {displayedItems.map((item) => {
                      const isPinned = pinnedServices.includes(item.serviceName || item.label)
                      const isLinkTile = Boolean(item.linkTile)
                      const isKiwix =
                        item.serviceName === SERVICE_NAMES.KIWIX ||
                        item.label.toLowerCase().includes('kiwix')

                      const cardContent = (
                        <div className="chamfer-box nomad-interactive-card relative p-4 flex flex-col justify-between transition-all hover:border-desert-tan group h-full">
                          <div className="rivet absolute top-2 left-2" />
                          <div className="rivet absolute top-2 right-2" />
                          <div className="rivet absolute bottom-2 left-2" />
                          <div className="rivet absolute bottom-2 right-2" />

                          <div>
                            {/* Card Top Row: Pin + Category + Port */}
                            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border-default/40">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => togglePin(item.serviceName || item.label, e)}
                                  title={isPinned ? 'Desfixar da Home' : 'Fixar na Home'}
                                  className="text-text-muted hover:text-desert-tan p-0.5 cursor-pointer shrink-0 transition-colors"
                                >
                                  {isPinned ? (
                                    <IconStarFilled size={15} className="text-desert-tan" />
                                  ) : (
                                    <IconStar size={15} />
                                  )}
                                </button>
                                <span className="text-[10px] font-mono-mil font-bold uppercase tracking-wider text-desert-olive truncate">
                                  {item.categoryTag || 'MÓDULO NOMAD'}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono-mil text-text-muted shrink-0">
                                {item.portLabel || item.to.toUpperCase()}
                              </span>
                            </div>

                            {/* Icon + Title + Description */}
                            <div className="flex items-start gap-3 my-2">
                              <div className="chamfer-inner p-2 text-desert-tan group-hover:text-text-primary transition-colors shrink-0">
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base font-bold font-stencil uppercase tracking-wide text-text-primary group-hover:text-desert-tan transition-colors truncate">
                                  {item.label}
                                </h3>
                                {item.poweredBy && (
                                  <div className="text-[10px] font-mono-mil text-desert-olive mt-0.5 truncate">
                                    MOTOR: {item.poweredBy}
                                  </div>
                                )}
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Direct Kiwix Search Box */}
                            {isKiwix && (
                              <div
                                className="chamfer-inner p-2 my-2 flex items-center gap-2"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <IconSearch size={14} className="text-desert-tan ml-1 shrink-0" />
                                <input
                                  type="text"
                                  value={kiwixQuery}
                                  onChange={(e) => setKiwixQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      window.open(item.to, '_blank', 'noopener,noreferrer')
                                    }
                                  }}
                                  placeholder="Buscar no acervo Kiwix..."
                                  className="bg-transparent text-xs font-mono-mil text-text-primary focus:outline-none w-full placeholder:text-text-muted"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.open(item.to, '_blank', 'noopener,noreferrer')
                                  }
                                  className="mil-tactical-btn px-2.5 py-1 text-[10px] font-mono-mil shrink-0 cursor-pointer"
                                >
                                  ABRIR
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Footer Action Row */}
                          <div className="pt-2 mt-2 border-t border-border-default/40 flex items-center justify-between">
                            <span className="text-[10px] font-mono-mil text-desert-green font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-desert-green animate-pulse" />
                              PRONTO
                            </span>

                            <div className="flex items-center gap-1 text-xs font-mono-mil font-bold text-desert-tan group-hover:translate-x-0.5 transition-transform">
                              <span>ACESSAR MÓDULO</span>
                              <IconArrowUpRight size={14} />
                            </div>
                          </div>
                        </div>
                      );

                      if (isLinkTile) {
                        const tile = item.linkTile;
                        const confirming = pendingDelete === tile.service_name;

                        return (
                          <div key={item.label} className="relative group">
                            <a
                              href={item.to}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-full"
                            >
                              {cardContent}
                            </a>

                            {confirming ? (
                              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTile(tile.service_name)}
                                  className="rounded bg-desert-red px-2 py-1 text-xs font-medium text-white hover:brightness-110 cursor-pointer"
                                >
                                  Remover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(null)}
                                  className="rounded border border-border-default bg-surface-primary px-2 py-1 text-xs text-text-secondary hover:bg-surface-secondary cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTile(tile)
                                    setLinkModalOpen(true)
                                  }}
                                  title="Editar este atalho"
                                  aria-label="Editar este atalho"
                                  className="rounded p-1.5 bg-surface-secondary border border-border-default text-text-secondary hover:text-desert-tan cursor-pointer"
                                >
                                  <IconPencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(tile.service_name)}
                                  title="Remover este atalho"
                                  aria-label="Remover este atalho"
                                  className="rounded p-1.5 bg-surface-secondary border border-border-default text-text-secondary hover:text-desert-red cursor-pointer"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return item.target === '_blank' ? (
                        <a
                          key={item.label}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-full"
                        >
                          {cardContent}
                        </a>
                      ) : (
                        <Link key={item.label} href={item.to} className="block h-full">
                          {cardContent}
                        </Link>
                      );
                    })}

                    {/* Botão de Adicionar Atalho de Rede */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTile(null)
                        setLinkModalOpen(true)
                      }}
                      className="chamfer-box relative p-4 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer border-dashed hover:border-desert-tan transition-colors group"
                    >
                      <div className="rivet absolute top-2 left-2" />
                      <div className="rivet absolute top-2 right-2" />
                      <div className="rivet absolute bottom-2 left-2" />
                      <div className="rivet absolute bottom-2 right-2" />

                      <div className="chamfer-inner p-2.5 text-desert-tan group-hover:scale-105 transition-transform">
                        <IconPlus size={26} />
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-wider text-text-primary mt-2 group-hover:text-desert-tan">
                        + Adicionar Atalho de Rede
                      </h3>
                      <p className="text-[11px] font-mono text-text-secondary mt-1 max-w-[200px]">
                        Vincular endereço local da sua LAN
                      </p>
                    </button>
                  </div>
                );
              })()}

              {/* CTA GIGANTE PARA O ARSENAL COMPLETO (SUPPLY DEPOT) */}
              <div className="pt-2">
                <Link
                  href="/supply-depot"
                  className="chamfer-box w-full p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-desert-orange/40 bg-desert-orange/5 hover:bg-desert-orange/15 hover:border-desert-orange transition-all group rounded cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="chamfer-inner p-2.5 text-desert-orange group-hover:scale-105 transition-transform shrink-0">
                      <IconBox size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-stencil text-base sm:text-lg font-bold uppercase text-text-primary group-hover:text-desert-orange transition-colors">
                          Acessar Arsenal Completo com Todos os Aplicativos (Supply Depot)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-desert-orange/20 text-desert-orange text-xs font-mono-mil font-bold">
                          114 APLICAÇÕES
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Navegue pelo catálogo completo de contêineres Docker, instale novos programas em 1 clique e gerencie seus serviços no Portainer.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono-mil font-bold text-desert-orange shrink-0 group-hover:translate-x-1 transition-transform">
                    <span>ABRIR SUPPLY DEPOT</span>
                    <IconArrowRight size={16} />
                  </div>
                </Link>
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ====================================================================
           MODO GRADE CLÁSSICA NOMAD (Padrão NOMAD Claro / Noturno)
           ==================================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {items.map((item) => {
            const isEasySetup = item.to === '/easy-setup'
            const shouldHighlight = isEasySetup && shouldHighlightEasySetup

            const isLinkTile = Boolean(item.linkTile)
            const tileColor = linkTileColor(item.linkTile?.link_color)

            const tileContent = (
              <div
                className={
                  isLinkTile
                    ? `relative rounded border-2 border-dashed ${tileColor.border} ${tileColor.bg} text-text-primary hover:bg-surface-secondary transition-colors shadow-sm h-48 flex flex-col items-center justify-center cursor-pointer text-center px-4`
                    : 'relative rounded border-desert-green border-2 bg-desert-green hover:bg-transparent hover:text-text-primary text-white transition-colors shadow-sm h-48 flex flex-col items-center justify-center cursor-pointer text-center px-4'
                }
              >
                {isLinkTile && (
                  <span
                    className={`absolute top-2 left-2 ${tileColor.marker}`}
                    title="Atalho externo adicionado por você na rede local."
                  >
                    <IconExternalLink size={16} />
                  </span>
                )}
                {shouldHighlight && (
                  <span className="absolute top-2 right-2 flex items-center justify-center">
                    <span
                      className="animate-ping absolute inline-flex w-20 h-6 rounded-full bg-desert-orange-light opacity-75"
                      style={{ animationDuration: '1.5s' }}
                    ></span>
                    <span className="relative inline-flex items-center rounded-full px-2.5 py-1 bg-desert-orange-light text-xs font-semibold text-white shadow-sm">
                      Comece aqui!
                    </span>
                  </span>
                )}
                <div className="flex items-center justify-center mb-2">{item.icon}</div>
                <h3 className="font-bold text-2xl">{item.label}</h3>
                {item.poweredBy && (
                  <p className="text-sm opacity-80">Motor: {item.poweredBy}</p>
                )}
                <p className="xl:text-lg mt-2">{item.description}</p>
              </div>
            )

            if (isLinkTile) {
              const tile = item.linkTile!
              const confirming = pendingDelete === tile.service_name

              return (
                <div key={item.label} className="group relative">
                  <a href={item.to} target="_blank" rel="noopener noreferrer">
                    {tileContent}
                  </a>

                  {confirming ? (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteTile(tile.service_name)}
                        className="rounded bg-desert-red px-2 py-1 text-xs font-medium text-white hover:brightness-110"
                      >
                        Remover
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="rounded border border-border-default bg-surface-primary px-2 py-1 text-xs text-text-secondary hover:bg-surface-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTile(tile)
                          setLinkModalOpen(true)
                        }}
                        title="Editar este atalho"
                        aria-label="Editar este atalho"
                        className="rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                      >
                        <IconPencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(tile.service_name)}
                        title="Remover este atalho"
                        aria-label="Remover este atalho"
                        className="rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-desert-red"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            return item.target === '_blank' ? (
              <a key={item.label} href={item.to} target="_blank" rel="noopener noreferrer">
                {tileContent}
              </a>
            ) : (
              <Link key={item.label} href={item.to}>
                {tileContent}
              </Link>
            )
          })}

          {/* Add-a-link affordance */}
          <button
            type="button"
            onClick={() => {
              setEditingTile(null)
              setLinkModalOpen(true)
            }}
            className="rounded border-2 border-dashed border-border-default bg-transparent text-text-muted hover:border-desert-green hover:text-text-primary transition-colors h-48 flex flex-col items-center justify-center cursor-pointer text-center px-4"
          >
            <IconPlus size={40} />
            <h3 className="font-bold text-xl mt-2">Adicionar Atalho</h3>
            <p className="text-sm mt-1">
              Um atalho rápido para outro serviço na sua rede local
            </p>
          </button>
        </div>
      )}

      {linkError && (
        <div className="px-4 2xl:px-10 pb-4 max-w-[1840px] w-full mx-auto">
          <Alert title={linkError} type="error" variant="solid" className="w-full" />
        </div>
      )}

      <LinkTileModal
        open={linkModalOpen}
        tile={editingTile}
        onClose={() => setLinkModalOpen(false)}
        onSaved={() => {
          setLinkModalOpen(false)
          refreshServices()
        }}
        showError={(msg) => setLinkError(msg)}
      />

      {customizeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          onClick={() => setCustomizeModalOpen(false)}
        >
          <div
            className="nomad-modal-animate w-full max-w-lg rounded-xl border border-border-default bg-surface-primary shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-border-subtle bg-surface-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconAdjustments size={18} className="text-desert-tan" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  Personalizar Divisões Operacionais
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeModalOpen(false)}
                className="p-1 rounded hover:bg-surface-primary text-text-secondary cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto themed-scrollbar space-y-2">
              {(() => {
                const orderedLabels = [...items]
                  .sort((a, b) => {
                    const idxA = divisionsPrefs.order.indexOf(a.label)
                    const idxB = divisionsPrefs.order.indexOf(b.label)
                    if (idxA === -1 && idxB === -1) return 0
                    if (idxA === -1) return 1
                    if (idxB === -1) return -1
                    return idxA - idxB
                  })
                  .map((i) => i.label)

                const moveItem = (index: number, delta: -1 | 1) => {
                  const nextOrder = [...orderedLabels]
                  const target = index + delta
                  if (target < 0 || target >= nextOrder.length) return
                  ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]
                  saveDivisionsPrefs({ ...divisionsPrefs, order: nextOrder })
                }

                const toggleHidden = (label: string) => {
                  const isHidden = divisionsPrefs.hidden.includes(label)
                  const nextHidden = isHidden
                    ? divisionsPrefs.hidden.filter((l) => l !== label)
                    : [...divisionsPrefs.hidden, label]
                  saveDivisionsPrefs({ ...divisionsPrefs, hidden: nextHidden })
                }

                return orderedLabels.map((label, idx) => {
                  const isHidden = divisionsPrefs.hidden.includes(label)
                  return (
                    <div
                      key={label}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${
                        isHidden
                          ? 'border-border-subtle bg-surface-secondary/50 opacity-60'
                          : 'border-border-default bg-surface-secondary'
                      }`}
                    >
                      <span className="text-xs font-medium text-text-primary truncate">
                        {label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          title="Mover para cima"
                          className="p-1 rounded border border-border-subtle bg-surface-primary text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                        >
                          <IconArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === orderedLabels.length - 1}
                          title="Mover para baixo"
                          className="p-1 rounded border border-border-subtle bg-surface-primary text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                        >
                          <IconArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleHidden(label)}
                          title={isHidden ? 'Exibir divisão' : 'Ocultar divisão'}
                          className={`p-1 rounded border cursor-pointer ${
                            isHidden
                              ? 'border-border-subtle bg-surface-primary text-text-muted'
                              : 'border-desert-green bg-desert-green/15 text-desert-green'
                          }`}
                        >
                          {isHidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        </button>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="px-5 py-3 border-t border-border-subtle bg-surface-secondary flex items-center justify-between">
              <button
                type="button"
                onClick={() => saveDivisionsPrefs({ order: [], hidden: [] })}
                className="text-xs font-medium text-text-secondary hover:text-desert-orange cursor-pointer"
              >
                Restaurar padrão
              </button>
              <button
                type="button"
                onClick={() => setCustomizeModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-desert-green text-white text-xs font-semibold hover:bg-btn-green-hover cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          onClick={() => setDashboardModalOpen(false)}
        >
          <div
            className="nomad-modal-animate w-full max-w-lg rounded-xl border border-border-default bg-surface-primary shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-border-subtle bg-surface-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconAdjustments size={18} className="text-desert-tan" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary font-mono-mil">
                  Personalizar Dashboard TrueNAS &amp; Centrais
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDashboardModalOpen(false)}
                className="p-1 rounded hover:bg-surface-primary text-text-secondary cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto themed-scrollbar space-y-2.5 font-mono-mil">
              <p className="text-xs text-text-secondary mb-3">
                Ative ou oculte widgets de monitoramento de hardware, pools de armazenamento e centrais de navegação da Home:
              </p>

              {[
                {
                  key: 'pools',
                  label: 'Exibir Pools & Discos de Armazenamento',
                  desc: 'Painel com informações dos HDs e NVMe físicos do servidor',
                },
                {
                  key: 'poolsCombined',
                  label: 'Discos em Card Único (2 em 1 Consolidado)',
                  desc: 'Exibe ambos os HDs em um só card unificado (desative para cards separados)',
                },
                {
                  key: 'cpuCombined',
                  label: 'CPU em Card Unificado (Carga + Modelo)',
                  desc: 'Exibe carga e processador em 1 só card alinhado com RAM e Logs',
                },
                {
                  key: 'memory',
                  label: 'Memória RAM',
                  desc: 'Gauge circular de memória total, livre e alocada',
                },
                {
                  key: 'eventLog',
                  label: 'Log de Eventos & Fila de Downloads',
                  desc: 'Download em tempo real com barra animada e relógio',
                },
                {
                  key: 'commandHub',
                  label: 'Centrais de Operação (Hub NOMAD)',
                  desc: 'Cards de acesso rápido (Supply Depot, Guias, Discos, Cartografia, IA, Downloads)',
                },
                {
                  key: 'pinnedModules',
                  label: 'Módulos Operacionais Fixados',
                  desc: 'Acesso rápido aos seus aplicativos favoritos fixados com estrela',
                },
              ].map((item) => {
                const isEnabled = dashboardConfig[item.key as keyof DashboardConfig]
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 p-3 rounded border border-border-default bg-surface-secondary"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary">{item.label}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        saveDashboardConfig({
                          ...dashboardConfig,
                          [item.key]: !isEnabled,
                        })
                      }
                      className={
                        isEnabled
                          ? 'px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shrink-0 bg-desert-green text-white border border-desert-green'
                          : 'px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shrink-0 bg-surface-primary border border-border-default text-text-muted hover:text-text-primary'
                      }
                    >
                      {isEnabled ? 'ATIVO' : 'OCULTO'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 border-t border-border-subtle bg-surface-secondary flex items-center justify-between">
              <button
                type="button"
                onClick={() => saveDashboardConfig(DEFAULT_DASHBOARD_CONFIG)}
                className="text-xs font-mono-mil text-text-secondary hover:text-desert-orange cursor-pointer"
              >
                Restaurar Padrões
              </button>
              <button
                type="button"
                onClick={() => setDashboardModalOpen(false)}
                className="px-4 py-1.5 rounded bg-desert-green text-white text-xs font-mono-mil font-bold hover:bg-btn-green-hover cursor-pointer shadow-sm"
              >
                Concluir &amp; Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <AppCatalogModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        initialAppId={catalogAppId}
        installedServiceNames={new Set(props.system.services.filter((s) => s.installed).map((s) => s.service_name))}
      />
    </AppLayout>
  )
}
