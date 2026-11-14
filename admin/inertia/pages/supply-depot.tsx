import { Head, router } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowUp,
  IconBook,
  IconBox,
  IconBrandDocker,
  IconChartBar,
  IconClockBolt,
  IconCloudDownload,
  IconDeviceDesktop,
  IconFileText,
  IconPackage,
  IconPencil,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconSearch,
  IconServer,
  IconTrash,
  IconWorld,
} from '@tabler/icons-react'
import AppLayout from '~/layouts/AppLayout'
import DynamicIcon, { DynamicIconName } from '~/components/DynamicIcon'
import StyledButton from '~/components/StyledButton'
import StyledModal from '~/components/StyledModal'
import InstallActivityFeed from '~/components/InstallActivityFeed'
import LoadingSpinner from '~/components/LoadingSpinner'
import Alert from '~/components/Alert'
import CustomAppModal, { CustomAppInitial } from '~/components/CustomAppModal'
import PortainerConfigModal from '~/components/PortainerConfigModal'
import AppUrlModal from '~/components/AppUrlModal'
import ServiceLogsModal from '~/components/ServiceLogsModal'
import ServiceStatsModal from '~/components/ServiceStatsModal'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import UpdateServiceModal from '~/components/UpdateServiceModal'
import useErrorNotification from '~/hooks/useErrorNotification'
import { useNotifications } from '~/context/NotificationContext'
import useInternetStatus from '~/hooks/useInternetStatus'
import { useAppAutoUpdateStatus } from '~/hooks/useAppAutoUpdateStatus'
import useServiceInstallationActivity from '~/hooks/useServiceInstallationActivity'
import { useTransmit } from 'react-adonis-transmit'
import { BROADCAST_CHANNELS } from '../../constants/broadcast'
import { ServiceSlim } from '../../types/services'
import { getServiceLink } from '~/lib/navigation'
import { getSupplyDepotDocLink } from '../../constants/supply_depot_docs'
import api from '~/lib/api'
import { toTitleCase } from '../../app/utils/misc'
import { SERVICE_NAMES } from '../../constants/service_names'

function extractTag(containerImage: string): string {
  if (!containerImage) return ''
  const parts = containerImage.split(':')
  return parts.length > 1 ? parts[parts.length - 1] : 'latest'
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'installed', label: 'Instalados' },
  { id: 'remote-server', label: 'Servidor Portainer' },
  { id: 'productivity', label: 'Produtividade' },
  { id: 'media', label: 'Mídia & Livros' },
  { id: 'security', label: 'Segurança' },
  { id: 'networking', label: 'Rede & Rádio' },
  { id: 'utility', label: 'Utilitários' },
  { id: 'ai', label: 'IA' },
  { id: 'education', label: 'Educação' },
  { id: 'custom', label: 'Personalizados' },
]

const CATEGORY_LABELS: Record<string, string> = {
  productivity: 'Produtividade',
  media: 'Mídia & Livros',
  security: 'Segurança',
  networking: 'Rede & Rádio',
  utility: 'Utilitários',
  ai: 'IA',
  education: 'Educação',
  custom: 'Personalizado',
}

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'border border-desert-green-light bg-desert-green-lighter text-desert-green-dark',
  media: 'border border-desert-tan-light bg-desert-tan-lighter text-desert-tan-dark',
  security: 'border border-desert-red-light bg-desert-red-lighter text-desert-red-dark',
  networking: 'border border-desert-stone-light bg-desert-stone-lighter text-desert-stone-dark',
  utility: 'border border-desert-olive-light bg-desert-olive-lighter text-desert-olive-dark',
  ai: 'border border-desert-green bg-desert-green-light text-desert-green-darker',
  education: 'border border-desert-orange-light bg-desert-orange-lighter text-desert-orange-dark',
  custom: 'border border-border-subtle bg-surface-secondary text-text-secondary',
}

type Modal =
  | { type: 'install'; service: ServiceSlim }
  | { type: 'start'; service: ServiceSlim }
  | { type: 'stop'; service: ServiceSlim }
  | { type: 'restart'; service: ServiceSlim }
  | { type: 'reinstall'; service: ServiceSlim }
  | { type: 'delete'; service: ServiceSlim }
  | { type: 'uninstall'; service: ServiceSlim }
  | { type: 'logs'; service: ServiceSlim }
  | { type: 'stats'; service: ServiceSlim }
  | { type: 'update'; service: ServiceSlim }
  | null

