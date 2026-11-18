import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTransmit } from 'react-adonis-transmit'
import { usePage } from '@inertiajs/react'
import api from '~/lib/api'
import { getServiceLink } from '~/lib/navigation'
import { SERVICE_NAMES } from '../../constants/service_names'
import { BROADCAST_CHANNELS } from '../../constants/broadcast'
import { ServiceSlim } from '../../types/services'

export type AiEngineId = 'ollama' | 'open_webui' | 'dify' | string

export interface AiEngineOption {
  id: AiEngineId
  serviceName: string
  shortName: string
  title: string
  description: string
  locationLabel: string
  online: boolean
  isInternal: boolean
  href: string
  backendNote?: string
}

/**
 * Resolves live status across all AI backends/UIs (NOMAD Native /chat, Remote Ollama, Open WebUI, Dify)
 * in real time via polling + SSE invalidation.
 */
export function useAiStatus(initialServices?: ServiceSlim[]) {
  const queryClient = useQueryClient()
  const { subscribe } = useTransmit()
  const { aiAssistantName } = usePage<{ aiAssistantName?: string }>().props

  useEffect(() => {
    const unsubInstall = subscribe(BROADCAST_CHANNELS.SERVICE_INSTALLATION, () => {
      void queryClient.invalidateQueries({ queryKey: ['installed-services'] })
      void queryClient.invalidateQueries({ queryKey: ['live-ai-remote-status'] })
    })
    const unsubUpdates = subscribe(BROADCAST_CHANNELS.SERVICE_UPDATES, () => {
      void queryClient.invalidateQueries({ queryKey: ['installed-services'] })
    })
    return () => {
      unsubInstall()
      unsubUpdates()
    }
  }, [queryClient, subscribe])

  const servicesQuery = useQuery<ServiceSlim[] | undefined>({
    queryKey: ['installed-services'],
    queryFn: () => api.getSystemServices(),
    initialData: initialServices,
    refetchInterval: 4000,
    staleTime: 2000,
  })

  const remoteQuery = useQuery<{
    configured: boolean
    connected: boolean
    url?: string | null
  } | undefined>({
    queryKey: ['live-ai-remote-status'],
    queryFn: () => api.getRemoteOllamaStatus(),
    refetchInterval: 4000,
    staleTime: 2000,
  })

  const liveServices = servicesQuery.data ?? initialServices ?? []

  return useMemo(() => {
    const ollamaSvc = liveServices.find((s) => s.service_name === SERVICE_NAMES.OLLAMA)
    const openWebUiSvc = liveServices.find((s) => s.service_name === SERVICE_NAMES.OPEN_WEBUI)
    const difySvc = liveServices.find((s) => s.service_name === SERVICE_NAMES.DIFY)

    const remoteUrl = remoteQuery.data?.url?.trim() || ''
    const hasRemoteUrl = Boolean(remoteQuery.data?.configured && remoteUrl)
    const isRemoteConnected = Boolean(remoteQuery.data?.connected)

    const resolvedNativeName =
      aiAssistantName && aiAssistantName !== 'AI Assistant' && aiAssistantName !== 'Assistente de IA'
        ? aiAssistantName
        : 'Ollama & RAG'

    const engines: AiEngineOption[] = []

    if (ollamaSvc?.installed || hasRemoteUrl) {
      const online = hasRemoteUrl ? isRemoteConnected : ollamaSvc?.status === 'running'
      const locationLabel = hasRemoteUrl
        ? `Remoto (${remoteUrl})`
        : ollamaSvc?.node === 'portainer'
          ? 'Portainer Remoto'
          : 'Contêiner Local'

      engines.push({
        id: 'ollama',
        serviceName: SERVICE_NAMES.OLLAMA,
        shortName: hasRemoteUrl ? 'Ollama Remoto' : resolvedNativeName,
        title: `Assistente Nativo N.O.M.A.D. (${resolvedNativeName})`,
        description:
          'Chat integrado em /chat com consulta direta nos seus documentos e bibliotecas ZIM offline (RAG).',
        locationLabel,
        online,
        isInternal: true,
        href: '/chat',
        backendNote: hasRemoteUrl
          ? `Conectado ao servidor remoto em ${remoteUrl}`
          : 'Motor local integrado com Qdrant RAG',
      })
    }

    if (openWebUiSvc?.installed) {
      const online = openWebUiSvc.status === 'running'
      const href = getServiceLink(openWebUiSvc.ui_location || '8500', openWebUiSvc.custom_url)
      const locationLabel =
        openWebUiSvc.node === 'portainer' ? 'Portainer Remoto' : 'Contêiner Local'

      engines.push({
        id: 'open_webui',
        serviceName: SERVICE_NAMES.OPEN_WEBUI,
        shortName: 'Open WebUI',
        title: 'Open WebUI (Multi-Modelos & APIs)',
        description:
          'Interface web avançada estilo ChatGPT para alternar entre modelos locais e múltiplas APIs gratuitas.',
        locationLabel,
        online,
        isInternal: false,
        href,
        backendNote: hasRemoteUrl
          ? `Sincronizado com Ollama remoto (${remoteUrl})`
          : ollamaSvc?.installed
            ? 'Sincronizado com Ollama do servidor'
            : 'Pronto para APIs externas / endpoints próprios',
      })
    }

    if (difySvc?.installed) {
      const online = difySvc.status === 'running'
      const href = getServiceLink(difySvc.ui_location || '8505', difySvc.custom_url)
      const locationLabel = difySvc.node === 'portainer' ? 'Portainer Remoto' : 'Contêiner Local'

      engines.push({
        id: 'dify',
        serviceName: SERVICE_NAMES.DIFY,
        shortName: 'Dify IA',
        title: 'Dify (Agentes & Automações)',
        description: 'Plataforma visual para criação de fluxos de agentes e automações com IA.',
        locationLabel,
        online,
        isInternal: false,
        href,
        backendNote: 'Serviço ativo na porta configurada',
      })
    }

    // Dynamic fallback for any additional AI chat interface installed in Supply Depot / Portainer
    const handledNames = new Set<string>([
      SERVICE_NAMES.OLLAMA,
      SERVICE_NAMES.OPEN_WEBUI,
      SERVICE_NAMES.DIFY,
      SERVICE_NAMES.QDRANT,
      SERVICE_NAMES.WHISPER,
    ])
    for (const svc of liveServices) {
      if (
        svc.installed &&
        svc.category === 'ai' &&
        !handledNames.has(svc.service_name) &&
        (svc.ui_location || svc.custom_url)
      ) {
        engines.push({
          id: svc.service_name,
          serviceName: svc.service_name,
          shortName: svc.powered_by || svc.friendly_name || svc.service_name,
          title: svc.friendly_name || svc.service_name,
          description: svc.description || 'Ferramenta de IA instalada no servidor.',
          locationLabel: svc.node === 'portainer' ? 'Portainer Remoto' : 'Contêiner Local',
          online: svc.status === 'running',
          isInternal: false,
          href: getServiceLink(svc.ui_location || '', svc.custom_url),
        })
      }
    }

    const hasAnyAi = engines.length > 0
    const hasMultiple = engines.length > 1
    const onlineEngines = engines.filter((e) => e.online)
    const isLiveOnline = onlineEngines.length > 0
    const primaryEngine = onlineEngines[0] || engines[0] || null

    let logStatusShort = 'IA Pendente'
    let logConnectionDetail = 'Aguardando ativação de motor ou interface de IA'
    let cardBadgeText = 'Configuração Pendente'
    let cardDescription =
      'Modelos locais, Open WebUI e consulta em documentos indexados totalmente off-grid.'
    let cardActionLabel = 'Configurar IA'

    if (engines.length === 1 && primaryEngine) {
      logStatusShort = primaryEngine.online
        ? `IA Online (${primaryEngine.shortName})`
        : `IA Pausada (${primaryEngine.shortName})`
      logConnectionDetail = primaryEngine.online
        ? `Conectado agora: ${primaryEngine.shortName} • ${primaryEngine.locationLabel}`
        : `Instalado: ${primaryEngine.shortName} (contêiner parado ou inicializando)`
      cardBadgeText = primaryEngine.online
        ? `${primaryEngine.shortName} Online`
        : `${primaryEngine.shortName} Pausado`
      cardDescription = primaryEngine.description
      cardActionLabel = `Abrir ${primaryEngine.shortName}`
    } else if (hasMultiple) {
      logStatusShort = isLiveOnline
        ? `IA Online (${onlineEngines.length}/${engines.length} Ativas)`
        : `${engines.length} IAs Pausadas`
      logConnectionDetail = isLiveOnline
        ? `Conectado agora: ${onlineEngines.map((e) => e.shortName).join(' + ')}`
        : `Instaladas: ${engines.map((e) => e.shortName).join(' + ')}`
      cardBadgeText = isLiveOnline
        ? `${engines.length} IAs Conectadas`
        : `${engines.length} IAs Instaladas`
      cardDescription = `Detectados: ${engines.map((e) => e.shortName).join(' • ')}. Clique para escolher qual interface abrir.`
      cardActionLabel = 'Escolher IA para Abrir'
    }

    return {
      liveServices,
      engines,
      primaryEngine,
      hasAnyAi,
      hasMultiple,
      isLiveOnline,
      remoteUrl,
      hasRemoteUrl,
      isRemoteConnected,
      logStatusShort,
      logConnectionDetail,
      cardBadgeText,
      cardDescription,
      cardActionLabel,
    }
  }, [liveServices, remoteQuery.data, aiAssistantName])
}
