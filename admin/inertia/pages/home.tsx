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
} from '@tabler/icons-react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '~/layouts/AppLayout'
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

  const [linkModalOpen, setLinkModalOpen] = useState(false)
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
    username: 'OPERADOR',
    level: 'NÍVEL 05 // COMANDO-GERAL',
  })

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
  const { data: activeDownloads = [] } = useDownloads({})
  const runningDownloads = activeDownloads.filter((d) => d.status !== 'completed')
  const { data: remoteAiSetting } = useSystemSetting({ key: 'ai.remoteOllamaUrl' })
  const ollamaInstalled = props.system.services.some(
    (s) => s.service_name === SERVICE_NAMES.OLLAMA && s.installed
  )
  const aiConfigured = ollamaInstalled || Boolean(remoteAiSetting?.value)

  useEffect(() => {
    const syncOp = () => setActiveOperator(getActiveOperator())
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
        !service.is_link_tile &&
        service.node !== 'portainer'
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

      items.push({
        label: isOllama ? resolvedAiName : service.friendly_name || service.service_name,
        categoryTag: isKiwix
          ? 'ENCICLOPÉDIA & ACERVO ZIM'
          : isOllama
            ? 'INTELIGÊNCIA ARTIFICIAL (RAG)'
            : 'MÓDULO OPERACIONAL',
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
    .filter((service) => service.is_link_tile && service.custom_url && service.node !== 'portainer')
    .forEach((service) => {
      items.push({
        label: service.friendly_name || service.service_name,
        categoryTag: 'ATALHO DE REDE LAN',
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
           MODO HUD TÁTICO MILITAR (MIL-STD-810H — Olive Drab + Coyote Tan)
           Respeita 100% dos módulos reais instalados e funções do site NOMAD
           ==================================================================== */
        <div className="max-w-[1840px] w-full mx-auto px-4 sm:px-6 2xl:px-10 py-5 space-y-5">
          {/* 1. CABEÇALHO DE COMANDO TÁTICO */}
          <header className="chamfer-box nomad-hud-header relative p-5 border-l-4 border-l-desert-tan">
            <div className="rivet absolute top-2.5 left-2.5" />
            <div className="rivet absolute top-2.5 right-2.5" />
            <div className="rivet absolute bottom-2.5 left-2.5" />
            <div className="rivet absolute bottom-2.5 right-2.5" />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-2">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-mil tracking-wider">
                  <span className="nomad-classified-badge px-2 py-0.5 bg-surface-secondary border border-border-default text-desert-green font-bold inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-desert-green nomad-telemetry-dot" />
                    CLASSIFICAÇÃO: RESTRITO // OPERACIONAL
                  </span>
                  <span className="nomad-classified-badge px-2 py-0.5 bg-desert-orange/15 border border-desert-orange/50 text-desert-orange-light font-bold inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-desert-orange nomad-telemetry-dot" />
                    MODO: OPERAÇÃO AUTÔNOMA (OFF-GRID)
                  </span>
                  <span className="nomad-stat-tile px-2 py-0.5 border border-border-subtle bg-surface-secondary/60 text-text-secondary">
                    DOUTRINA: <strong className="text-desert-tan">MIL-STD-810H</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <img
                    src="/nomad-primary.svg"
                    alt="Logo NOMAD"
                    className="h-11 w-11 object-contain shrink-0"
                  />
                  <h1 className="text-3xl sm:text-4xl font-extrabold font-stencil tracking-wider uppercase text-text-primary leading-none">
                    <span className="text-desert-tan">N.O.M.A.D.</span>{' '}
                    <span className="text-border-default font-light mx-1">|</span> CENTRO DE COMANDO
                    &amp; OPERAÇÕES
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-mil text-text-secondary">
                  <span>
                    AUTORIZAÇÃO:{' '}
                    <strong className="text-desert-olive">{activeOperator.level}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    OPERADOR:{' '}
                    <strong className="text-text-primary">
                      {activeOperator.username.toUpperCase()}
                    </strong>
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
              </div>

              {/* Telemetria Rápida no Topo */}
              <div className="chamfer-inner nomad-stat-tile flex flex-wrap items-center gap-4 px-4 py-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono-mil text-text-muted uppercase">
                    Divisões na Home
                  </div>
                  <div className="text-sm font-mono-mil font-bold text-desert-olive">
                    {items.length} // ATIVAS
                  </div>
                </div>
                <div className="h-7 w-[1px] bg-border-default" />
                <div className="text-right">
                  <div className="text-[10px] font-mono-mil text-text-muted uppercase">
                    Apps Instalados
                  </div>
                  <div className="text-sm font-mono-mil font-bold text-desert-tan">
                    {installedAppCount} SERVIÇOS
                  </div>
                </div>
                <div className="h-7 w-[1px] bg-border-default" />
                <div className="text-right">
                  <div className="text-[10px] font-mono-mil text-text-muted uppercase flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-desert-green nomad-telemetry-dot" />
                    Integridade
                  </div>
                  <div className="text-sm font-mono-mil font-bold text-text-primary">
                    100% NOMINAL
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* 2. PAINEL DE SITUAÇÃO OPERACIONAL + LOG DO SISTEMA */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 chamfer-box relative p-4">
              <div className="rivet absolute top-2 left-2" />
              <div className="rivet absolute top-2 right-2" />
              <div className="rivet absolute bottom-2 left-2" />
              <div className="rivet absolute bottom-2 right-2" />

              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-default px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-desert-tan inline-block" />
                  <h2 className="text-sm font-bold font-stencil tracking-widest uppercase text-desert-tan">
                    SITUAÇÃO OPERACIONAL DOS SUBSISTEMAS REAIS
                  </h2>
                </div>
                <span className="text-[11px] font-mono-mil text-text-muted">
                  ACESSO DIRETO AOS MÓDULOS DO SERVIDOR
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-1">
                <Link
                  href="/settings/zim"
                  className="chamfer-inner nomad-interactive-card p-3 text-center hover:border-desert-tan transition-colors block"
                >
                  <div className="text-[10px] font-mono-mil text-text-secondary uppercase">
                    Acervo de Sobrevivência
                  </div>
                  <div className="text-lg font-mono-mil font-bold text-text-primary mt-1">
                    KIWIX / ZIM
                  </div>
                  <div className="text-[10px] font-mono-mil text-desert-olive mt-0.5">
                    GERENCIAR BIBLIOTECA
                  </div>
                </Link>

                <Link
                  href={aiConfigured ? '/chat' : '/settings/models'}
                  className="chamfer-inner nomad-interactive-card p-3 text-center hover:border-desert-tan transition-colors block"
                >
                  <div className="text-[10px] font-mono-mil text-text-secondary uppercase">
                    Assistente Tático
                  </div>
                  <div className="text-lg font-mono-mil font-bold text-desert-tan mt-1">
                    OLLAMA RAG
                  </div>
                  <div
                    className={`text-[10px] font-mono-mil mt-0.5 font-bold ${
                      aiConfigured ? 'text-desert-olive' : 'text-desert-orange'
                    }`}
                  >
                    {aiConfigured ? 'CONECTADO • ABRIR CHAT IA' : 'NÃO CONFIGURADO • INSTALAR'}
                  </div>
                </Link>

                <Link
                  href="/maps"
                  className="chamfer-inner p-3 text-center hover:border-desert-tan transition-colors block"
                >
                  <div className="text-[10px] font-mono-mil text-text-secondary uppercase">
                    Cartografia Offline
                  </div>
                  <div className="text-lg font-mono-mil font-bold text-text-primary mt-1">
                    TERRESTRE
                  </div>
                  <div className="text-[10px] font-mono-mil text-desert-olive mt-0.5">
                    MAPAS VETORIAIS
                  </div>
                </Link>

                <Link
                  href="/supply-depot"
                  className="chamfer-inner p-3 text-center hover:border-desert-tan transition-colors block"
                >
                  <div className="text-[10px] font-mono-mil text-text-secondary uppercase">
                    Central de Aplicativos
                  </div>
                  <div className="text-lg font-mono-mil font-bold text-desert-orange-light mt-1">
                    {installedAppCount} ATIVOS
                  </div>
                  <div className="text-[10px] font-mono-mil text-text-secondary mt-0.5">
                    CATÁLOGO &amp; PORTAINER
                  </div>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 chamfer-box relative p-4 flex flex-col justify-between">
              <div className="rivet absolute top-2 left-2" />
              <div className="rivet absolute top-2 right-2" />
              <div className="rivet absolute bottom-2 left-2" />
              <div className="rivet absolute bottom-2 right-2" />

              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-default px-2">
                <span className="text-sm font-bold font-stencil tracking-widest uppercase text-desert-tan">
                  LOG DE EVENTOS
                </span>
                <span className="w-2 h-2 rounded-full bg-desert-olive nomad-telemetry-dot" />
              </div>

              <div className="chamfer-inner p-2.5 font-mono-mil text-[11px] space-y-1.5 text-text-secondary">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <span className="text-desert-tan">[HARDWARE]</span>{' '}
                    {sysInfo?.memory?.total
                      ? `RAM ${(
                          (sysInfo.memory.used || 0) /
                          (1024 * 1024 * 1024)
                        ).toFixed(1)}/${(sysInfo.memory.total / (1024 * 1024 * 1024)).toFixed(
                          1
                        )} GB`
                      : 'NÓ NEXUS-01 ATIVO'}
                    {sysInfo?.cpu?.usage !== undefined && sysInfo.cpu.usage > 0
                      ? ` • CPU ${Math.round(sysInfo.cpu.usage)}%`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-desert-tan">[DISCO]</span>{' '}
                  {sysInfo?.disk?.available && sysInfo?.disk?.total
                    ? `${((sysInfo.disk.available || 0) / (1024 * 1024 * 1024)).toFixed(
                        1
                      )} GB LIVRES DE ${(sysInfo.disk.total / (1024 * 1024 * 1024)).toFixed(0)} GB`
                    : 'ARMAZENAMENTO NOMAD MONTADO'}
                </div>
                <div>
                  <span className="text-desert-tan">[MÓDULOS]</span> {installedAppCount} ATIVOS (
                  {
                    props.system.services.filter(
                      (s) => s.installed && (s.node === 'portainer' || s.node === 'dell-micro')
                    ).length
                  }{' '}
                  PORTAINER) • {aiConfigured ? 'IA ONLINE' : 'IA NÃO CONFIG.'}
                </div>
                <div>
                  <span className="text-desert-tan">[FILA]</span>{' '}
                  {runningDownloads.length > 0
                    ? `${runningDownloads.length} ATIVO(S) — ${Math.round(
                        runningDownloads[0]?.progress || 0
                      )}% (${(runningDownloads[0]?.filename || 'arquivo').slice(0, 20)})`
                    : 'FILA DE DOWNLOADS LIVRE'}
                </div>
                <div className="text-desert-olive flex items-center justify-between pt-0.5 border-t border-border-subtle/50">
                  <span>&gt; TEMA {currentThemeDef.shortName.toUpperCase()}</span>
                  <span className="opacity-80">
                    {new Date().toLocaleTimeString('pt-BR', {
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
          </section>

          {/* 3. DIVISÕES OPERACIONAIS (100% DOS MÓDULOS REAIS DO SITE) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2">
              <div className="flex items-center gap-2">
                <span className="text-desert-tan font-mono-mil text-sm nomad-telemetry-dot">►</span>
                <h2 className="text-lg font-bold font-stencil tracking-widest uppercase text-text-primary nomad-classified-badge px-2.5 py-1 rounded border border-border-default/80">
                  DIVISÕES OPERACIONAIS DO SISTEMA
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-mil text-text-muted hidden sm:inline">
                  TODOS OS MÓDULOS E FUNÇÕES REAIS DO SERVIDOR NOMAD
                </span>
                <button
                  type="button"
                  onClick={() => setCustomizeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-mil uppercase border border-border-default bg-surface-secondary hover:border-desert-tan text-text-primary rounded cursor-pointer"
                >
                  <IconAdjustments size={14} className="text-desert-tan" />
                  <span>Personalizar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const ordered = [...items].sort((a, b) => {
                  const idxA = divisionsPrefs.order.indexOf(a.label)
                  const idxB = divisionsPrefs.order.indexOf(b.label)
                  if (idxA === -1 && idxB === -1) return 0
                  if (idxA === -1) return 1
                  if (idxB === -1) return -1
                  return idxA - idxB
                })
                const visible = ordered.filter((it) => !divisionsPrefs.hidden.includes(it.label))
                return visible
              })().map((item, idx) => {
                const divisionNum = String(idx + 1).padStart(2, '0')
                const isEasySetup = item.to === '/easy-setup'
                const shouldHighlight = isEasySetup && shouldHighlightEasySetup
                const isKiwix = item.serviceName === SERVICE_NAMES.KIWIX
                const isLinkTile = Boolean(item.linkTile)
                const confirming =
                  isLinkTile && pendingDelete === item.linkTile!.service_name

                const cardInner = (
                  <div className="chamfer-box nomad-interactive-card relative p-5 h-full flex flex-col justify-between transition-all hover:border-desert-tan group">
                    <div className="rivet absolute top-2.5 left-2.5" />
                    <div className="rivet absolute top-2.5 right-2.5" />
                    <div className="rivet absolute bottom-2.5 left-2.5" />
                    <div className="rivet absolute bottom-2.5 right-2.5" />

                    <div>
                      {/* Top Division Metadata Row */}
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border-default px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 bg-surface-secondary border border-desert-tan/40 text-desert-tan text-[10px] font-mono-mil font-bold shrink-0">
                            {divisionNum} // DIVISÃO
                          </span>
                          <span className="text-[11px] font-mono-mil font-bold uppercase tracking-wider text-desert-olive truncate">
                            {item.categoryTag || 'MÓDULO NOMAD'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-mil text-text-muted shrink-0">
                          {item.portLabel || item.to.toUpperCase()}
                        </span>
                      </div>

                      {shouldHighlight && (
                        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-desert-orange text-white text-xs font-bold">
                          <span>⚡ COMECE AQUI — CONFIGURAÇÃO RÁPIDA</span>
                        </div>
                      )}

                      {/* Icon + Title + Description */}
                      <div className="flex items-start gap-3.5 px-1">
                        <div className="chamfer-inner p-2.5 text-desert-tan group-hover:text-text-primary transition-colors shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold font-stencil uppercase tracking-wide text-text-primary group-hover:text-desert-tan transition-colors">
                            {item.label}
                          </h3>
                          {item.poweredBy && (
                            <div className="text-[11px] font-mono-mil text-desert-olive mt-0.5">
                              MOTOR: {item.poweredBy}
                            </div>
                          )}
                          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Optional Direct Kiwix Search Box */}
                      {isKiwix && (
                        <div
                          className="chamfer-inner p-2 mt-3 flex items-center gap-2"
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
                            onClick={() => window.open(item.to, '_blank', 'noopener,noreferrer')}
                            className="mil-tactical-btn px-2.5 py-1 text-[10px] font-mono-mil shrink-0 cursor-pointer"
                          >
                            ABRIR
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Row */}
                    <div className="flex items-center justify-between text-[11px] font-mono-mil text-text-muted pt-3 mt-4 border-t border-border-default px-1">
                      <span>STATUS: PRONTO</span>
                      <span className="text-desert-tan font-bold group-hover:underline inline-flex items-center gap-1">
                        <span>ACESSAR MÓDULO</span>
                        <IconArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                )

                if (isLinkTile) {
                  const tile = item.linkTile!
                  return (
                    <div key={item.label} className="group relative h-full">
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                      >
                        {cardInner}
                      </a>

                      {confirming ? (
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
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
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-20">
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
                  )
                }

                return item.target === '_blank' ? (
                  <a
                    key={item.label}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {cardInner}
                  </a>
                ) : (
                  <Link key={item.label} href={item.to} className="block h-full">
                    {cardInner}
                  </Link>
                )
              })}

              {/* Add-a-link affordance in Tactical HUD */}
              <button
                type="button"
                onClick={() => {
                  setEditingTile(null)
                  setLinkModalOpen(true)
                }}
                className="chamfer-box relative p-5 min-h-[190px] flex flex-col items-center justify-center text-center cursor-pointer border-dashed hover:border-desert-tan transition-colors group"
              >
                <div className="rivet absolute top-2.5 left-2.5" />
                <div className="rivet absolute top-2.5 right-2.5" />
                <div className="rivet absolute bottom-2.5 left-2.5" />
                <div className="rivet absolute bottom-2.5 right-2.5" />

                <div className="chamfer-inner p-3 text-desert-tan group-hover:scale-105 transition-transform">
                  <IconPlus size={32} />
                </div>
                <h3 className="font-bold text-lg uppercase tracking-wider text-text-primary mt-3 group-hover:text-desert-tan">
                  + Adicionar Atalho de Rede
                </h3>
                <p className="text-xs font-mono text-text-secondary mt-1 max-w-xs">
                  Vincular um novo serviço ou endereço local da sua LAN ao Centro de Comando
                </p>
              </button>
            </div>
          </section>
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
    </AppLayout>
  )
}
