import {
  IconActivity,
  IconBolt,
  IconBox,
  IconCpu,
  IconDatabase,
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
  IconBook,
  IconServer,
  IconCompass,
  IconBrain,
  IconDownload,
  IconArrowRight,
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
import { useState, useEffect, useRef, memo } from 'react'
import { APP_CATALOG } from '../../constants/app_catalog_data'
import { linkTileColor } from '../../constants/link_tile_colors'
import { useThemeContext } from '~/providers/ThemeProvider'
import { getActiveOperator } from '~/components/TacticalBootGate'
import type { AuthStatusPayload } from '../../types/auth'
import { useAiStatus } from '~/hooks/useAiStatus'
import AiChooserModal from '~/components/chat/AiChooserModal'

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

const TacticalClock = memo(function TacticalClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleTick = () => {
      const msToNextSecond = 1000 - (Date.now() % 1000) + 15
      timer = setTimeout(() => {
        setNow(new Date())
        scheduleTick()
      }, msToNextSecond)
    }
    scheduleTick()
    return () => clearTimeout(timer)
  }, [])

  return (
    <span className="opacity-85 font-mono tabular-nums">
      {now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </span>
  )
})

function CircularGauge({
  percentage,
  size = 90,
  strokeWidth = 9,
  color = '#4ade80',
  trackColor = 'color-mix(in srgb, var(--tactical-text, #94a3b8) 15%, transparent)',
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
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
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
          style={{
            filter: `drop-shadow(0 0 6px ${color}55)`,
            transition: 'stroke-dashoffset 0.85s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.35s ease',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center px-1">
        <span className="font-mono tabular-nums font-bold text-sm sm:text-base leading-tight text-text-primary">
          {label ?? `${Math.round(validPercent)}%`}
        </span>
        {sublabel && (
          <span className="text-[0.625rem] font-semibold text-text-muted uppercase leading-tight mt-0.5">
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
  const aiStatus = useAiStatus(props.system?.services || [])
  const systemServices = aiStatus.liveServices
  const items: DashboardItem[] = []
  const [aiChooserOpen, setAiChooserOpen] = useState(false)
  const updateInfo = useUpdateAvailable()
  const rerunBanner = useBenchmarkRerunBanner()
  const queryClient = useQueryClient()
  const { aiAssistantName, authUser } = usePage<{
    aiAssistantName: string
    authUser?: AuthStatusPayload | null
  }>().props
  const { effectiveTacticalHome, currentThemeDef } = useThemeContext()

  const [pinnedServices, setPinnedServices] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('nomad:home_pinned_services')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

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
  const [activeOperator, setActiveOperator] = useState<{
    username: string
    level: string
    roleLevel: number
    shortLabel: string
  }>(() => getActiveOperator(authUser))

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
    refetchInterval: 30000,
  })

  const { data: liveTelemetry } = useQuery({
    queryKey: ['home-live-telemetry'],
    queryFn: () => api.getLiveTelemetry(),
    refetchInterval: 2000,
    staleTime: 1000,
  })

  // Storage overview for disk pools
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
    refetchInterval: 15000,
  })

  // Hardware telemetry computation (strictly real host data with 2s live updates)
  const hasTelemetry = Boolean(liveTelemetry || sysInfo)
  const activeLoad = liveTelemetry?.currentLoad ?? sysInfo?.currentLoad
  const cpuPercent = hasTelemetry
    ? Math.min(Math.max(activeLoad?.currentLoad ?? 0, 0), 100)
    : 0
  const cpuBrand = sysInfo?.cpu?.brand || (hasTelemetry ? 'Processador x86_64' : 'Coletando hardware...')
  const cpuPhysical = sysInfo?.cpu?.physicalCores ?? 0
  const cpuCores = sysInfo?.cpu?.cores ?? 0
  const cpuSpeedGHz = liveTelemetry?.cpuSpeed?.avg || sysInfo?.cpu?.speed || 0
  const cpuTempC =
    liveTelemetry?.cpuTemp?.main && liveTelemetry.cpuTemp.main > 0
      ? Math.round(liveTelemetry.cpuTemp.main)
      : null

  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  useEffect(() => {
    if (!hasTelemetry) return
    const nextVal = Math.min(Math.max(Math.round(cpuPercent), 0), 100)
    setCpuHistory((prev) => {
      const next = [...prev, nextVal]
      return next.length > 18 ? next.slice(next.length - 18) : next
    })
  }, [liveTelemetry?.timestamp, hasTelemetry])

  // Real active RAM = total - available (linux mem.used includes reclaimable page cache)
  const activeMem = liveTelemetry?.mem ?? sysInfo?.mem
  const memTotalBytes = activeMem?.total ?? 0
  const memAvailableBytes =
    activeMem?.available != null
      ? activeMem.available
      : (activeMem?.free ?? 0)
  const memUsedBytes = memTotalBytes > 0 ? Math.max(0, memTotalBytes - memAvailableBytes) : 0
  const memCacheBytes = Math.max(0, (activeMem?.used ?? memUsedBytes) - memUsedBytes)
  const memTotalGiB = memTotalBytes / (1024 ** 3)
  const memUsedGiB = memUsedBytes / (1024 ** 3)
  const memFreeGiB = memAvailableBytes / (1024 ** 3)
  const memCacheGiB = memCacheBytes / (1024 ** 3)
  const memUsedPercent =
    memTotalBytes > 0 ? Math.min(Math.max((memUsedBytes / memTotalBytes) * 100, 0), 100) : 0
  const memCachePercent =
    memTotalBytes > 0
      ? Math.min(Math.max((memCacheBytes / memTotalBytes) * 100, 0), Math.max(0, 100 - memUsedPercent))
      : 0

  const uptimeSec = Math.floor(liveTelemetry?.uptime?.uptime ?? sysInfo?.uptime?.uptime ?? 0)
  const uptimeDays = Math.floor(uptimeSec / 86400)
  const uptimeHours = Math.floor((uptimeSec % 86400) / 3600)
  const uptimeMins = Math.floor((uptimeSec % 3600) / 60)
  const uptimeDisplay = !hasTelemetry
    ? '--'
    : uptimeDays > 0
      ? `${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`
      : uptimeHours > 0
        ? `${uptimeHours}h ${uptimeMins}m`
        : `${uptimeMins}m`
  const hostNameDisplay = sysInfo?.os?.hostname || 'Nexus-NOMAD'

  const displayMountTargets: Array<{ label: string; path: string; freeBytes: number; totalBytes: number }> =
    storageOverview?.mountTargets && storageOverview.mountTargets.length > 0
      ? storageOverview.mountTargets
      : (sysInfo?.disk || [])
          .filter((d) => d.totalSize > 0)
          .map((d, i) => ({
            label: d.model || d.name || `Disco ${i + 1}`,
            path: d.filesystems?.[0]?.mount || d.name || `/disk-${i}`,
            freeBytes: Math.max(0, d.totalSize - d.totalUsed),
            totalBytes: d.totalSize,
          }))

  const totalCombinedBytes = displayMountTargets.reduce((acc, t) => acc + (t.totalBytes || 0), 0)
  const freeCombinedBytes = displayMountTargets.reduce((acc, t) => acc + (t.freeBytes || 0), 0)
  const usedCombinedBytes = Math.max(0, totalCombinedBytes - freeCombinedBytes)
  const combinedPercent = totalCombinedBytes > 0 ? (usedCombinedBytes / totalCombinedBytes) * 100 : 0
  const combinedGaugeColor =
    combinedPercent >= 85 ? '#ef4444' : combinedPercent >= 70 ? '#f59e0b' : '#06b6d4'

  const { data: activeDownloads = [] } = useDownloads({})
  const runningDownloads = activeDownloads.filter((d) => d.status !== 'failed')
  const failedDownloads = activeDownloads.filter((d) => d.status === 'failed')
  const currentActiveJob =
    runningDownloads.find((d) => d.status === 'active') || runningDownloads[0]

  const downloadRateRef = useRef<{ jobId: string; bytes: number; time: number; bps: number } | null>(null)
  const [downloadSpeedBps, setDownloadSpeedBps] = useState<number>(0)

  useEffect(() => {
    if (!currentActiveJob || currentActiveJob.status !== 'active' || !currentActiveJob.downloadedBytes) {
      downloadRateRef.current = null
      setDownloadSpeedBps(0)
      return
    }
    const now = Date.now()
    const bytes = currentActiveJob.downloadedBytes
    const prev = downloadRateRef.current
    if (prev && prev.jobId === currentActiveJob.jobId && bytes >= prev.bytes) {
      const dtSec = (now - prev.time) / 1000
      if (dtSec >= 0.8) {
        const instantBps = (bytes - prev.bytes) / dtSec
        const smoothed = prev.bps > 0 ? prev.bps * 0.4 + instantBps * 0.6 : instantBps
        downloadRateRef.current = { jobId: currentActiveJob.jobId, bytes, time: now, bps: smoothed }
        setDownloadSpeedBps(smoothed)
      }
    } else {
      downloadRateRef.current = { jobId: currentActiveJob.jobId, bytes, time: now, bps: 0 }
      setDownloadSpeedBps(0)
    }
  }, [currentActiveJob?.jobId, currentActiveJob?.status, currentActiveJob?.downloadedBytes])

  const activeDownloadTitle = currentActiveJob
    ? currentActiveJob.title ||
      (currentActiveJob.filepath
        ? currentActiveJob.filepath.split(/[/\\]/).pop()?.replace(/\.(tmp|zim|pmtiles|gguf)$/i, '')
        : currentActiveJob.url) || 'Pacote de Dados'
  : null
  const activeDownloadPercent = currentActiveJob ? Math.round(currentActiveJob.progress || 0) : 0

  type SplitMergePhase = 'idle' | 'splitting-out' | 'merging-out' | 'split-in' | 'merge-in'
  const [diskTransitionPhase, setDiskTransitionPhase] = useState<SplitMergePhase>('idle')
  const [cpuTransitionPhase, setCpuTransitionPhase] = useState<SplitMergePhase>('idle')
  const diskAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cpuAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (diskAnimTimerRef.current) clearTimeout(diskAnimTimerRef.current)
      if (cpuAnimTimerRef.current) clearTimeout(cpuAnimTimerRef.current)
    }
  }, [])

  const handleTogglePoolsCombined = () => {
    if (diskAnimTimerRef.current) clearTimeout(diskAnimTimerRef.current)
    const willSplit = dashboardConfig.poolsCombined
    setDiskTransitionPhase(willSplit ? 'splitting-out' : 'merging-out')
    diskAnimTimerRef.current = setTimeout(() => {
      saveDashboardConfig({
        ...dashboardConfig,
        poolsCombined: !willSplit,
      })
      setDiskTransitionPhase(willSplit ? 'split-in' : 'merge-in')
      diskAnimTimerRef.current = setTimeout(() => {
        setDiskTransitionPhase('idle')
      }, 740)
    }, willSplit ? 420 : 480)
  }

  const handleToggleCpuCombined = () => {
    if (cpuAnimTimerRef.current) clearTimeout(cpuAnimTimerRef.current)
    const willSplit = dashboardConfig.cpuCombined
    setCpuTransitionPhase(willSplit ? 'splitting-out' : 'merging-out')
    cpuAnimTimerRef.current = setTimeout(() => {
      saveDashboardConfig({
        ...dashboardConfig,
        cpuCombined: !willSplit,
      })
      setCpuTransitionPhase(willSplit ? 'split-in' : 'merge-in')
      cpuAnimTimerRef.current = setTimeout(() => {
        setCpuTransitionPhase('idle')
      }, 740)
    }, willSplit ? 420 : 480)
  }

  const handleOpenAiHub = () => {
    if (!aiStatus.hasAnyAi) {
      router.visit('/settings/models')
      return
    }
    if (aiStatus.onlineEngines.length === 1) {
      const active = aiStatus.onlineEngines[0]
      if (active.isInternal) {
        router.visit(active.href)
      } else if (active.href) {
        window.open(active.href, '_blank', 'noopener,noreferrer')
      }
      return
    }
    if (aiStatus.hasMultiple) {
      setAiChooserOpen(true)
      return
    }
    const targetEngine = aiStatus.primaryEngine
    if (targetEngine?.isInternal) {
      router.visit(targetEngine.href)
    } else if (targetEngine?.href) {
      window.open(targetEngine.href, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    const syncOp = () => {
      const op = getActiveOperator(authUser)
      setActiveOperator({
        username: op?.username?.trim() || 'Operador',
        level: op?.level || 'NÍVEL 05 // ADMIN TOTAL',
        roleLevel: op?.roleLevel ?? 5,
        shortLabel: op?.shortLabel || 'Admin Total',
      })
    }
    syncOp()
    window.addEventListener('nomad:operator-updated', syncOp)
    return () => window.removeEventListener('nomad:operator-updated', syncOp)
  }, [authUser])

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

  systemServices
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
  systemServices
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

  const installedAppCount = systemServices.filter((s) => s.installed).length

  return (
    <AppLayout>
      <Head title="Centro de Comando" />
      {updateInfo?.updateAvailable && (
        <div className="flex justify-center items-center px-4 sm:px-6 pt-4 w-full max-w-[85rem] mx-auto">
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
        <div className="flex justify-center items-center px-4 sm:px-6 pt-4 w-full max-w-[85rem] mx-auto">
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
           PAINEL DE CONTROLE N.O.M.A.D. (PROPORÇÃO EQUILIBRADA & TEMPO REAL)
           ==================================================================== */
        <div className="max-w-[85rem] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
          {/* 1. BARRA OPERACIONAL COMPACTA */}
          <div className="nomad-hud-header flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border-default bg-surface-primary shadow-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 nomad-telemetry-dot" />
                <span className="text-text-muted">Autorização:</span>
                <strong className="text-text-primary">{activeOperator.level}</strong>
              </span>
              <span className="text-border-default hidden sm:inline">•</span>
              <span>
                Operador: <strong className="text-text-primary">{activeOperator.username}</strong>
              </span>
              <span className="text-border-default hidden sm:inline">•</span>
              <span>
                Host: <strong className="text-desert-tan font-mono">{hostNameDisplay}</strong>
              </span>
              <span className="text-border-default hidden sm:inline">•</span>
              <span>
                Uptime: <strong className="text-text-primary font-mono tabular-nums">{uptimeDisplay}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/easy-setup"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  shouldHighlightEasySetup
                    ? 'bg-desert-orange text-white border-desert-orange hover:bg-desert-orange-light shadow-sm'
                    : 'bg-surface-secondary border-border-default hover:border-desert-green text-text-primary'
                }`}
              >
                <IconBolt size={14} />
                <span>Configuração Inicial</span>
              </Link>
              <button
                type="button"
                onClick={() => setDashboardModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-surface-secondary hover:border-desert-tan text-text-primary cursor-pointer transition-colors"
              >
                <IconAdjustments size={14} className="text-desert-tan" />
                <span>Personalizar Painel</span>
              </button>
            </div>
          </div>

          {/* CHAMADA NATIVA DE CONFIGURAÇÃO INICIAL (EXIBIDA QUANDO PENDENTE) */}
          {shouldHighlightEasySetup && (
            <div className="rounded-xl border border-desert-orange/60 bg-surface-primary p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-desert-orange/15 text-desert-orange shrink-0">
                  <IconBolt size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-text-primary">
                      Configuração Inicial Guiada do N.O.M.A.D.
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-desert-orange/20 text-desert-orange text-xs font-semibold">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                    Configure em minutos seus acervos offline, Wikipédia em português, mapas vetoriais regionais e modelos de IA local.
                  </p>
                </div>
              </div>
              <Link
                href="/easy-setup"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-desert-orange hover:bg-desert-orange-light text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-sm"
              >
                <span>Iniciar Configuração</span>
                <IconArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* 2. TELEMETRIA EM TEMPO REAL & ARMAZENAMENTO CONSOLIDADO */}
          <section className="space-y-4 overflow-x-clip">
            {/* Pools & Discos Físicos */}
            {dashboardConfig.pools && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <IconDatabase size={16} className="text-desert-tan" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                      Armazenamento &amp; Discos Físicos
                    </h2>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleTogglePoolsCombined}
                      disabled={diskTransitionPhase !== 'idle'}
                      title={
                        dashboardConfig.poolsCombined
                          ? 'Separar os discos físicos em cartões individuais com animação'
                          : 'Unificar todos os discos em uma única visualização'
                      }
                      className="group px-3 py-1 rounded-md text-xs font-semibold border border-border-default bg-surface-secondary hover:border-desert-tan text-text-secondary hover:text-text-primary transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-75"
                    >
                      {diskTransitionPhase === 'splitting-out' || diskTransitionPhase === 'split-in' ? (
                        <>
                          <IconLayoutGrid size={14} className="text-desert-tan" />
                          <span>Separando...</span>
                        </>
                      ) : diskTransitionPhase === 'merging-out' || diskTransitionPhase === 'merge-in' ? (
                        <>
                          <IconBox size={14} className="text-desert-tan" />
                          <span>Unificando...</span>
                        </>
                      ) : dashboardConfig.poolsCombined ? (
                        <>
                          <IconLayoutGrid size={14} className="text-desert-tan" />
                          <span>Ver Separados</span>
                        </>
                      ) : (
                        <>
                          <IconBox size={14} className="text-desert-tan" />
                          <span>Unificar Discos</span>
                        </>
                      )}
                    </button>
                    <Link
                      href="/settings/system#discos"
                      className="text-xs font-medium text-desert-olive hover:text-desert-tan hover:underline transition-colors"
                    >
                      Gerenciar Discos →
                    </Link>
                  </div>
                </div>

                {displayMountTargets.length === 0 ? (
                  <div className="rounded-xl border border-border-default bg-surface-primary p-5 text-xs text-text-muted">
                    Coletando telemetria real dos discos físicos conectados...
                  </div>
                ) : dashboardConfig.poolsCombined ? (
                  /* NOVA VISUALIZAÇÃO UNIFICADA REAL (1 ÚNICO CARD COESO) */
                  <div
                    className={`rounded-xl border border-border-default border-t-2 border-t-desert-tan bg-surface-primary p-4 sm:p-5 shadow-sm transition-colors ${
                      diskTransitionPhase === 'splitting-out'
                        ? 'nomad-split-pre-exit'
                        : diskTransitionPhase === 'merge-in'
                          ? 'nomad-merge-lock'
                          : 'nomad-telemetry-panel'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                      {/* Bloco Esquerdo: Gauge Consolidado Único */}
                      <div className="flex items-center gap-4 lg:w-[300px] lg:pr-5 lg:border-r border-border-default/60 shrink-0">
                        <CircularGauge
                          percentage={combinedPercent}
                          size={96}
                          strokeWidth={9}
                          color={combinedGaugeColor}
                          label={`${combinedPercent.toFixed(1)}%`}
                          sublabel="TOTAL"
                        />
                        <div className="space-y-1 min-w-0">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-desert-tan">
                            {displayMountTargets.length}{' '}
                            {displayMountTargets.length === 1 ? 'Disco Conectado' : 'Discos Unificados'}
                          </span>
                          <div className="text-base font-bold text-text-primary">
                            Pool Global
                          </div>
                          <div className="text-xs text-text-secondary font-mono tabular-nums">
                            Usado: <strong className="text-text-primary">{formatBytes(usedCombinedBytes)}</strong>
                          </div>
                          <div className="text-xs text-text-secondary font-mono tabular-nums">
                            Livre: <strong className="text-emerald-400">{formatBytes(freeCombinedBytes)}</strong> de {formatBytes(totalCombinedBytes)}
                          </div>
                        </div>
                      </div>

                      {/* Bloco Direito: Barra Segmentada Única + Lista Compacta de Volumes */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Barra horizontal multi-disco comparativa */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                            <span className="font-medium text-text-primary">
                              Ocupação Consolidada ({formatBytes(usedCombinedBytes)} / {formatBytes(totalCombinedBytes)})
                            </span>
                            <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                              {formatBytes(freeCombinedBytes)} disponíveis
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-surface-secondary border border-border-default/60 overflow-hidden flex">
                            {displayMountTargets.map((target, idx) => {
                              const free = target.freeBytes || 0
                              const total = target.totalBytes || 1
                              const used = Math.max(0, total - free)
                              const sharePct = totalCombinedBytes > 0 ? (used / totalCombinedBytes) * 100 : 0
                              const palette = ['#06b6d4', '#c2a677', '#22c55e', '#f59e0b']
                              if (sharePct <= 0) return null
                              return (
                                <div
                                  key={target.path}
                                  title={`${target.path}: ${formatBytes(used)} em uso`}
                                  className="h-full transition-all duration-700 nomad-progress-shimmer"
                                  style={{
                                    width: `${Math.max(sharePct, 1)}%`,
                                    backgroundColor: palette[idx % palette.length],
                                  }}
                                />
                              )
                            })}
                          </div>
                        </div>

                        {/* Linhas compactas por volume dentro do mesmo card */}
                        <div className="divide-y divide-border-subtle/70 rounded-lg border border-border-subtle bg-surface-secondary/60">
                          {displayMountTargets.map((target, idx) => {
                            const total = target.totalBytes || 1
                            const free = target.freeBytes || 0
                            const used = Math.max(0, total - free)
                            const usedPercent = Math.min(Math.max((used / total) * 100, 0), 100)
                            const isInternal =
                              target.path === '/app/storage' ||
                              target.path === '/storage' ||
                              target.label.toLowerCase().includes('interno')
                            const poolTitle = isInternal
                              ? 'NVMe Sistema (Interno)'
                              : `Disco Secundário (HD ${idx})`
                            const dotPalette = ['bg-cyan-400', 'bg-desert-tan', 'bg-emerald-400', 'bg-amber-400']

                            return (
                              <div
                                key={target.path}
                                className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotPalette[idx % dotPalette.length]}`} />
                                  <span className="font-semibold text-text-primary">{poolTitle}</span>
                                  <code className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle font-mono text-text-secondary">
                                    {target.path}
                                  </code>
                                  <span className="hidden sm:inline text-text-muted">
                                    • {isInternal ? 'Sistema & Docker' : 'Dados & Acervo'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 font-mono tabular-nums ml-auto">
                                  <span className="text-text-secondary">
                                    <strong className="text-text-primary">{formatBytes(used)}</strong> / {formatBytes(total)}
                                  </span>
                                  <span className="text-emerald-400 font-semibold hidden sm:inline">
                                    {formatBytes(free)} livres
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-surface-primary border border-border-default font-bold text-text-primary w-14 text-center">
                                    {usedPercent.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border-default/50 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Unidades Online &amp; Saudáveis</span>
                        </span>
                        <span className="hidden sm:inline">• Mapeamento em lote ativo • Erros FS: 0</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Link
                          href="/settings/storage"
                          className="font-semibold text-desert-tan hover:text-desert-orange inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Configurar Discos &amp; Samba</span>
                          <IconArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODO CARDS SEPARADOS (OPCIONAL VIA BOTÃO) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        ? 'NVMe Sistema (Interno)'
                        : `Disco Secundário (HD ${idx})`

                      const splitCardAnimClass =
                        diskTransitionPhase === 'merging-out'
                          ? idx % 2 === 0
                            ? 'nomad-merge-pre-left'
                            : 'nomad-merge-pre-right'
                          : diskTransitionPhase === 'split-in'
                            ? idx % 2 === 0
                              ? 'nomad-split-wing-left'
                              : 'nomad-split-wing-right'
                            : 'nomad-telemetry-panel'

                      return (
                        <div
                          key={target.path}
                          className={`rounded-xl border border-border-default border-t-2 border-t-desert-tan bg-surface-primary p-4 flex flex-col justify-between shadow-sm ${splitCardAnimClass}`}
                        >
                          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border-default text-desert-tan font-semibold">
                                DISCO {idx + 1}
                              </span>
                              <span className="font-bold text-sm text-text-primary truncate">
                                {poolTitle}
                              </span>
                            </div>
                            <Link
                              href="/settings/system#discos"
                              title="Detalhes de particionamento"
                              className="text-text-muted hover:text-desert-tan p-1 transition-colors"
                            >
                              <IconAdjustments size={15} />
                            </Link>
                          </div>

                          <div className="flex items-center gap-4">
                            <CircularGauge
                              percentage={usedPercent}
                              size={88}
                              strokeWidth={8}
                              color={gaugeColor}
                              label={`${usedPercent.toFixed(1)}%`}
                              sublabel="USO"
                            />
                            <div className="space-y-1.5 min-w-0 text-xs flex-1">
                              <div className="text-text-secondary truncate">
                                Ponto: <code className="font-mono font-semibold text-text-primary">{target.path}</code>
                              </div>
                              <div className="text-text-secondary font-mono tabular-nums">
                                Em Uso: <strong className="text-text-primary">{formatBytes(used)}</strong>
                              </div>
                              <div className="text-text-secondary font-mono tabular-nums">
                                Livre: <strong className="text-emerald-400">{formatBytes(free)}</strong> de {formatBytes(total)}
                              </div>
                              <div className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold pt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Online // Saudável</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Linha de Processamento (Tempo Real 2s), Memória RAM (Matemática Correta) e Log/Fila */}
            {(() => {
              const hwCount =
                (dashboardConfig.cpuCombined
                  ? 1
                  : (dashboardConfig.cpuUsage ? 1 : 0) + (dashboardConfig.cpuModel ? 1 : 0)) +
                (dashboardConfig.memory ? 1 : 0) +
                (dashboardConfig.eventLog ? 1 : 0)
              if (hwCount === 0) return null
              const hwColSpan =
                hwCount === 1
                  ? 'lg:col-span-12'
                  : hwCount === 2
                    ? 'lg:col-span-6'
                    : hwCount === 3
                      ? 'lg:col-span-4'
                      : 'lg:col-span-3'

              const ramColor =
                memUsedPercent >= 85 ? '#ef4444' : memUsedPercent >= 65 ? '#f59e0b' : '#22c55e'
              const cpuColor =
                cpuPercent >= 85 ? '#ef4444' : cpuPercent >= 60 ? '#f59e0b' : '#06b6d4'

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  {/* CPU: MODO UNIFICADO EM TEMPO REAL */}
                  {dashboardConfig.cpuCombined ? (
                    <div
                      className={`${hwColSpan} rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between shadow-sm hover:border-desert-tan/70 ${
                        cpuTransitionPhase === 'splitting-out'
                          ? 'nomad-split-pre-exit'
                          : cpuTransitionPhase === 'merge-in'
                            ? 'nomad-merge-lock'
                            : 'nomad-telemetry-panel'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                        <div className="flex items-center gap-2">
                          <IconCpu size={16} className="text-cyan-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                            Processador (CPU)
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[0.6875rem] font-mono font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            AO VIVO
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleCpuCombined}
                          disabled={cpuTransitionPhase !== 'idle'}
                          title="Separar carga e modelo em 2 cards com animação"
                          className="text-xs text-text-muted hover:text-desert-tan cursor-pointer font-medium transition-colors disabled:opacity-75"
                        >
                          {cpuTransitionPhase === 'splitting-out' || cpuTransitionPhase === 'split-in'
                            ? 'Separando...'
                            : 'Separar'}
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <CircularGauge
                          percentage={cpuPercent}
                          size={88}
                          strokeWidth={8}
                          color={cpuColor}
                          label={hasTelemetry ? `${Math.round(cpuPercent)}%` : '--'}
                          sublabel="CARGA"
                        />
                        <div className="space-y-1 min-w-0 flex-1 text-xs">
                          <div className="text-sm font-bold text-text-primary truncate" title={cpuBrand}>
                            {cpuBrand}
                          </div>
                          <div className="text-text-secondary font-mono tabular-nums">
                            {hasTelemetry ? `${cpuPhysical} Cores / ${cpuCores} Threads` : '-- Cores / -- Threads'}
                          </div>
                          <div className="text-text-secondary font-mono tabular-nums">
                            Clock: <strong className="text-text-primary">{hasTelemetry ? `${Number(cpuSpeedGHz).toFixed(2)} GHz` : '--'}</strong>
                            {cpuTempC !== null && (
                              <span className="ml-2 text-desert-tan">• {cpuTempC}°C</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini Gráfico de Pulso em Tempo Real (2s) */}
                      <div className="pt-3 mt-3 border-t border-border-default/50">
                        <div className="flex items-end gap-1 h-7 mb-1.5" aria-label="Histórico de uso da CPU em tempo real">
                          {Array.from({ length: 18 }).map((_, idx) => {
                            const offset = 18 - cpuHistory.length
                            const val = idx >= offset ? cpuHistory[idx - offset] : 0
                            const hasVal = idx >= offset
                            return (
                              <div
                                key={idx}
                                className="flex-1 h-full bg-surface-secondary rounded-xs flex items-end overflow-hidden"
                              >
                                <div
                                  className="w-full rounded-xs transition-all duration-300"
                                  style={{
                                    height: hasVal ? `${Math.max(val, 8)}%` : '10%',
                                    backgroundColor: hasVal
                                      ? val >= 85
                                        ? '#ef4444'
                                        : val >= 60
                                          ? '#f59e0b'
                                          : '#06b6d4'
                                      : 'rgba(255,255,255,0.08)',
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>Atualização a cada 2s</span>
                          <span className="text-emerald-400 font-semibold">
                            {!hasTelemetry
                              ? 'Conectando...'
                              : cpuPercent < 20
                                ? 'Operação Estável'
                                : cpuPercent < 75
                                  ? 'Em Processamento'
                                  : 'Carga Elevada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CPU: MODO SEPARADO (2 CARDS) */
                    <>
                      {dashboardConfig.cpuUsage && (
                        <div
                          className={`${hwColSpan} rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between shadow-sm hover:border-desert-tan/70 ${
                            cpuTransitionPhase === 'merging-out'
                              ? 'nomad-merge-pre-left'
                              : cpuTransitionPhase === 'split-in'
                                ? 'nomad-split-wing-left'
                                : 'nomad-telemetry-panel'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                            <div className="flex items-center gap-2">
                              <IconCpu size={16} className="text-cyan-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                Utilização da CPU
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleToggleCpuCombined}
                              disabled={cpuTransitionPhase !== 'idle'}
                              title="Unificar carga e modelo com animação"
                              className="text-xs text-text-muted hover:text-desert-tan cursor-pointer font-medium transition-colors disabled:opacity-75"
                            >
                              {cpuTransitionPhase === 'merging-out' || cpuTransitionPhase === 'merge-in'
                                ? 'Unificando...'
                                : 'Unificar'}
                            </button>
                          </div>
                          <div className="flex items-center justify-center py-2">
                            <CircularGauge
                              percentage={cpuPercent}
                              size={94}
                              strokeWidth={9}
                              color={cpuColor}
                              label={hasTelemetry ? `${Math.round(cpuPercent)}%` : '--'}
                              sublabel="AO VIVO"
                            />
                          </div>
                          <div className="pt-2.5 border-t border-border-default/50 flex items-center justify-between text-xs text-text-muted">
                            <span>Pulso: 2s</span>
                            <span className="text-emerald-400 font-semibold font-mono tabular-nums">
                              {hasTelemetry ? `${Number(cpuSpeedGHz).toFixed(2)} GHz` : '--'}
                            </span>
                          </div>
                        </div>
                      )}

                      {dashboardConfig.cpuModel && (
                        <div
                          className={`${hwColSpan} rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between shadow-sm hover:border-desert-tan/70 ${
                            cpuTransitionPhase === 'merging-out'
                              ? 'nomad-merge-pre-right'
                              : cpuTransitionPhase === 'split-in'
                                ? 'nomad-split-wing-right'
                                : 'nomad-telemetry-panel'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                              Processador Host
                            </span>
                            <span className="text-xs font-mono text-desert-olive font-semibold">
                              {sysInfo?.os?.arch || 'x86_64'}
                            </span>
                          </div>
                          <div className="py-1 space-y-2 text-xs">
                            <div className="text-sm font-bold text-text-primary line-clamp-2" title={cpuBrand}>
                              {cpuBrand}
                            </div>
                            <div className="text-text-secondary font-mono tabular-nums">
                              Núcleos:{' '}
                              <strong className="text-desert-tan">
                                {hasTelemetry ? `${cpuPhysical} Cores / ${cpuCores} Threads` : '--'}
                              </strong>
                            </div>
                            <div className="text-text-secondary font-mono tabular-nums">
                              Frequência: <strong className="text-text-primary">{hasTelemetry ? `${Number(cpuSpeedGHz).toFixed(2)} GHz` : '--'}</strong>
                            </div>
                          </div>
                          <div className="pt-2.5 border-t border-border-default/50 flex items-center justify-between text-xs text-text-muted">
                            <span>Temperatura</span>
                            <span className="text-emerald-400 font-semibold">
                              {cpuTempC !== null ? `${cpuTempC}°C` : 'Nominal'}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* MEMÓRIA RAM REAL (CORRIGIDA: Em Uso Real = Total - Disponível) */}
                  {dashboardConfig.memory && (
                    <div className={`${hwColSpan} nomad-telemetry-panel rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between shadow-sm hover:border-desert-tan/70`}>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                        <div className="flex items-center gap-2">
                          <IconActivity size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                            Memória RAM
                          </span>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-text-secondary font-semibold">
                          {hasTelemetry ? `${memTotalGiB.toFixed(1)} GiB Total` : '-- GiB'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <CircularGauge
                          percentage={memUsedPercent}
                          size={88}
                          strokeWidth={8}
                          color={ramColor}
                          label={hasTelemetry ? `${Math.round(memUsedPercent)}%` : '--'}
                          sublabel="EM USO"
                        />
                        <div className="space-y-1.5 text-xs flex-1 min-w-0 font-mono tabular-nums">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-text-secondary font-sans">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                              Em Uso:
                            </span>
                            <strong className="text-text-primary">
                              {hasTelemetry ? `${memUsedGiB.toFixed(1)} GiB` : '--'}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-text-secondary font-sans">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                              Disponível:
                            </span>
                            <strong className="text-emerald-400">
                              {hasTelemetry ? `${memFreeGiB.toFixed(1)} GiB` : '--'}
                            </strong>
                          </div>
                          {memCacheGiB >= 0.2 && (
                            <div className="flex items-center justify-between gap-2 text-text-muted">
                              <span className="font-sans">Cache Linux:</span>
                              <span>{memCacheGiB.toFixed(1)} GiB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Barra visual real da RAM (Uso Ativo + Cache Recuperável + Livre) */}
                      <div className="pt-3 mt-3 border-t border-border-default/50 space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-surface-secondary border border-border-subtle overflow-hidden flex">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${Math.max(memUsedPercent, hasTelemetry ? 2 : 0)}%`, backgroundColor: ramColor }}
                            title={`Em uso ativo: ${memUsedGiB.toFixed(1)} GiB`}
                          />
                          {memCachePercent > 0 && (
                            <div
                              className="h-full bg-desert-tan/40 transition-all duration-500"
                              style={{ width: `${memCachePercent}%` }}
                              title={`Cache recuperável do OS: ${memCacheGiB.toFixed(1)} GiB`}
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>Tempo real (2s)</span>
                          <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                            {hasTelemetry ? `${memFreeGiB.toFixed(1)} GiB livres` : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOG DE EVENTOS & FILA DE DOWNLOADS */}
                  {dashboardConfig.eventLog && (
                    <div className={`${hwColSpan} nomad-telemetry-panel rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between shadow-sm hover:border-desert-tan/70`}>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border-default/60">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Log de Eventos &amp; Fila
                        </span>
                        <TacticalClock />
                      </div>

                      <div className="rounded-lg border border-border-subtle bg-surface-secondary/70 p-3 text-xs space-y-2 text-text-secondary flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-2">
                          <span>Serviços Ativos:</span>
                          <strong className="font-mono text-text-primary flex items-center gap-1.5">
                            <span>{installedAppCount} ativos •</span>
                            <span
                              className={
                                aiStatus.isLiveOnline
                                  ? 'text-emerald-400'
                                  : aiStatus.hasAnyAi
                                    ? 'text-amber-400'
                                    : 'text-desert-orange'
                              }
                            >
                              {aiStatus.logStatusShort}
                            </span>
                          </strong>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle text-[0.6875rem]">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              aiStatus.isLiveOnline
                                ? 'bg-emerald-400 animate-pulse'
                                : aiStatus.hasAnyAi
                                  ? 'bg-amber-400'
                                  : 'bg-text-muted'
                            }`}
                          />
                          <span className="truncate font-mono text-text-secondary" title={aiStatus.logConnectionDetail}>
                            {aiStatus.logConnectionDetail}
                          </span>
                        </div>

                        {runningDownloads.length > 0 && currentActiveJob ? (
                          <div className="space-y-1.5 pt-1 border-t border-border-subtle">
                            <div className="flex items-center justify-between gap-2 font-semibold">
                              <span className="flex items-center gap-1.5 truncate text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <span className="truncate text-text-primary" title={activeDownloadTitle || ''}>
                                  {activeDownloadTitle}
                                </span>
                              </span>
                              <span className="font-mono text-emerald-400 shrink-0">
                                {activeDownloadPercent}%
                              </span>
                            </div>

                            <div className="relative h-2 w-full bg-surface-primary rounded-full overflow-hidden border border-border-default/50">
                              <div
                                className="h-full bg-gradient-to-r from-desert-olive via-emerald-500 to-desert-tan rounded-full transition-all duration-500 ease-out nomad-progress-shimmer"
                                style={{ width: `${Math.max(activeDownloadPercent, 3)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs text-text-muted gap-2 font-mono">
                              <span className="truncate">
                                {currentActiveJob.downloadedBytes && currentActiveJob.totalBytes
                                  ? `${formatBytes(currentActiveJob.downloadedBytes)} / ${formatBytes(currentActiveJob.totalBytes)}`
                                  : `${activeDownloadPercent}% concluído`}
                                {downloadSpeedBps > 0 && (
                                  <strong className="text-desert-tan ml-1">• {formatBytes(downloadSpeedBps)}/s</strong>
                                )}
                              </span>
                              {runningDownloads.length > 1 && (
                                <Link
                                  href="/settings/downloads"
                                  className="text-desert-orange hover:underline shrink-0 font-sans font-medium"
                                >
                                  +{runningDownloads.length - 1} na fila →
                                </Link>
                              )}
                            </div>
                          </div>
                        ) : failedDownloads.length > 0 ? (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle">
                            <span>Fila de Downloads:</span>
                            <Link
                              href="/settings/downloads"
                              className="text-red-400 hover:underline font-semibold"
                            >
                              {failedDownloads.length} erro(s) — Ver Log →
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle">
                            <span>Fila de Downloads:</span>
                            <span className="text-emerald-400 font-medium">Livre / Pronta</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-border-default/50 flex items-center justify-between text-xs text-text-muted">
                        <span>Tema: {currentThemeDef.shortName}</span>
                        <Link
                          href="/settings/downloads"
                          className="text-desert-tan hover:underline font-medium"
                        >
                          Gerenciar Fila →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </section>

          {/* 3. CENTRAIS DE OPERAÇÃO & NAVEGAÇÃO (GRID SIMÉTRICO 4x2 INCLUINDO EASY SETUP) */}
          {dashboardConfig.commandHub && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-border-default/70 pb-2">
                <div className="flex items-center gap-2">
                  <IconLayoutGrid size={17} className="text-desert-tan" />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-text-primary">
                    Centrais de Operação &amp; Navegação
                  </h2>
                </div>
                <span className="text-xs text-text-muted hidden sm:inline">
                  Acesso rápido aos ambientes nativos do N.O.M.A.D.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 nomad-stagger-grid">
                {/* 1. Configuração Inicial (Nativo NOMAD) */}
                <Link
                  href="/easy-setup"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-orange transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-desert-orange/15 text-desert-orange font-semibold border border-desert-orange/30">
                        {shouldHighlightEasySetup ? 'Comece Aqui' : 'Assistente Nativo'}
                      </span>
                      <IconBolt size={20} className="text-desert-orange group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-orange transition-colors">
                      Configuração Inicial
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Assistente passo a passo para instalar Wikipédia, pacotes offline, mapas e IA.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-orange">
                    <span>Abrir Assistente</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>

                {/* 2. Central de Aplicativos */}
                <Link
                  href="/supply-depot"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-orange transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-desert-orange/15 text-desert-orange font-semibold border border-desert-orange/30">
                        {installedAppCount} ativos / {APP_CATALOG.length} apps
                      </span>
                      <IconBox size={20} className="text-desert-orange group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-orange transition-colors">
                      Central de Aplicativos
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Instale e gerencie ferramentas off-grid e contêineres Docker em 1 clique.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-orange">
                    <span>Abrir Supply Depot</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>

                {/* 3. Catálogo & Guias */}
                <button
                  type="button"
                  onClick={() => openAppCatalog()}
                  className="nomad-interactive-card text-left rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-tan transition-all group shadow-sm cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-desert-tan/15 text-desert-tan font-semibold border border-desert-tan/30">
                        {APP_CATALOG.length} guias PT-BR
                      </span>
                      <IconBook size={20} className="text-desert-tan group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-tan transition-colors">
                      Catálogo &amp; Guias
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Manuais de sobrevivência, documentação das aplicações e guias técnicos offline.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-tan w-full">
                    <span>Explorar Guias</span>
                    <IconArrowRight size={15} />
                  </div>
                </button>

                {/* 4. Discos & Armazenamento */}
                <Link
                  href="/settings/storage"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-tan transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 nomad-status-online-text font-semibold border border-emerald-500/30">
                        Multi-HD &amp; Samba
                      </span>
                      <IconServer size={20} className="nomad-status-online-text group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-emerald-400 transition-colors">
                      Discos &amp; Samba SMB
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Navegue pastas, defina disco padrão para downloads e configure rede SMB.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold nomad-status-online-text">
                    <span>Gerenciar Storage</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>

                {/* 5. Mapas Offline */}
                <Link
                  href="/maps"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-tan transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-secondary text-desert-tan font-semibold border border-border-default">
                        PMTiles Vetorial
                      </span>
                      <IconCompass size={20} className="text-desert-tan group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-tan transition-colors">
                      Mapas Offline
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Navegação cartográfica regional sem internet com marcadores personalizados.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-tan">
                    <span>Abrir Cartografia</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>

                {/* 6. Assistente de IA Local */}
                <button
                  type="button"
                  onClick={handleOpenAiHub}
                  className="nomad-interactive-card text-left rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-olive transition-all group shadow-sm cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          aiStatus.isLiveOnline
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : aiStatus.hasAnyAi
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-desert-orange/15 text-desert-orange border-desert-orange/30'
                        }`}
                      >
                        {aiStatus.cardBadgeText}
                      </span>
                      <IconBrain size={20} className="text-desert-olive group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-olive transition-colors">
                      Assistente de IA Local
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {aiStatus.cardDescription}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-olive">
                    <span>{aiStatus.cardActionLabel}</span>
                    <IconArrowRight size={15} />
                  </div>
                </button>

                {/* 7. Gerenciador de Downloads */}
                <Link
                  href="/settings/downloads"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-tan transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          failedDownloads.length > 0
                            ? 'bg-red-500/15 text-red-400 border-red-500/35'
                            : 'bg-surface-secondary text-desert-tan border-border-default'
                        }`}
                      >
                        {runningDownloads.length > 0
                          ? `${runningDownloads.length} na fila`
                          : failedDownloads.length > 0
                            ? `${failedDownloads.length} falha(s)`
                            : 'Auto-Retomada 3x'}
                      </span>
                      <IconDownload size={20} className="text-desert-tan group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-tan transition-colors">
                      Downloads &amp; Logs
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Monitore acervos ZIM, mapas, modelos, logs em PT-BR e erros com auto-envio ao fim da fila.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-tan">
                    <span>Gerenciar Fila &amp; Logs</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>

                {/* 8. Configurações do Sistema */}
                <Link
                  href="/settings/system"
                  className="nomad-interactive-card rounded-xl border border-border-default bg-surface-primary p-4 flex flex-col justify-between hover:border-desert-tan transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-secondary text-text-secondary font-semibold border border-border-default">
                        Sistema &amp; Atualizações
                      </span>
                      <IconSettings size={20} className="text-desert-tan group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-tan transition-colors">
                      Configurações Gerais
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      Hardware, atualizações Docker, temas visuais, Portainer e benchmark.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-desert-tan">
                    <span>Abrir Configurações</span>
                    <IconArrowRight size={15} />
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* 4. MÓDULOS OPERACIONAIS FIXADOS */}
          {dashboardConfig.pinnedModules && (
            <section className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default/70 pb-2">
                <div className="flex items-center gap-2">
                  <IconStarFilled size={16} className="text-desert-tan" />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-text-primary">
                    Módulos Fixados &amp; Atalhos de Rede
                  </h2>
                </div>
                <span className="text-xs text-text-muted hidden sm:inline">
                  Clique na estrela em qualquer módulo para fixar aqui
                </span>
              </div>

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 nomad-stagger-grid">
                    {displayedItems.map((item) => {
                      const isPinned = pinnedServices.includes(item.serviceName || item.label)
                      const isLinkTile = Boolean(item.linkTile)
                      const isKiwix =
                        item.serviceName === SERVICE_NAMES.KIWIX ||
                        item.label.toLowerCase().includes('kiwix')

                      const cardContent = (
                        <div className="rounded-xl border border-border-default bg-surface-primary nomad-interactive-card relative p-4 flex flex-col justify-between transition-all hover:border-desert-tan group h-full shadow-sm">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border-subtle">
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
                                <span className="text-xs font-semibold text-desert-olive truncate">
                                  {item.categoryTag || 'Módulo NOMAD'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 my-1.5">
                              <div className="p-2 rounded-lg bg-surface-secondary border border-border-subtle text-desert-tan group-hover:text-text-primary transition-colors shrink-0">
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-desert-tan transition-colors truncate">
                                  {item.label}
                                </h3>
                                {item.poweredBy && (
                                  <div className="text-xs text-desert-olive mt-0.5 truncate">
                                    {item.poweredBy}
                                  </div>
                                )}
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            {/* Busca rápida direta no Kiwix */}
                            {isKiwix && (() => {
                              const openKiwixTarget = () => {
                                const baseUrl = item.to.replace(/\/+$/, '')
                                const q = kiwixQuery.trim()
                                const url = q
                                  ? `${baseUrl}/search?pattern=${encodeURIComponent(q)}`
                                  : item.to
                                window.open(url, '_blank', 'noopener,noreferrer')
                              }
                              return (
                                <div
                                  className="rounded-lg border border-border-default bg-surface-secondary p-1.5 my-2.5 flex items-center gap-2"
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
                                        e.stopPropagation()
                                        openKiwixTarget()
                                      }
                                    }}
                                    placeholder="Buscar no Kiwix..."
                                    className="bg-transparent text-xs text-text-primary focus:outline-none w-full placeholder:text-text-muted"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openKiwixTarget()
                                    }}
                                    className="px-2.5 py-1 rounded bg-desert-tan text-black text-xs font-bold hover:brightness-110 shrink-0 cursor-pointer"
                                  >
                                    Abrir
                                  </button>
                                </div>
                              )
                            })()}
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-border-subtle flex items-center justify-between">
                            <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Pronto
                            </span>

                            <div className="flex items-center gap-1 text-xs font-semibold text-desert-tan group-hover:translate-x-0.5 transition-transform">
                              <span>Acessar</span>
                              <IconArrowUpRight size={15} />
                            </div>
                          </div>
                        </div>
                      );

                      if (isLinkTile && item.linkTile) {
                        const tile = item.linkTile
                        const confirming = pendingDelete === tile.service_name

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
                      className="rounded-xl border-2 border-dashed border-border-default bg-surface-primary/60 p-4 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-desert-tan transition-colors group"
                    >
                      <div className="p-2.5 rounded-lg bg-surface-secondary text-desert-tan group-hover:scale-105 transition-transform">
                        <IconPlus size={24} />
                      </div>
                      <h3 className="font-bold text-sm text-text-primary mt-2.5 group-hover:text-desert-tan">
                        Adicionar Atalho de Rede
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 max-w-[200px]">
                        Vincular endereço local da sua rede LAN
                      </p>
                    </button>
                  </div>
                );
              })()}
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
        <div className="px-4 sm:px-6 pb-4 max-w-[85rem] w-full mx-auto">
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  Personalizar Painel &amp; Centrais N.O.M.A.D.
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

            <div className="p-4 max-h-[60vh] overflow-y-auto themed-scrollbar space-y-2.5">
              <p className="text-xs text-text-secondary mb-3">
                Ative, oculte ou agrupe os widgets de monitoramento de hardware em tempo real, discos físicos e centrais de navegação da Home:
              </p>

              {[
                {
                  key: 'pools',
                  label: 'Exibir Armazenamento & Discos Físicos',
                  desc: 'Painel com capacidade consolidada dos HDs e NVMe reais conectados',
                },
                {
                  key: 'poolsCombined',
                  label: 'Visualização Unificada de Discos (Pool Global)',
                  desc: 'Exibe todos os discos em um só gráfico e barra comparativa (desative para cards individuais)',
                },
                {
                  key: 'cpuCombined',
                  label: 'CPU em Card Unificado (Carga em Tempo Real + Modelo)',
                  desc: 'Exibe carga a cada 2s, pulso histórico e modelo em 1 card (desative para cards separados)',
                },
                ...(!dashboardConfig.cpuCombined
                  ? [
                      {
                        key: 'cpuUsage',
                        label: 'Card: Utilização da CPU',
                        desc: 'Gauge circular com carga média ao vivo a cada 2 segundos',
                      },
                      {
                        key: 'cpuModel',
                        label: 'Card: Modelo do Processador Host',
                        desc: 'Especificações de modelo, núcleos, threads e clock em GHz',
                      },
                    ]
                  : []),
                {
                  key: 'memory',
                  label: 'Memória RAM em Tempo Real',
                  desc: 'Uso real de aplicativos, cache recuperável Linux e disponibilidade livre',
                },
                {
                  key: 'eventLog',
                  label: 'Log de Eventos & Fila de Downloads',
                  desc: 'Serviços ativos, velocidade de download ao vivo e relógio',
                },
                {
                  key: 'commandHub',
                  label: 'Centrais de Operação (Navegação)',
                  desc: 'Atalhos para Configuração Inicial, Supply Depot, Guias, Storage, Mapas, IA e Configurações',
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
                      <div className="text-[0.6875rem] text-text-muted mt-0.5">{item.desc}</div>
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
        installedServiceNames={new Set(systemServices.filter((s) => s.installed).map((s) => s.service_name))}
      />

      <AiChooserModal
        open={aiChooserOpen}
        onClose={() => setAiChooserOpen(false)}
        engines={aiStatus.engines}
      />
    </AppLayout>
  )
}