export default function SupplyDepotPage(props: {
  system: { services: ServiceSlim[] }
  portainer?: { enabled: boolean; online: boolean; url?: string }
}) {
  const { showError } = useErrorNotification()
  const { addNotification } = useNotifications()
  const { isOnline } = useInternetStatus()
  const { subscribe } = useTransmit()
  const installActivity = useServiceInstallationActivity()
  // Global master switch for app auto-updates (Settings → Updates). Per-app
  // toggles are inert until this is on, so the UI reflects that state.
  const { data: appAutoUpdateStatus } = useAppAutoUpdateStatus()
  const appAutoUpdateMasterEnabled = appAutoUpdateStatus?.enabled ?? false

  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [services, setServices] = useState<ServiceSlim[]>(props.system.services || [])
  const [modal, setModal] = useState<Modal>(null)
  const [loading, setLoading] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [customAppOpen, setCustomAppOpen] = useState(false)
  const [portainerModalOpen, setPortainerModalOpen] = useState(false)
  const [editApp, setEditApp] = useState<CustomAppInitial | null>(null)
  const [installTarget, setInstallTarget] = useState<'local' | 'portainer'>('local')
  // App whose custom launch URL is being configured (null while the modal is closed).
  const [urlApp, setUrlApp] = useState<ServiceSlim | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  // Optimistic per-app auto-update toggle state, keyed by service_name. Lets the
  // toggle reflect instantly without a full page reload (props come from Inertia).
  const [autoUpdateOverrides, setAutoUpdateOverrides] = useState<Record<string, boolean>>({})

  // Preflight state — scoped to the current install modal
  const [preflight, setPreflight] = useState<{
    portConflicts: Array<{ port: number; usedBy: string }>
    resourceWarnings: string[]
  } | null>(null)
  const [preflightLoading, setPreflightLoading] = useState(false)
  const [forceInstall, setForceInstall] = useState(false)

  const isPortainerConfigured = Boolean(props.portainer?.enabled && props.portainer?.online)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-reload when installation completes or show error
  useEffect(() => {
    if (!installActivity.length) return
    const last = installActivity[installActivity.length - 1]
    if (last.type === 'completed' || last.type === 'update-complete') {
      setServices((prev) =>
        prev.map((s) =>
          s.service_name === last.service_name
            ? { ...s, installed: true, installation_status: 'idle', status: 'running' }
            : s
        )
      )
      setTimeout(() => window.location.reload(), 1500)
    } else if (last.type === 'error') {
      showError(last.message || 'Erro durante a instalação do serviço.')
      setServices((prev) =>
        prev.map((s) =>
          s.service_name === last.service_name
            ? { ...s, installation_status: 'error' }
            : s
        )
      )
    }
  }, [installActivity])

  // Listen for service update-check completion (manual or nightly), then reload so
  // refreshed available_update_version values surface on the cards.
  useEffect(() => {
    const unsubscribe = subscribe(BROADCAST_CHANNELS.SERVICE_UPDATES, () => {
      setCheckingUpdates(false)
      window.location.reload()
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Run preflight when install modal opens
  useEffect(() => {
    if (modal?.type !== 'install') {
      setPreflight(null)
      setForceInstall(false)
      return
    }
    setPreflightLoading(true)
    api
      .preflightCheck(modal.service.service_name)
      .then((res) => {
        if (res) setPreflight(res)
      })
      .catch(() => { }) // non-fatal; proceed without warnings
      .finally(() => setPreflightLoading(false))
  }, [modal])

  useEffect(() => {
    if (props.system.services) {
      setServices(props.system.services)
    }
  }, [props.system.services])

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredServices = services.filter((s) => {
    if (activeCategory === 'installed' && !s.installed) return false
    if (
      activeCategory === 'remote-server' &&
      s.node !== 'portainer' &&
      s.node !== 'dell-micro'
    )
      return false
    if (
      activeCategory !== 'all' &&
      activeCategory !== 'installed' &&
      activeCategory !== 'remote-server'
    ) {
      if (s.category !== activeCategory) return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        s.friendly_name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.powered_by?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.node_label?.toLowerCase().includes(q) ||
        Boolean(s.category && CATEGORY_LABELS[s.category]?.toLowerCase().includes(q))
      )
    }
    return true
  })

  const installedServices = filteredServices.filter((s) => s.installed)
  const availableServices = filteredServices.filter((s) => !s.installed)

  const latestActivityByService = installActivity.reduce<Record<string, { message: string; type: string }>>((acc, item) => {
    if (item.service_name) {
      acc[item.service_name] = { message: item.message, type: item.type }
    }
    return acc
  }, {})

  // Whether the new Kolibri (Gen 2) install exists — gates the "Migrate content to Gen 2" action on
  // the legacy Kolibri card. Computed from the full (unfiltered) list so a search filter can't hide it.
  const educationGen2Installed = services.some(
    (s) => s.service_name === SERVICE_NAMES.KOLIBRI_GEN2 && s.installed
  )

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleInstall(service: ServiceSlim) {
    const hasWarnings =
      (preflight?.portConflicts.length ?? 0) > 0 || (preflight?.resourceWarnings.length ?? 0) > 0

    if (hasWarnings && !forceInstall) return

    setLoading(true)
    const result = await api.installService(service.service_name, installTarget)
    setModal(null)
    setLoading(false)
    if (!result?.success) {
      showError(result?.message || 'Falha ao iniciar a instalação.')
    } else {
      // Atualiza o estado do card imediatamente para 'installing' com spinner
      setServices((prev) =>
        prev.map((s) =>
          s.service_name === service.service_name
            ? { ...s, installation_status: 'installing' }
            : s
        )
      )
      addNotification({
        message: result.message || `Instalação de ${service.friendly_name} iniciada!`,
        type: 'success',
      })
    }
  }

  async function handleAffect(service: ServiceSlim, action: 'start' | 'stop' | 'restart') {
    setLoading(true)
    const result = await api.affectService(service.service_name, action)
    setModal(null)
    if (!result?.success) {
      setLoading(false)
      const actionLabels: Record<'start' | 'stop' | 'restart', string> = {
        start: 'iniciar',
        stop: 'parar',
        restart: 'reiniciar',
      }
      showError(result?.message || `Falha ao ${actionLabels[action]} o serviço.`)
    } else {
      // Keep loading=true so the overlay covers the page until it reloads.
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  async function handleForceReinstall(service: ServiceSlim) {
    setLoading(true)
    const result = await api.forceReinstallService(service.service_name)
    setModal(null)
    setLoading(false)
    if (!result?.success) {
      showError(result?.message || 'Falha ao iniciar a reinstalação.')
    } else {
      setServices((prev) =>
        prev.map((s) =>
          s.service_name === service.service_name
            ? { ...s, installation_status: 'installing' }
            : s
        )
      )
      addNotification({
        message: result.message || `Reinstalação de ${service.friendly_name} iniciada!`,
        type: 'success',
      })
    }
  }

  async function handleDelete(service: ServiceSlim) {
    setLoading(true)
    const result = await api.deleteCustomApp(service.service_name, removeImage)
    setRemoveImage(false)
    setModal(null)
    if (!result?.success) {
      setLoading(false)
      showError(result?.message || 'Falha ao excluir o aplicativo.')
    } else {
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  async function handleUninstall(service: ServiceSlim) {
    setLoading(true)
    const result = await api.uninstallService(service.service_name, removeImage)
    setRemoveImage(false)
    setModal(null)
    if (!result?.success) {
      setLoading(false)
      showError(result?.message || 'Falha ao desinstalar o aplicativo.')
    } else {
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  async function handleUpdate(service: ServiceSlim) {
    setOpenDropdown(null)
    setLoading(true)
    const result = await api.updateCustomAppImage(service.service_name)
    setLoading(false)
    if (!result?.success) showError(result?.message || 'Falha ao atualizar o aplicativo.')
    else setTimeout(() => window.location.reload(), 1500)
  }

  // Manual trigger for the catalog-wide update check. Results stream back over the
  // SERVICE_UPDATES broadcast (handled by the effect above), which reloads the page.
  async function handleCheckUpdates() {
    if (!isOnline) {
      showError('Você precisa de uma conexão com a internet para verificar atualizações.')
      return
    }
    try {
      setCheckingUpdates(true)
      const response = await api.checkServiceUpdates()
      if (!response?.success) throw new Error(response?.message || 'Falha ao iniciar a verificação de atualizações')
    } catch (error: any) {
      showError(`Falha ao verificar atualizações: ${error?.message || 'Erro desconhecido'}`)
      setCheckingUpdates(false)
    }
  }

  // Versioned update for a curated (non-custom) catalog app. Progress + reload are handled
  // by the installActivity effect (update-complete) above.
  async function handleUpdateService(service: ServiceSlim, targetVersion: string) {
    setLoading(true)
    const result = await api.updateService(service.service_name, targetVersion)
    setLoading(false)
    if (!result?.success) showError(result?.message || 'Falha ao atualizar o serviço.')
  }

  // Toggle per-app automatic updates (opt-in). Optimistically reflects the new
  // state, reverting if the request fails. Gated by the global master switch in
  // Settings → Updates; this only sets the per-app preference.
  async function handleToggleAutoUpdate(service: ServiceSlim, enabled: boolean) {
    setOpenDropdown(null)
    setAutoUpdateOverrides((prev) => ({ ...prev, [service.service_name]: enabled }))
    const result = await api.setServiceAutoUpdate(service.service_name, enabled)
    if (!result?.success) {
      setAutoUpdateOverrides((prev) => ({ ...prev, [service.service_name]: !enabled }))
      showError(result?.message || 'Falha ao salvar a preferência de atualização automática.')
      return
    }
    const appName = service.friendly_name || service.service_name
    addNotification({
      message: `Atualizações automáticas para ${appName} ${enabled ? 'ativadas' : 'desativadas'}.`,
      type: 'success',
    })
  }

  function handleCustomAppCreated() {
    setCustomAppOpen(false)
    // Page will reload when installation completes via broadcast
  }

  async function handleEdit(service: ServiceSlim) {
    setOpenDropdown(null)
    setLoading(true)
    const res = await api.getCustomApp(service.service_name)
    setLoading(false)
    if (res?.success && res.app) {
      setEditApp(res.app)
    } else {
      showError('Não foi possível carregar este aplicativo para edição.')
    }
  }

  function handleEdited() {
    setEditApp(null)
    setTimeout(() => window.location.reload(), 1500)
  }

  function handleSetUrl(service: ServiceSlim) {
    setOpenDropdown(null)
    setUrlApp(service)
  }

  function handleUrlSaved() {
    setUrlApp(null)
    // Reload so the new link flows through to the card, /home, and settings.
    window.location.reload()
  }

  // ── Install modal helpers ─────────────────────────────────────────────────
  const hasPreflightWarnings =
    (preflight?.portConflicts.length ?? 0) > 0 || (preflight?.resourceWarnings.length ?? 0) > 0

  return (
    <AppLayout>
      <Head title="Central de Aplicativos" />

      {loading && !modal && <LoadingSpinner fullscreen text="Processando..." />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isOnline && (
          <Alert
            title="Sem conexão com a internet. Você pode não conseguir baixar arquivos."
            message=""
            type="warning"
            variant="solid"
            className="!mb-4"
          />
        )}

        {/* ── Hero / controls panel ─────────────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden bg-desert-white border border-desert-stone-light shadow-sm mb-8">
          {/* Green header band */}
          <div className="relative bg-desert-green px-6 py-5 overflow-hidden">
            {/* Diagonal line pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(255, 255, 255, 0.1) 10px,
                  rgba(255, 255, 255, 0.1) 20px
                )`,
              }}
            />
            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8">
              <div className="w-full h-full bg-desert-green-dark opacity-30 transform rotate-45" />
            </div>
            <div className="relative flex items-center gap-3">
              <IconBox className="text-white opacity-90 flex-shrink-0" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-wide leading-tight">
                  Central de Aplicativos
                </h1>
                <p className="text-sm text-white/70 mt-1 max-w-xl">
                  Instale e gerencie módulos offline em 1 clique ou adicione seus próprios contêineres Docker personalizados.
                </p>
              </div>
            </div>
          </div>

          {/* Controls body */}
          <div className="p-6 space-y-4">
            {/* Activity feed (shown only while installing) */}
            {installActivity.length > 0 && (
              <InstallActivityFeed activity={installActivity} withHeader />
            )}

            {/* Search + Add Custom App */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Pesquisar módulos e aplicativos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md bg-surface-secondary border border-desert-stone-lighter text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-desert-green placeholder:text-text-muted/50"
                />
              </div>
              <StyledButton
                icon="IconRefreshAlert"
                variant="outline"
                onClick={handleCheckUpdates}
                loading={checkingUpdates}
                disabled={checkingUpdates || !isOnline}
              >
                Verificar Atualizações
              </StyledButton>
              <StyledButton
                icon="IconServer"
                variant="outline"
                onClick={() => setPortainerModalOpen(true)}
              >
                Servidores Remotos
              </StyledButton>
              <StyledButton
                icon="IconBrandDocker"
                variant="outline"
                onClick={() => setCustomAppOpen(true)}
              >
                Adicionar App Docker
              </StyledButton>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${activeCategory === cat.id
                    ? 'bg-desert-green text-white border-desert-green'
                    : 'bg-surface-secondary text-text-muted border-desert-stone-lighter hover:text-text-primary hover:border-desert-stone-light'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-desert-green" />
        </div>

        {/* App cards */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <IconPackage className="mx-auto mb-3 opacity-40 text-desert-stone-light" size={48} />
            <p className="text-text-muted">Nenhum aplicativo encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {installedServices.length > 0 && (
              <section>
                <StyledSectionHeader title={`Instalados (${installedServices.length})`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {installedServices.map((service) => (
                    <AppCard
                      key={service.service_name}
                      service={service}
                      openDropdown={openDropdown}
                      dropdownRef={dropdownRef}
                      onOpenDropdown={setOpenDropdown}
                      onInstall={() => setModal({ type: 'install', service })}
                      onStart={() => setModal({ type: 'start', service })}
                      onStop={() => setModal({ type: 'stop', service })}
                      onRestart={() => setModal({ type: 'restart', service })}
                      onReinstall={() => setModal({ type: 'reinstall', service })}
                      onDelete={() => setModal({ type: 'delete', service })}
                      onUninstall={() => setModal({ type: 'uninstall', service })}
                      onLogs={() => setModal({ type: 'logs', service })}
                      onStats={() => setModal({ type: 'stats', service })}
                      onEdit={() => handleEdit(service)}
                      onSetUrl={() => handleSetUrl(service)}
                      onUpdate={() => handleUpdate(service)}
                      onUpdateVersion={() => setModal({ type: 'update', service })}
                      liveProgressMessage={latestActivityByService[service.service_name]?.message}
                      autoUpdateEnabled={
                        autoUpdateOverrides[service.service_name] ?? service.auto_update_enabled
                      }
                      autoUpdateMasterEnabled={appAutoUpdateMasterEnabled}
                      onToggleAutoUpdate={(enabled) => handleToggleAutoUpdate(service, enabled)}
                      migrationInstructionsHref={(service.service_name.startsWith(SERVICE_NAMES.KOLIBRI) && educationGen2Installed) ? getSupplyDepotDocLink(SERVICE_NAMES.KOLIBRI) || undefined : undefined}
                      migrationInstructionsText={(service.service_name === SERVICE_NAMES.KOLIBRI) ? 'Como migrar conteúdo para a Gen 2' : 'Como migrar conteúdo da Gen 1'}
                    />
                  ))}
                </div>
              </section>
            )}

            {availableServices.length > 0 && (
              <section>
                <StyledSectionHeader title={`Disponíveis para Instalar (${availableServices.length})`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableServices.map((service) => (
                    <AppCard
                      key={service.service_name}
                      service={service}
                      openDropdown={openDropdown}
                      dropdownRef={dropdownRef}
                      onOpenDropdown={setOpenDropdown}
                      onInstall={() => setModal({ type: 'install', service })}
                      onStart={() => setModal({ type: 'start', service })}
                      onStop={() => setModal({ type: 'stop', service })}
                      onRestart={() => setModal({ type: 'restart', service })}
                      onReinstall={() => setModal({ type: 'reinstall', service })}
                      onDelete={() => setModal({ type: 'delete', service })}
                      onUninstall={() => setModal({ type: 'uninstall', service })}
                      onLogs={() => setModal({ type: 'logs', service })}
                      onStats={() => setModal({ type: 'stats', service })}
                      onEdit={() => handleEdit(service)}
                      onSetUrl={() => handleSetUrl(service)}
                      onUpdate={() => handleUpdate(service)}
                      onUpdateVersion={() => setModal({ type: 'update', service })}
                      liveProgressMessage={latestActivityByService[service.service_name]?.message}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Install modal */}
      {modal?.type === 'install' && (
        <StyledModal
          title={`Instalar ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onConfirm={() => handleInstall(modal.service)}
          confirmText={installTarget === 'portainer' ? 'Instalar no Servidor Remoto' : 'Instalar Localmente'}
          confirmIcon="IconDownload"
          confirmVariant="primary"
          confirmLoading={loading}
        >
          <div className="space-y-4 text-sm text-text-muted">
            {isPortainerConfigured && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block">
                  Escolha o destino da instalação:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstallTarget('local')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      installTarget === 'local'
                        ? 'border-desert-green bg-desert-green-lighter/30 ring-1 ring-desert-green'
                        : 'border-border-subtle bg-surface-secondary hover:border-desert-stone-light'
                    }`}
                  >
                    <IconDeviceDesktop className={`w-5 h-5 mt-0.5 flex-shrink-0 ${installTarget === 'local' ? 'text-desert-green-darker' : 'text-text-muted'}`} />
                    <div>
                      <strong className="block text-xs font-bold text-text-primary">Instalação Local</strong>
                      <span className="text-[11px] text-text-muted leading-tight block mt-0.5">
                        Executa no dispositivo NOMAD atual
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInstallTarget('portainer')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      installTarget === 'portainer'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                        : 'border-border-subtle bg-surface-secondary hover:border-desert-stone-light'
                    }`}
                  >
                    <IconBrandDocker className={`w-5 h-5 mt-0.5 flex-shrink-0 ${installTarget === 'portainer' ? 'text-emerald-600' : 'text-text-muted'}`} />
                    <div>
                      <strong className="block text-xs font-bold text-text-primary">Servidor Portainer</strong>
                      <span className="text-[11px] text-text-muted leading-tight block mt-0.5">
                        Executa no servidor remoto ({props.portainer?.url ? new URL(props.portainer.url).hostname : 'remoto'})
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {installTarget === 'portainer' ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <p className="font-semibold flex items-center gap-2 text-xs text-emerald-300">
                  <IconServer className="w-4 h-4 text-emerald-400" />
                  Destino Selecionado: Servidor Docker Remoto (Portainer)
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Este contêiner será criado e executado no servidor remoto configurado, sem consumir CPU e memória deste notebook.
                </p>
              </div>
            ) : (
              <p>
                Isso irá baixar e iniciar <strong className="text-text-primary">{modal.service.friendly_name}</strong>
                {modal.service.ui_location && (
                  <> na porta <strong className="text-text-primary">{modal.service.ui_location === '8080' ? '8095 (8080 reservada para UniFi)' : modal.service.ui_location}</strong></>
                )} localmente.
              </p>
            )}

            {modal.service.powered_by && (
              <p className="text-xs">Desenvolvido com {modal.service.powered_by}</p>
            )}

            {preflightLoading && (
              <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                <span className="animate-spin inline-block w-3 h-3 border border-desert-green border-t-transparent rounded-full" />
                Verificando pré-requisitos…
              </div>
            )}

            {!preflightLoading && preflight && hasPreflightWarnings && (
              <div className="space-y-2 pt-1">
                {preflight.portConflicts.map((c) => (
                  <Alert
                    key={c.port}
                    type="warning"
                    title={`Porta ${c.port} já está em uso`}
                    message={`Atualmente vinculada a: ${c.usedBy}. A instalação pode falhar.`}
                  />
                ))}
                {preflight.resourceWarnings.map((w, i) => (
                  <Alert key={i} type="warning" title="Aviso de recursos" message={w} />
                ))}
                <label className="flex items-center gap-2 cursor-pointer select-none mt-2">
                  <input
                    type="checkbox"
                    checked={forceInstall}
                    onChange={(e) => setForceInstall(e.target.checked)}
                    className="accent-desert-orange h-4 w-4 rounded"
                  />
                  <span className="text-xs text-text-muted">Eu entendo — instalar mesmo assim</span>
                </label>
              </div>
            )}
          </div>
        </StyledModal>
      )}

      {/* Start modal */}
      {modal?.type === 'start' && (
        <StyledModal
          title={`Iniciar ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onConfirm={() => handleAffect(modal.service, 'start')}
          confirmText="Iniciar"
          confirmIcon="IconPlayerPlay"
          confirmVariant="primary"
          confirmLoading={loading}
        >
          <p className="text-sm text-text-muted">Isso iniciará o contêiner.</p>
        </StyledModal>
      )}

      {/* Stop modal */}
      {modal?.type === 'stop' && (
        <StyledModal
          title={`Parar ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onConfirm={() => handleAffect(modal.service, 'stop')}
          confirmText="Parar"
          confirmIcon="IconPlayerStop"
          confirmVariant="action"
          confirmLoading={loading}
        >
          <p className="text-sm text-text-muted">O contêiner será parado. Seus dados serão preservados.</p>
        </StyledModal>
      )}

      {/* Restart modal */}
      {modal?.type === 'restart' && (
        <StyledModal
          title={`Reiniciar ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onConfirm={() => handleAffect(modal.service, 'restart')}
          confirmText="Reiniciar"
          confirmIcon="IconRefresh"
          confirmVariant="action"
          confirmLoading={loading}
        >
          <p className="text-sm text-text-muted">O contêiner será brevemente parado e reiniciado.</p>
        </StyledModal>
      )}

      {/* Force reinstall modal */}
      {modal?.type === 'reinstall' && (
        <StyledModal
          title={`Forçar Reinstalação de ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onConfirm={() => handleForceReinstall(modal.service)}
          confirmText="Apagar e Reinstalar"
          confirmIcon="IconRefresh"
          confirmVariant="danger"
          confirmLoading={loading}
          icon={<IconAlertTriangle className="text-desert-red" size={40} />}
        >
          <div className="space-y-2 text-sm text-text-muted">
            <p className="font-semibold text-desert-red">Isso apagará todos os dados do aplicativo e não poderá ser desfeito.</p>
            <p>O contêiner e seus volumes associados serão removidos e uma nova instalação será iniciada.</p>
          </div>
        </StyledModal>
      )}

      {/* Delete custom app modal */}
      {modal?.type === 'delete' && (
        <StyledModal
          title={`Excluir ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setRemoveImage(false)
            setModal(null)
          }}
          onConfirm={() => handleDelete(modal.service)}
          confirmText="Excluir"
          confirmIcon="IconTrash"
          confirmVariant="danger"
          confirmLoading={loading}
          icon={<IconAlertTriangle className="text-desert-red" size={40} />}
        >
          <div className="space-y-3 text-sm text-text-muted">
            <p className="font-semibold text-desert-red">Isso removerá permanentemente este aplicativo personalizado.</p>
            <p>O contêiner será parado e removido. Os dados de volumes no host permanecerão em disco.</p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
                className="accent-desert-red h-4 w-4 rounded"
              />
              <span className="text-text-muted text-xs">Remover também a imagem Docker para liberar espaço em disco</span>
            </label>
          </div>
        </StyledModal>
      )}

      {/* Uninstall curated app modal */}
      {modal?.type === 'uninstall' && (
        <StyledModal
          title={`Desinstalar ${modal.service.friendly_name ?? modal.service.service_name}`}
          open
          onCancel={() => {
            if (loading) return
            setRemoveImage(false)
            setModal(null)
          }}
          onConfirm={() => handleUninstall(modal.service)}
          confirmText="Desinstalar"
          confirmIcon="IconTrash"
          confirmVariant="danger"
          confirmLoading={loading}
          icon={<IconAlertTriangle className="text-desert-red" size={40} />}
        >
          <div className="space-y-3 text-sm text-text-muted">
            <p className="font-semibold text-desert-red">Isso removerá o aplicativo deste dispositivo.</p>
            <p>O contêiner será parado e removido, e o aplicativo voltará ao catálogo abaixo. Os dados do aplicativo na pasta de armazenamento permanecem em disco, portanto reinstalá-lo restaurará tudo como estava.</p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
                className="accent-desert-red h-4 w-4 rounded"
              />
              <span className="text-text-muted text-xs">Remover também a imagem Docker para liberar espaço em disco</span>
            </label>
          </div>
        </StyledModal>
      )}

      {/* Logs modal */}
      {modal?.type === 'logs' && (
        <ServiceLogsModal
          serviceName={modal.service.service_name}
          friendlyName={modal.service.friendly_name ?? modal.service.service_name}
          open
          onClose={() => setModal(null)}
        />
      )}

      {/* Stats modal */}
      {modal?.type === 'stats' && (
        <ServiceStatsModal
          serviceName={modal.service.service_name}
          friendlyName={modal.service.friendly_name ?? modal.service.service_name}
          open
          onClose={() => setModal(null)}
        />
      )}

      {/* Versioned update modal (curated apps with an available update) */}
      {modal?.type === 'update' && (
        <UpdateServiceModal
          record={modal.service}
          currentTag={extractTag(modal.service.container_image)}
          latestVersion={modal.service.available_update_version!}
          onCancel={() => {
            if (loading) return
            setModal(null)
          }}
          onUpdate={(targetVersion) => {
            const service = modal.service
            setModal(null)
            handleUpdateService(service, targetVersion)
          }}
          showError={showError}
        />
      )}

      {/* Custom app creation modal */}
      <CustomAppModal
        open={customAppOpen}
        onClose={() => setCustomAppOpen(false)}
        onCreated={handleCustomAppCreated}
        showError={showError}
      />

      {/* Custom app edit modal */}
      <CustomAppModal
        open={!!editApp}
        mode="edit"
        initial={editApp}
        onClose={() => setEditApp(null)}
        onCreated={handleEdited}
        showError={showError}
      />

      {/* Custom launch URL modal */}
      <AppUrlModal
        open={!!urlApp}
        service={urlApp}
        onClose={() => setUrlApp(null)}
        onSaved={handleUrlSaved}
        showError={showError}
      />

      <PortainerConfigModal
        isOpen={portainerModalOpen}
        onClose={() => setPortainerModalOpen(false)}
      />
    </AppLayout>
  )
}

// ── App Card component ────────────────────────────────────────────────────────

interface AppCardProps {
  service: ServiceSlim
  openDropdown: string | null
  dropdownRef: React.RefObject<HTMLDivElement | null>
  onOpenDropdown: (name: string | null) => void
  onInstall: () => void
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onReinstall: () => void
  onDelete: () => void
  onUninstall: () => void
  onLogs: () => void
  onStats: () => void
  onEdit: () => void
  onSetUrl: () => void
  onUpdate: () => void
  onUpdateVersion: () => void
  liveProgressMessage?: string
  // Installed-only: per-app auto-update preference + toggle handler.
  autoUpdateEnabled?: boolean
  // Global master switch (Settings → Updates). When off, per-app toggles are inert.
  autoUpdateMasterEnabled?: boolean
  onToggleAutoUpdate?: (enabled: boolean) => void
  migrationInstructionsHref?: string
  migrationInstructionsText?: string
}

function AppCard({
  service,
  openDropdown,
  dropdownRef,
  onOpenDropdown,
  onInstall,
  onStart,
  onStop,
  onRestart,
  onReinstall,
  onDelete,
  onUninstall,
  onLogs,
  onStats,
  onEdit,
  onSetUrl,
  onUpdate,
  onUpdateVersion,
  liveProgressMessage,
  autoUpdateEnabled,
  autoUpdateMasterEnabled,
  onToggleAutoUpdate,
  migrationInstructionsHref,
  migrationInstructionsText,
}: AppCardProps) {
  const isRunning = service.status === 'running'
  const isStopped = service.installed && !isRunning
  const catColor = service.category ? CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.custom : CATEGORY_COLORS.custom
  const isDropdownOpen = openDropdown === service.service_name
  // Port pill: an ui_location may carry an explicit scheme ("https:8480") — show just the port,
  // with a lock when it's served over HTTPS, rather than the raw "https:8480" string.
  const uiIsPath = !!service.ui_location && service.ui_location.startsWith('/')
  const uiIsHttps = /^https:/.test(service.ui_location || '')
  let displayPort: string | null = null
  if (service.ui_location && !uiIsPath) {
    try {
      if (service.ui_location.startsWith('http://') || service.ui_location.startsWith('https://')) {
        const parsed = new URL(service.ui_location)
        displayPort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
      } else {
        displayPort = service.ui_location.replace(/^https?:/, '').replace(/^\/+/, '')
      }
    } catch {
      displayPort = service.ui_location.replace(/^https?:/, '').replace(/^\/+/, '')
    }
  }
  // Per-app documentation link (in-app docs page, anchored to this app's section). Null for apps
  // without a doc section (custom apps, undocumented catalog apps) so the Docs item is hidden.
  const docLink = getSupplyDepotDocLink(service.service_name)

  // Subtitle under the app name: the powered-by name plus the installed image tag
  // (e.g. "Kiwix · 3.7.0"). Only installed apps have a meaningful running version; a
  // not-yet-installed catalog entry shows just the powered-by name. Null when neither exists.
  const version = service.installed ? extractTag(service.container_image) : ''
  const subtitle =
    !service.powered_by && !version ? null : (
      <p className="text-xs text-text-muted truncate">
        {service.powered_by}
        {service.powered_by && version ? ' · ' : ''}
        {version ? <span className="font-mono">{version}</span> : null}
      </p>
    )

  function toggleDropdown(e: React.MouseEvent) {
    e.stopPropagation()
    onOpenDropdown(isDropdownOpen ? null : service.service_name)
  }

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-4 bg-surface-primary shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${service.installed
        ? 'border-desert-stone-light'
        : 'border-desert-stone-lighter hover:border-desert-stone-light'
        }`}
    >
      {/* Installed accent spine (rounded to follow the card corners — the card no longer clips
          overflow so the Manage dropdown can open above the card without being cut off) */}
      {service.installed ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-desert-green rounded-l-xl" />
      ) : null}

      {/* Top row: icon + status badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-desert-green-lighter border border-desert-green-light flex items-center justify-center flex-shrink-0">
            <DynamicIcon
              icon={(service.icon as DynamicIconName) || 'IconBrandDocker'}
              className="h-7 w-7 text-desert-green"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm leading-tight truncate">
              {service.friendly_name ?? service.service_name}
            </p>
            {subtitle}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0 ml-2">
          {service.installation_status === 'installing' ? (
            <span className="flex items-center gap-1 text-xs text-desert-orange">
              <span className="animate-spin inline-block w-3 h-3 border border-desert-orange border-t-transparent rounded-full" />
              Instalando
            </span>
          ) : isRunning ? (
            <span className="flex items-center gap-1 text-xs text-desert-green">
              <span className="h-2 w-2 rounded-full bg-desert-green" />
              Ativo
            </span>
          ) : isStopped ? (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <span className="h-2 w-2 rounded-full bg-text-muted" />
              Parado
            </span>
          ) : null}
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-xs text-text-muted leading-relaxed mb-3 flex-1 line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Metadata row: category badge + port pill */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {service.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
            {CATEGORY_LABELS[service.category] ?? toTitleCase(service.category)}
          </span>
        )}
        {Boolean(service.installed) && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              service.node === 'portainer' || service.node === 'dell-micro'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-desert-sand/30 text-desert-green-darker border-desert-stone-lighter/60'
            }`}
          >
            {service.node === 'portainer' || service.node === 'dell-micro'
              ? 'Servidor Portainer'
              : 'Local (NOMAD)'}
          </span>
        )}
        {service.is_custom ? (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-surface-secondary text-text-muted border border-surface-secondary">
            personalizado
          </span>
        ) : null}
        {service.is_user_modified && !service.is_custom ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium bg-desert-tan-lighter text-desert-tan-dark border border-desert-tan-light"
            title="Você personalizou este aplicativo, portanto ele não será sobrescrito por atualizações do catálogo."
          >
            modificado
          </span>
        ) : null}
        {service.is_deprecated ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium bg-desert-orange-lighter text-desert-orange-dark border border-desert-orange-light"
            title="Esta é uma versão legada que não recebe mais manutenção. Instale a Plataforma Educacional atual pelo catálogo e depois desinstale esta."
          >
            legado
          </span>
        ) : null}
        {displayPort && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted font-mono">
            {uiIsHttps ? '🔒 ' : ''}:{displayPort}
          </span>
        )}
        {service.available_update_version && !service.is_custom && (
          <button
            type="button"
            onClick={onUpdateVersion}
            title={`Atualizar para ${service.available_update_version}`}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-desert-orange text-white shadow-sm cursor-pointer transition-colors hover:bg-desert-orange-dark"
          >
            <IconArrowUp className="h-3 w-3" />
            Atualização disponível
          </button>
        )}
      </div>

      {/* Live installation progress banner inside card */}
      {service.installation_status === 'installing' && (
        <div className="mb-3 rounded-lg bg-desert-orange/10 border border-desert-orange/30 px-3 py-2 text-[11px] text-text-primary space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-desert-orange">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-desert-orange border-t-transparent rounded-full flex-shrink-0" />
            <span className="truncate">{liveProgressMessage || 'Preparando instalação...'}</span>
          </div>
          <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden">
            <div className="h-full bg-desert-orange animate-pulse w-2/3 rounded-full" />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!service.installed && service.installation_status !== 'installing' && (
          <StyledButton
            size="sm"
            variant="primary"
            icon="IconDownload"
            onClick={onInstall}
            fullWidth
          >
            Instalar
          </StyledButton>
        )}

        {!service.installed && service.installation_status === 'installing' && (
          <StyledButton
            size="sm"
            variant="secondary"
            loading={true}
            disabled
            fullWidth
          >
            Instalando...
          </StyledButton>
        )}

        {service.installed ? (
          <>
            {/* Open button — shown when the app has a default location or a user-set custom URL */}
            {(service.ui_location || service.custom_url) && (
              <a
                href={getServiceLink(service.ui_location || "", service.custom_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <StyledButton size="sm" variant="primary" icon="IconExternalLink" fullWidth>
                  Abrir
                </StyledButton>
              </a>
            )}

            {/* Manage dropdown */}
            <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
              <StyledButton size="sm" variant="outline" onClick={toggleDropdown} icon="IconChevronDown">
                Gerenciar
              </StyledButton>

              {isDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-52 bg-surface-primary border border-surface-secondary rounded-lg shadow-xl z-20 overflow-hidden">
                  {docLink && (
                    <a
                      href={docLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors text-left cursor-pointer text-text-primary hover:bg-surface-secondary"
                    >
                      <IconBook className="h-4 w-4" />
                      Documentação
                    </a>
                  )}
                  <DropdownItem icon={<IconWorld className="h-4 w-4" />} label="Definir URL personalizada" onClick={onSetUrl} />
                  {!service.is_unmanaged && (
                    <>
                      {isStopped && (
                        <DropdownItem icon={<IconPlayerPlay className="h-4 w-4" />} label="Iniciar" onClick={onStart} />
                      )}
                      {isRunning && (
                        <DropdownItem icon={<IconPlayerStop className="h-4 w-4" />} label="Parar" onClick={onStop} />
                      )}
                      <DropdownItem icon={<IconRefresh className="h-4 w-4" />} label="Reiniciar" onClick={onRestart} />
                      <DropdownItem icon={<IconFileText className="h-4 w-4" />} label="Logs" onClick={onLogs} />
                      <DropdownItem icon={<IconChartBar className="h-4 w-4" />} label="Estatísticas" onClick={onStats} />
                      <DropdownItem icon={<IconPencil className="h-4 w-4" />} label="Editar" onClick={onEdit} />
                      {
                        migrationInstructionsHref ? (
                          <a
                            href={migrationInstructionsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors text-left cursor-pointer text-text-primary hover:bg-surface-secondary"
                          >
                            <IconBook className="h-4 w-4" />
                            {migrationInstructionsText || 'Instruções de migração'}
                          </a>
                        ) : (null)
                      }
                      {!service.is_custom && onToggleAutoUpdate ? (
                        autoUpdateMasterEnabled ? (
                          <DropdownItem
                            icon={
                              <IconClockBolt
                                className={`h-4 w-4 ${autoUpdateEnabled ? 'text-desert-green' : ''}`}
                              />
                            }
                            label={`Atualização autom.: ${autoUpdateEnabled ? 'Ativada' : 'Desativada'}`}
                            onClick={() => onToggleAutoUpdate(!autoUpdateEnabled)}
                          />
                        ) : (
                          <DropdownItem
                            icon={<IconClockBolt className="h-4 w-4" />}
                            label="Atualização autom. desativada — abrir Config."
                            onClick={() => router.visit('/settings/update')}
                          />
                        )
                      ) : null}
                      {service.available_update_version && !service.is_custom ? (
                        <DropdownItem
                          icon={<IconArrowUp className="h-4 w-4 text-desert-green" />}
                          label={`Atualizar para ${service.available_update_version}`}
                          onClick={onUpdateVersion}
                        />
                      ) : null}
                      {service.is_custom ? (
                        <DropdownItem icon={<IconCloudDownload className="h-4 w-4" />} label="Atualizar (baixar mais recente)" onClick={onUpdate} />
                      ) : null}
                      <DropdownItem icon={<IconRefresh className="h-4 w-4 text-desert-orange" />} label="Forçar Reinstalação" onClick={onReinstall} danger />
                      {service.is_custom ? (
                        <DropdownItem icon={<IconTrash className="h-4 w-4 text-desert-red" />} label="Excluir" onClick={onDelete} danger />
                      ) : (
                        <DropdownItem icon={<IconTrash className="h-4 w-4 text-desert-red" />} label="Desinstalar" onClick={onUninstall} danger />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}

        {service.installation_status === 'installing' && (
          <div className="flex-1 flex items-center justify-center text-xs text-text-muted gap-1 py-1">
            <span className="animate-spin inline-block w-3 h-3 border border-desert-green border-t-transparent rounded-full" />
            Em andamento…
          </div>
        )}
      </div>
    </div>
  )
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors text-left cursor-pointer ${danger
        ? 'text-desert-red hover:bg-desert-red/10'
        : 'text-text-primary hover:bg-surface-secondary'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}
