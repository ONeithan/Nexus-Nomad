import https from 'node:https'
import axios, { type AxiosInstance } from 'axios'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import transmit from '@adonisjs/transmit/services/main'
import KVStore from '#models/kv_store'
import Service from '#models/service'
import type { ServiceSlim } from '../../types/services.js'
import { BROADCAST_CHANNELS } from '../../constants/broadcast.js'

export interface PortainerContainerInfo {
  id?: string
  name: string
  image: string
  state: string
  status: string
  ports: string[]
}

export interface PortainerStatus {
  enabled: boolean
  online: boolean
  url: string
  endpointId: number
  authenticated: boolean
  version?: string
  totalContainers?: number
  runningContainers?: number
  containers?: PortainerContainerInfo[]
  error?: string
  apiKey?: string
}

export interface RemoteServiceDef {
  service_name: string
  friendly_name: string
  description: string
  icon: string
  category: string
  port: number
  protocol: 'http' | 'https'
  is_built_in?: boolean
}

export type DellServiceDef = RemoteServiceDef

/**
 * PortainerService handles communication with Portainer CE running on
 * a remote Docker host.
 *
 * It enables:
 * 1. Showing all services already running on the remote host (Jellyfin, Komga, Navidrome, etc.)
 * 2. Remote deployments: when the user installs apps, they are deployed to Portainer on the server
 *    rather than consuming resources on the local device.
 * 3. Port safety: guarantees TCP port 8080 is remapped if reserved by infrastructure (e.g., UniFi Inform).
 */
export class PortainerService {
  private static readonly DEFAULT_PORTAINER_URL = ''
  private static readonly DEFAULT_TARGET_HOST = '127.0.0.1'
  private static readonly DEFAULT_ENDPOINT_ID = 1

  // Safe ports mapping on remote host (avoiding TCP 8080 conflicts)
  private static readonly PORT_REMAPS: Record<string, string> = {
    '8080': '8095',
  }

  // Pre-configured inventory of services commonly running on homelab remote servers
  public static readonly REMOTE_KNOWN_SERVICES: RemoteServiceDef[] = [
    {
      service_name: 'jellyfin',
      friendly_name: 'Jellyfin Media Server',
      description: 'Central de mídia pessoal para streaming de filmes, séries e vídeos (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 8096,
      protocol: 'http',
      is_built_in: true,
    },
    {
      service_name: 'komga-nexus',
      friendly_name: 'Komga (Nexus Codex)',
      description: 'Biblioteca e leitor de mangás, manhwas, webtoons e livros (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 25600,
      protocol: 'http',
    },
    {
      service_name: 'navidrome-nexus',
      friendly_name: 'Navidrome (Streaming de Música)',
      description: 'Servidor de streaming de áudio e músicas com suporte a playlists (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 4533,
      protocol: 'http',
    },
    {
      service_name: 'suwayomi-nexus',
      friendly_name: 'Suwayomi (Tachiyomi Server)',
      description: 'Leitor e sincronizador de mangás e manhwas na rede local (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 4567,
      protocol: 'http',
    },
    {
      service_name: 'meelo-nexus',
      friendly_name: 'Meelo (Streaming de Música)',
      description: 'Servidor de streaming e gerenciamento de músicas e videoclipes musicais (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 5000,
      protocol: 'http',
    },
    {
      service_name: 'guacamole-nexus',
      friendly_name: 'Apache Guacamole (Acesso Remoto)',
      description: 'Gateway de acesso remoto HTML5 para desktops e terminais sem cliente (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'utility',
      port: 8088,
      protocol: 'http',
    },
    {
      service_name: 'metube-nexus',
      friendly_name: 'MeTube (Download de Mídia)',
      description: 'Interface web com yt-dlp para download de vídeos e músicas (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'media',
      port: 8081,
      protocol: 'http',
    },
    {
      service_name: 'tagr-nexus',
      friendly_name: 'Tagr (Metadados de Música)',
      description: 'Organizador e editor de metadados para biblioteca musical (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'utility',
      port: 3000,
      protocol: 'http',
    },
    {
      service_name: 'yubal-nexus',
      friendly_name: 'Yubal (Download de Músicas)',
      description: 'Download e gerenciamento de músicas e álbuns para a biblioteca musical (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'utility',
      port: 8050,
      protocol: 'http',
    },
    {
      service_name: 'ignis-nexus',
      friendly_name: 'Ignis (Obsidian / Notas)',
      description: 'Obsidian Web / Gestão de notas e segundo cérebro pessoal (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'productivity',
      port: 8180,
      protocol: 'http',
    },
    {
      service_name: 'portainer-remote',
      friendly_name: 'Portainer CE (Painel de Gestão)',
      description: 'Gerenciador central de contêineres e stacks Docker no servidor remoto',
      icon: 'IconBrandDocker',
      category: 'utility',
      port: 9443,
      protocol: 'https',
    },
  ]

  public static readonly DELL_KNOWN_SERVICES = PortainerService.REMOTE_KNOWN_SERVICES

  /**
   * Check if Portainer integration has been explicitly enabled by the user
   */
  public async isEnabled(): Promise<boolean> {
    const envVal = env.get('PORTAINER_ENABLED')
    if (envVal !== undefined) return String(envVal) === 'true'
    const kvVal = await KVStore.getValue('portainer.enabled')
    if (kvVal !== null) return Boolean(kvVal)
    const url = await KVStore.getValue('portainer.url')
    return Boolean(url && url.trim().length > 0)
  }

  /**
   * Extract the hostname / IP from the configured Portainer URL
   */
  public async getTargetHost(): Promise<string> {
    const baseUrl = await this.getBaseUrl()
    if (!baseUrl) return ''
    try {
      const parsed = new URL(baseUrl)
      return parsed.hostname
    } catch {
      return baseUrl.replace(/^https?:\/\//, '').split(':')[0]
    }
  }

  /**
   * Resolve current Portainer URL from env, KVStore or default
   */
  public async getBaseUrl(): Promise<string> {
    const envVal = env.get('PORTAINER_URL')
    if (envVal?.trim()) return envVal.trim()
    const kvVal = await KVStore.getValue('portainer.url')
    if (kvVal?.trim()) return kvVal.trim()
    return PortainerService.DEFAULT_PORTAINER_URL
  }

  /**
   * Resolve Portainer API Key from env or KVStore
   */
  public async getApiKey(): Promise<string> {
    const envVal = env.get('PORTAINER_API_KEY')
    if (envVal?.trim()) return envVal.trim()
    const kvVal = await KVStore.getValue('portainer.apiKey')
    return kvVal?.trim() || ''
  }

  /**
   * Resolve Docker endpoint id (usually 1 on standalone Portainer CE)
   */
  public async getEndpointId(): Promise<number> {
    const envVal = env.get('PORTAINER_ENDPOINT_ID')
    if (envVal) {
      const parsed = Number.parseInt(String(envVal), 10)
      if (!Number.isNaN(parsed) && parsed > 0) return parsed
    }
    const kvVal = await KVStore.getValue('portainer.endpointId')
    if (kvVal) {
      const parsed = Number.parseInt(String(kvVal), 10)
      if (!Number.isNaN(parsed) && parsed > 0) return parsed
    }
    return PortainerService.DEFAULT_ENDPOINT_ID
  }

  /**
   * Create an axios instance configured with ignore-cert for Portainer self-signed HTTPS
   */
  private async getClient(
    overrideUrl?: string,
    overrideApiKey?: string
  ): Promise<{ client: AxiosInstance; baseUrl: string; apiKey: string }> {
    const rawUrl = overrideUrl && overrideUrl.trim().length > 0 ? overrideUrl.trim() : await this.getBaseUrl()
    const baseUrl = rawUrl.replace(/\/+$/, '')
    const apiKey = overrideApiKey && overrideApiKey.trim().length > 0 ? overrideApiKey.trim() : await this.getApiKey()

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (apiKey) {
      if (apiKey.startsWith('ey') && apiKey.includes('.')) {
        // Formato JWT
        headers['Authorization'] = `Bearer ${apiKey}`
      } else {
        // Portainer Access Token (X-API-Key). NUNCA enviar Authorization junto, pois o Portainer rejeita com 401
        headers['X-API-Key'] = apiKey
      }
    }

    const client = axios.create({
      baseURL: baseUrl || 'http://127.0.0.1:9443',
      timeout: 6000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers,
    })

    return { client, baseUrl, apiKey }
  }

  /**
   * Test connection and retrieve status of the remote Portainer server
   */
  public async getStatus(overrideUrl?: string, overrideApiKey?: string): Promise<PortainerStatus> {
    const { client, baseUrl, apiKey } = await this.getClient(overrideUrl, overrideApiKey)
    const endpointId = await this.getEndpointId()
    const enabled = await this.isEnabled()

    if (!baseUrl) {
      return {
        enabled,
        online: false,
        url: '',
        endpointId,
        authenticated: false,
        apiKey: apiKey || '',
        error: 'Nenhum endereço de servidor Portainer configurado.',
      }
    }

    try {
      // 1. Try public ping / status endpoint
      const statusResp = await client.get('/api/status').catch(() => null)
      const systemInfoResp = await client.get('/api/system/version').catch(() => null)

      const version =
        systemInfoResp?.data?.Version ||
        statusResp?.data?.Version ||
        'Portainer CE'

      // 2. If API Key is present, query endpoints & containers
      let totalContainers = 0
      let runningContainers = 0
      let authenticated = false
      let resolvedEndpointId = endpointId
      let containersList: PortainerContainerInfo[] = []

      if (apiKey) {
        try {
          // Discover active environments / endpoints from Portainer
          const endpointsResp = await client.get('/api/endpoints').catch((err) => {
            logger.warn(`Portainer /api/endpoints failed: ${err?.message}`)
            return null
          })

          let endpoints: any[] = []
          if (Array.isArray(endpointsResp?.data)) {
            endpoints = endpointsResp.data
          } else if (endpointsResp?.data && Array.isArray(endpointsResp.data.values)) {
            endpoints = endpointsResp.data.values
          }

          if (endpoints.length > 0) {
            authenticated = true
            const activeEp =
              endpoints.find((ep: any) => ep.Type === 1 || ep.Type === 2) ||
              endpoints[0]
            if (activeEp?.Id) {
              resolvedEndpointId = activeEp.Id
            }

            // If snapshots exist, initialize counts from snapshot
            if (activeEp?.Snapshots && activeEp.Snapshots[0]) {
              const snap = activeEp.Snapshots[0]
              runningContainers = snap.RunningContainerCount ?? 0
              totalContainers = (snap.RunningContainerCount ?? 0) + (snap.StoppedContainerCount ?? 0)
            }
          }

          // Fetch containers list from Docker proxy on Portainer
          // Try candidate endpoint IDs (resolvedEndpointId, 1, 2)
          const targetEpIds = Array.from(new Set([resolvedEndpointId, 1, 2].filter(Boolean)))
          for (const epId of targetEpIds) {
            try {
              const containersResp = await client.get(
                `/api/endpoints/${epId}/docker/containers/json?all=1`
              )
              if (Array.isArray(containersResp?.data)) {
                authenticated = true
                resolvedEndpointId = epId
                totalContainers = containersResp.data.length
                runningContainers = containersResp.data.filter((c: any) => c.State === 'running').length

                containersList = containersResp.data.map((c: any) => {
                  const rawName = (c.Names && c.Names[0]) || (c.Id ? c.Id.slice(0, 12) : 'container')
                  const cleanName = rawName.replace(/^\//, '')
                  const ports = (c.Ports || [])
                    .map((p: any) =>
                      p.PublicPort
                        ? `${p.PublicPort}:${p.PrivatePort}/${p.Type}`
                        : `${p.PrivatePort}/${p.Type}`
                    )
                    .filter(Boolean)
                  return {
                    id: c.Id ? c.Id.slice(0, 12) : undefined,
                    name: cleanName,
                    image: c.Image || '',
                    state: c.State || 'unknown',
                    status: c.Status || '',
                    ports,
                  }
                })
                break
              }
            } catch {
              // Try next endpoint ID
            }
          }
        } catch (authErr: any) {
          logger.warn(`Portainer API key auth failed: ${authErr?.message}`)
        }
      }

      let authError: string | undefined = undefined
      if (apiKey && !authenticated) {
        authError = 'Servidor online, mas o token de acesso (API Key) não foi aceito pelo Portainer.'
      }

      return {
        enabled,
        online: true,
        url: baseUrl,
        endpointId: resolvedEndpointId,
        authenticated,
        version,
        totalContainers,
        runningContainers,
        containers: containersList,
        apiKey: apiKey || '',
        error: authError,
      }
    } catch (error: any) {
      logger.info(`Portainer at ${baseUrl} is unreachable: ${error.message}`)
      return {
        enabled,
        online: false,
        url: baseUrl,
        endpointId,
        authenticated: false,
        apiKey: apiKey || '',
        error: error.message || 'Não foi possível conectar ao servidor Portainer.',
      }
    }
  }

  /**
   * Helper to format a raw stack name (e.g. 'nginx-proxy-manager' or 'uptime_kuma') into a title.
   */
  private formatStackTitle(rawName: string): string {
    const clean = rawName.replace(/^nomad[-_]/, '').replace(/[-_]/g, ' ').trim()
    return clean
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Enrich and synchronize catalog services with the remote server inventory.
   * - Dynamically queries Portainer stacks (/api/stacks) and active containers.
   * - Shows all 15+ stacks and containers running on the remote host in "Instalados".
   * - Automatically binds matching catalog apps (e.g. Jellyfin on 8096, Kiwix on 8090).
   * - Falls back to REMOTE_KNOWN_SERVICES if Portainer API is offline or unauthenticated.
   */
  public async syncWithDellInventory(services: ServiceSlim[]): Promise<ServiceSlim[]> {
    const enabled = await this.isEnabled()
    if (!enabled) {
      return services
    }

    const hostIp = await this.getTargetHost()
    if (!hostIp) return services

    const remoteKnown = PortainerService.REMOTE_KNOWN_SERVICES
    const deployedServices = await this.getDeployedServices()
    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()

    // 1. Fetch live stacks and containers from Portainer FIRST if API Key is available
    let liveStacks: Array<{ Id: number; Name: string; Status?: number; EndpointId?: number }> = []
    let liveContainers: Array<{
      fullId: string
      id: string
      name: string
      projectName: string
      state: string
      publicPort?: number
    }> = []
    let portainerReachable = false

    if (apiKey) {
      try {
        const stacksResp = await client.get('/api/stacks', { timeout: 8000 }).catch(() => null)
        if (Array.isArray(stacksResp?.data)) {
          liveStacks = stacksResp.data
        }

        const containersResp = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 8000 })
          .catch(() => null)

        if (Array.isArray(containersResp?.data)) {
          portainerReachable = true
          liveContainers = containersResp.data.map((c: any) => {
            const rawName = (c.Names && c.Names[0]) || ''
            const cleanName = rawName.replace(/^\//, '')
            const projectName =
              c.Labels?.['com.docker.compose.project'] ||
              cleanName.split('-')[0] ||
              cleanName
            const publicPort = (c.Ports || []).find((p: any) => p.PublicPort)?.PublicPort
            return {
              fullId: c.Id || '',
              id: c.Id ? c.Id.slice(0, 12) : '',
              name: cleanName,
              projectName: projectName.toLowerCase(),
              state: c.State || 'unknown',
              publicPort,
            }
          })
        }
      } catch (err: any) {
        logger.debug(`[PortainerService] Dynamic stack discovery: ${err?.message}`)
      }
    }

    // Auto-clean any orphaned '-init' containers or broken 'nomad-*' stacks with no main container
    if (portainerReachable) {
      for (const initCont of liveContainers.filter((c) => c.name.endsWith('-init') && c.state !== 'running')) {
        await client
          .delete(`/api/endpoints/${endpointId}/docker/containers/${initCont.fullId}?force=true&v=true`, { timeout: 5000 })
          .catch(() => {})
      }
      for (const stack of liveStacks) {
        const sName = (stack.Name || '').toLowerCase()
        if (sName.startsWith('nomad-')) {
          const hasMainCont = liveContainers.some(
            (c) =>
              !c.name.endsWith('-init') &&
              (c.name.toLowerCase() === sName || c.projectName.toLowerCase() === sName)
          )
          if (!hasMainCont) {
            const sEpId = stack.EndpointId || endpointId
            await client
              .delete(`/api/stacks/${stack.Id}?endpointId=${sEpId}`, { timeout: 8000 })
              .catch(() => {})
          }
        }
      }
    }

    // 2. Reconcile & Enrich catalog services deployed to Portainer
    const deployedSet = new Set(deployedServices)

    // Also auto-discover any catalog service whose `nomad-<service_name>` container exists on Portainer
    if (portainerReachable) {
      for (const svc of services) {
        const targetContName = `nomad-${svc.service_name}`.toLowerCase()
        const found = liveContainers.find(
          (c) => !c.name.endsWith('-init') && c.name.toLowerCase() === targetContName
        )
        if (found && !deployedSet.has(svc.service_name)) {
          deployedSet.add(svc.service_name)
          await this.markAsDeployedRemotely(svc.service_name)
        }
      }
    }

    for (const deployedName of Array.from(deployedSet)) {
      const index = services.findIndex((s) => s.service_name === deployedName)
      const matchedCont = liveContainers.find(
        (c) =>
          !c.name.endsWith('-init') &&
          (c.name.toLowerCase() === `nomad-${deployedName.toLowerCase()}` ||
            c.name.toLowerCase() === deployedName.toLowerCase() ||
            c.projectName.toLowerCase() === `nomad-${deployedName.toLowerCase()}`)
      )

      // If Portainer is reachable and the container no longer exists (e.g. removed by user or failed deploy),
      // automatically unmark it so NOMAD shows "Instalar" instead of a phantom "Ativo" card!
      if (portainerReachable && !matchedCont) {
        const isCurrentlyInstalling = index !== -1 && services[index].installation_status === 'installing'
        if (!isCurrentlyInstalling) {
          await this.unmarkDeployedRemotely(deployedName)
          await Service.query()
            .where('service_name', deployedName)
            .update({ installed: false, installation_status: 'idle', custom_url: null })
            .catch(() => {})
          if (index !== -1) {
            services[index] = {
              ...services[index],
              installed: false,
              status: 'unknown',
              custom_url: null,
            }
          }
          continue
        }
      }

      if (index !== -1) {
        const item = services[index]
        const scheme = /^https:/i.test(item.ui_location || '') ? 'https' : 'http'
        const rawPort = item.ui_location
          ? item.ui_location.replace(/^https?:/, '').replace(/^.*?:/, '')
          : '8090'
        const defaultPort = rawPort === '8080' ? PortainerService.PORT_REMAPS['8080'] || '8095' : rawPort
        const resolvedPort = matchedCont?.publicPort ? String(matchedCont.publicPort) : defaultPort
        const remoteUrl = `${scheme}://${hostIp}:${resolvedPort}`
        const realStatus = matchedCont
          ? matchedCont.state === 'running'
            ? 'running'
            : 'stopped'
          : 'running'

        services[index] = {
          ...item,
          installed: true,
          status: realStatus,
          node: 'portainer',
          node_label: 'Servidor Portainer',
          ui_location: remoteUrl,
          custom_url: remoteUrl,
        }
      }
    }

    // Helper map to quickly find container info by stack name or container name
    const findContainerForApp = (namePattern: string) => {
      const lower = namePattern.toLowerCase()
      return liveContainers.find(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.projectName.toLowerCase() === lower ||
          lower.includes(c.projectName.toLowerCase())
      )
    }

    // 3. Mark Jellyfin if found in catalog or running remotely
    const jellyfinIndex = services.findIndex((s) => s.service_name.toLowerCase() === 'jellyfin')
    if (jellyfinIndex !== -1) {
      const jellyfin = services[jellyfinIndex]
      const runningJelly = findContainerForApp('jellyfin')
      const port = runningJelly?.publicPort || 8096
      services[jellyfinIndex] = {
        ...jellyfin,
        installed: true,
        status: runningJelly ? (runningJelly.state === 'running' ? 'running' : 'stopped') : 'running',
        node: 'portainer',
        node_label: 'Servidor Portainer',
        ui_location: `http://${hostIp}:${port}`,
        custom_url: `http://${hostIp}:${port}`,
        is_unmanaged: true,
        friendly_name: jellyfin.friendly_name || 'Jellyfin Media Server',
        description:
          jellyfin.description ||
          `Central de mídia pessoal conectada ao Servidor Portainer (Porta ${port})`,
      }
    }

    // 4. Inject Known Remote Services (Komga, Navidrome, Suwayomi, Meelo, Yubal, Ignis, etc.)
    const existingServiceNames = new Set(services.map((s) => s.service_name.toLowerCase()))
    let nextId = 9000

    for (const remoteApp of remoteKnown) {
      if (
        existingServiceNames.has(remoteApp.service_name.toLowerCase()) ||
        remoteApp.service_name === 'jellyfin'
      ) {
        continue
      }

      // Check if real container/stack exists on Portainer for live status and port
      const matched = findContainerForApp(remoteApp.service_name.replace('-nexus', ''))
      const resolvedPort = matched?.publicPort || remoteApp.port
      const isRunning = matched ? matched.state === 'running' : true
      const launchUrl = `${remoteApp.protocol}://${hostIp}:${resolvedPort}`

      services.push({
        id: nextId++,
        service_name: remoteApp.service_name,
        friendly_name: remoteApp.friendly_name,
        description: remoteApp.description,
        icon: remoteApp.icon,
        installed: true,
        installation_status: 'idle',
        status: isRunning ? 'running' : 'stopped',
        ui_location: launchUrl,
        custom_url: launchUrl,
        powered_by: 'Servidor Remoto',
        display_order: 50 + nextId,
        container_image: 'remote-container',
        available_update_version: null,
        auto_update_enabled: false,
        is_custom: false,
        is_user_modified: false,
        is_deprecated: false,
        is_link_tile: true,
        link_color: '#10b981',
        category: remoteApp.category,
        node: 'portainer',
        node_label: 'Servidor Portainer',
        is_unmanaged: true,
      })
      existingServiceNames.add(remoteApp.service_name.toLowerCase())
    }

    // 5. Dynamic Discovery: Add any OTHER stacks running on Portainer (all 15 stacks guaranteed)
    for (const stack of liveStacks) {
      const rawStackName = stack.Name || ''
      const lowerStackName = rawStackName.toLowerCase()

      // Skip NOMAD-managed catalog stacks or stacks already matched by catalog or known remote services
      const alreadyHandled =
        lowerStackName.startsWith('nomad-') ||
        lowerStackName.startsWith('nomad_') ||
        existingServiceNames.has(lowerStackName) ||
        existingServiceNames.has(`${lowerStackName}-nexus`) ||
        existingServiceNames.has(`nomad-${lowerStackName}`) ||
        Array.from(existingServiceNames).some((name) => name.includes(lowerStackName))

      if (alreadyHandled) {
        continue
      }

      // Find public port and running state from containers belonging to this stack
      const stackContainers = liveContainers.filter(
        (c) =>
          c.projectName === lowerStackName ||
          c.name.toLowerCase().includes(lowerStackName)
      )
      const isRunning =
        stackContainers.length > 0
          ? stackContainers.some((c) => c.state === 'running')
          : stack.Status === 1
      const publicPort = stackContainers.find((c) => c.publicPort)?.publicPort

      const launchUrl = publicPort
        ? `http://${hostIp}:${publicPort}`
        : `https://${hostIp}:9443`

      const friendlyTitle = this.formatStackTitle(rawStackName)

      services.push({
        id: nextId++,
        service_name: `portainer-stack-${lowerStackName}`,
        friendly_name: `${friendlyTitle} (Portainer)`,
        description: `Stack de contêineres ativa no servidor Portainer${publicPort ? ` (Porta ${publicPort})` : ''}`,
        icon: 'IconBrandDocker',
        installed: true,
        installation_status: 'idle',
        status: isRunning ? 'running' : 'stopped',
        ui_location: launchUrl,
        custom_url: launchUrl,
        powered_by: 'Servidor Remoto',
        display_order: 100 + nextId,
        container_image: 'remote-stack',
        available_update_version: null,
        auto_update_enabled: false,
        is_custom: false,
        is_user_modified: false,
        is_deprecated: false,
        is_link_tile: true,
        link_color: '#10b981',
        category: 'utility',
        node: 'portainer',
        node_label: 'Servidor Portainer',
        is_unmanaged: true,
      })
      existingServiceNames.add(`portainer-stack-${lowerStackName}`)
    }

    return services
  }

  public async syncWithRemoteInventory(services: ServiceSlim[]): Promise<ServiceSlim[]> {
    return this.syncWithDellInventory(services)
  }

  /**
   * Helper methods to durably track which services are deployed on Portainer remote server.
   */
  public async getDeployedServices(): Promise<string[]> {
    try {
      const raw = await KVStore.getValue('portainer.deployedServices')
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      return JSON.parse(String(raw))
    } catch {
      return []
    }
  }

  public async isDeployedRemotely(serviceName: string): Promise<boolean> {
    const deployed = await this.getDeployedServices()
    return deployed.includes(serviceName)
  }

  public async markAsDeployedRemotely(serviceName: string): Promise<void> {
    const deployed = await this.getDeployedServices()
    if (!deployed.includes(serviceName)) {
      deployed.push(serviceName)
      await KVStore.setValue('portainer.deployedServices', JSON.stringify(deployed))
    }
  }

  public async unmarkDeployedRemotely(serviceName: string): Promise<void> {
    const deployed = await this.getDeployedServices()
    const updated = deployed.filter((s) => s !== serviceName)
    await KVStore.setValue('portainer.deployedServices', JSON.stringify(updated))
  }

  /**
   * Broadcast an installation event to the frontend via SSE
   */
  private broadcast(serviceName: string, event: string, message: string) {
    try {
      transmit.broadcast(`services:${serviceName}`, { event, message })
      transmit.broadcast(`services:portainer:${serviceName}`, { event, message })
      transmit.broadcast(BROADCAST_CHANNELS.SERVICE_INSTALLATION, {
        service_name: serviceName,
        timestamp: new Date().toISOString(),
        status: event,
        message,
      })
    } catch (e: any) {
      logger.debug(`Could not broadcast SSE event for ${serviceName}: ${e.message}`)
    }
  }

  /**
   * Rewrite storage bind paths when Portainer shares the same Docker host as NOMAD
   * so apps like Kiwix, Calibre-Web, Jellyfin, Vaultwarden, and FileBrowser share the
   * exact `/opt/project-nomad/storage/...` directories managed by NOMAD.
   */
  private rewriteBindsForHostStorage(
    rawBinds: string[],
    hostStorageRoot: string | null
  ): { binds: string[]; usesHostBinds: boolean } {
    if (!rawBinds || rawBinds.length === 0 || !hostStorageRoot) {
      return { binds: rawBinds || [], usesHostBinds: false }
    }
    const defaultPrefix = '/opt/project-nomad/storage'
    const rewritten = rawBinds.map((b) => {
      const firstColon = b.indexOf(':')
      if (firstColon < 0) return b
      const hostSrc = b.slice(0, firstColon)
      const rest = b.slice(firstColon)
      if (hostSrc === defaultPrefix || hostSrc.startsWith(defaultPrefix + '/')) {
        return `${hostStorageRoot}${hostSrc.slice(defaultPrefix.length)}${rest}`
      }
      return b
    })
    return { binds: rewritten, usesHostBinds: true }
  }

  /**
   * Build a clean, single-service Docker Compose definition for deploying apps via Portainer Stacks API.
   * Avoids multi-container `depends_on: service_completed_successfully` sidecars (`init-library`, `init-ssl`)
   * which cause Portainer standalone stacks to stall in `created` or report `Error` state.
   */
  private buildComposeFile(
    serviceName: string,
    image: string,
    primaryHostPort: string,
    config: any,
    cmd: string | null = null,
    hostStorageRoot: string | null = null,
    extraEnv: string[] = []
  ): string {
    const isKiwix = serviceName.toLowerCase().includes('kiwix')

    // 1. Build Ports List
    const portsList: string[] = []
    const portBindings = config?.HostConfig?.PortBindings || {}
    const exposedPorts = Object.keys(config?.ExposedPorts || {})
    const boundInternals = new Set<string>()

    // Primary UI port mapping
    let primaryInternal = '8080'
    if (Object.keys(portBindings).length > 0) {
      primaryInternal = Object.keys(portBindings)[0].replace(/\/.*$/, '')
    } else if (exposedPorts.length > 0) {
      primaryInternal = exposedPorts[0].replace(/\/.*$/, '')
    }
    portsList.push(`"${primaryHostPort}:${primaryInternal}"`)
    boundInternals.add(primaryInternal)

    // Secondary ports (e.g. Kolibri 8311, Qdrant 6334)
    for (const [bindingKey, bindingArr] of Object.entries(portBindings)) {
      const intPort = bindingKey.replace(/\/.*$/, '')
      if (!boundInternals.has(intPort)) {
        const hostP = (bindingArr as any)?.[0]?.HostPort || intPort
        portsList.push(`"${hostP}:${intPort}"`)
        boundInternals.add(intPort)
      }
    }

    // 2. Build Volumes List & Named Volumes declarations
    const volumeMounts: string[] = []
    const declaredNamedVolumes = new Set<string>()

    const rawBinds: string[] = config?.HostConfig?.Binds || []
    const { binds: resolvedBinds, usesHostBinds } = this.rewriteBindsForHostStorage(
      rawBinds,
      hostStorageRoot
    )

    if (resolvedBinds.length > 0) {
      for (const bind of resolvedBinds) {
        if (usesHostBinds && bind.startsWith('/')) {
          volumeMounts.push(`- ${bind}`)
        } else {
          const parts = bind.split(':')
          const targetPath = parts[1] || '/data'
          const mode = parts[2] ? `:${parts[2]}` : ''
          const cleanName =
            targetPath
              .replace(/^\//, '')
              .replace(/[^a-zA-Z0-9_-]/g, '-')
              .toLowerCase() || 'data'
          const volName = `nomad-${serviceName}-${cleanName}`
          volumeMounts.push(`- ${volName}:${targetPath}${mode}`)
          declaredNamedVolumes.add(volName)
        }
      }
    } else {
      const defaultVol = `nomad-${serviceName}-data`
      volumeMounts.push(`- ${defaultVol}:/data`)
      declaredNamedVolumes.add(defaultVol)
    }

    // 3. Environment Variables
    const envVars = [
      ...(config?.Env || []),
      ...extraEnv,
      'LANG=pt_BR.UTF-8',
      'LC_ALL=pt_BR.UTF-8',
      'TZ=America/Sao_Paulo',
    ]

    const portsBlock = portsList.map((p) => `      - ${p}`).join('\n')
    const volumesBlock = volumeMounts.map((v) => `      ${v}`).join('\n')
    const envBlock = envVars.map((e) => `      - ${JSON.stringify(e)}`).join('\n')
    const userLine = config?.User ? `    user: "${config.User}"\n` : ''

    let cmdBlock = ''
    if (isKiwix) {
      cmdBlock = `    command: ["--library", "/data/kiwix-library.xml", "--monitorLibrary", "--address=all"]\n`
    } else if (cmd && cmd.trim()) {
      const parts = cmd.trim().split(/\s+/).map((s) => JSON.stringify(s))
      cmdBlock = `    command: [${parts.join(', ')}]\n`
    }

    const topLevelVolumesBlock =
      declaredNamedVolumes.size > 0
        ? `\nvolumes:\n${Array.from(declaredNamedVolumes)
            .map((v) => `  ${v}:`)
            .join('\n')}\n`
        : ''

    return `version: '3.8'

services:
  ${serviceName}:
    image: ${image}
    container_name: nomad-${serviceName}
    restart: unless-stopped
${userLine}    ports:
${portsBlock}
    volumes:
${volumesBlock}
    environment:
${envBlock}
${cmdBlock}${topLevelVolumesBlock}`
  }

  /**
   * Inspect the Portainer endpoint's containers to check if `nomad_admin` runs on the same
   * Docker daemon. If so, returns the host path backing `/app/storage` (e.g. `/opt/project-nomad/storage`).
   */
  private async detectEndpointHostStorageRoot(
    client: AxiosInstance,
    endpointId: number,
    fallbackRoot?: string
  ): Promise<string | null> {
    try {
      const listResp = await client
        .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 10000 })
        .catch(() => null)
      const containers: any[] = Array.isArray(listResp?.data) ? listResp.data : []
      const adminCont = containers.find((c: any) =>
        c.Names?.some((n: string) => n === '/nomad_admin' || n.includes('nomad_admin'))
      )
      if (!adminCont) {
        return null
      }
      const inspectResp = await client
        .get(`/api/endpoints/${endpointId}/docker/containers/${adminCont.Id}/json`, {
          timeout: 8000,
        })
        .catch(() => null)
      const mounts: any[] = inspectResp?.data?.Mounts || []
      const storageMount = mounts.find(
        (m: any) => m.Type === 'bind' && m.Destination === '/app/storage'
      )
      if (storageMount?.Source) {
        return storageMount.Source
      }
      return fallbackRoot || '/opt/project-nomad/storage'
    } catch {
      return fallbackRoot || null
    }
  }

  /**
   * Resolve all candidate Portainer endpoint IDs (active endpoints from `/api/endpoints` + configured ID).
   */
  private async resolveCandidateEndpointIds(
    client: AxiosInstance,
    defaultEndpointId: number
  ): Promise<number[]> {
    const ids = new Set<number>([defaultEndpointId, 1])
    try {
      const epResp = await client.get('/api/endpoints', { timeout: 8000 }).catch(() => null)
      let endpoints: any[] = []
      if (Array.isArray(epResp?.data)) {
        endpoints = epResp.data
      } else if (epResp?.data && Array.isArray(epResp.data.values)) {
        endpoints = epResp.data.values
      }
      for (const ep of endpoints) {
        if (typeof ep?.Id === 'number' && ep.Id > 0) {
          ids.add(ep.Id)
        }
      }
    } catch {}
    return Array.from(ids)
  }

  /**
   * Clean up any existing Portainer stack AND any conflicting containers for `serviceName`
   * before deploying or when uninstalling, preventing Docker `409 Conflict` and ensuring
   * complete removal from Portainer.
   */
  private async cleanupBeforeRemoteDeploy(
    client: AxiosInstance,
    endpointId: number,
    serviceName: string,
    stackName: string
  ): Promise<void> {
    const lowerStack = stackName.toLowerCase()
    const lowerService = serviceName.toLowerCase()
    const altStack = `nomad-${lowerService.replace(/^nomad[-_]/, '')}`
    const candidateEpIds = await this.resolveCandidateEndpointIds(client, endpointId)

    const deleteMatchingStacks = async () => {
      const stacksResp = await client.get('/api/stacks', { timeout: 10000 }).catch(() => null)
      const stacks: any[] = Array.isArray(stacksResp?.data) ? stacksResp.data : []
      for (const s of stacks) {
        const sName = (s.Name || '').toLowerCase()
        if (sName === lowerStack || sName === lowerService || sName === altStack) {
          const sEpId = s.EndpointId || candidateEpIds[0] || endpointId
          logger.info(
            `[PortainerService] Removing Portainer stack ${s.Name} (ID ${s.Id}, endpoint ${sEpId})...`
          )
          await client
            .delete(`/api/stacks/${s.Id}?endpointId=${sEpId}`, { timeout: 20000 })
            .catch(async () => {
              await client
                .delete(`/api/stacks/${s.Id}?endpointId=${sEpId}&external=false`, { timeout: 15000 })
                .catch(() => {})
              await client
                .delete(`/api/stacks/${s.Id}?endpointId=${sEpId}&external=true`, { timeout: 15000 })
                .catch(() => {})
            })
        }
      }
    }

    const deleteMatchingContainers = async () => {
      const targetNames = new Set([
        `/${lowerStack}`,
        `/${lowerService}`,
        `/${altStack}`,
        ...(lowerService.includes('kiwix') ? ['/nomad-kiwix-init'] : []),
        ...(lowerService.includes('vaultwarden') ? ['/nomad-vaultwarden-init'] : []),
      ])

      for (const epId of candidateEpIds) {
        const listResp = await client
          .get(`/api/endpoints/${epId}/docker/containers/json?all=1`, { timeout: 10000 })
          .catch(() => null)
        const containers: any[] = Array.isArray(listResp?.data) ? listResp.data : []

        for (const c of containers) {
          const cNames: string[] = (c.Names || []).map((n: string) => n.toLowerCase())
          const proj = (c.Labels?.['com.docker.compose.project'] || '').toLowerCase()
          const comSvc = (c.Labels?.['com.docker.compose.service'] || '').toLowerCase()
          const isMatch =
            cNames.some(
              (n) =>
                targetNames.has(n) ||
                n.startsWith(`/${lowerStack}-`) ||
                n.startsWith(`/${lowerStack}_`) ||
                n.startsWith(`/${lowerService}-`) ||
                n.startsWith(`/${lowerService}_`)
            ) ||
            proj === lowerStack ||
            proj === lowerService ||
            proj === altStack ||
            comSvc === lowerService ||
            comSvc === lowerStack

          if (isMatch && c.Id) {
            logger.info(
              `[PortainerService] Removing container ${cNames.join(',')} (${c.Id.slice(0, 12)}) on endpoint ${epId}...`
            )
            await client
              .post(`/api/endpoints/${epId}/docker/containers/${c.Id}/stop`, null, { timeout: 8000 })
              .catch(() => {})
            await client
              .delete(`/api/endpoints/${epId}/docker/containers/${c.Id}?force=true&v=true`, {
                timeout: 15000,
              })
              .catch(() => {})
          }
        }
      }
    }

    try {
      // 1. Delete stacks first
      await deleteMatchingStacks()
      await new Promise((r) => setTimeout(r, 600))
      // 2. Force-remove any remaining containers (including stuck 'created' sidecars)
      await deleteMatchingContainers()
      await new Promise((r) => setTimeout(r, 400))
      // 3. Second pass on stacks in case a stuck container prevented stack deletion on pass 1
      await deleteMatchingStacks()
    } catch (err: any) {
      logger.warn(`[PortainerService] Cleanup warning for ${serviceName}: ${err?.message}`)
    }
  }

  /**
   * If deploying to a truly separate remote host (where host bind storage isn't shared with `nomad_admin`),
   * initialize named volume `nomad-<serviceName>-data` via a temporary one-shot container that is
   * immediately deleted before the stack is created.
   */
  private async initNamedVolumeIfRemoteOnly(
    client: AxiosInstance,
    endpointId: number,
    serviceName: string
  ): Promise<void> {
    const isKiwix = serviceName.toLowerCase().includes('kiwix')
    const isVaultwarden = serviceName.toLowerCase().includes('vaultwarden')
    if (!isKiwix && !isVaultwarden) return

    const initContName = `nomad-tmp-init-${Date.now()}`
    const volName = `nomad-${serviceName}-data`
    try {
      await client
        .post(`/api/endpoints/${endpointId}/docker/images/create?fromImage=alpine%3Alatest`, null, {
          timeout: 60000,
        })
        .catch(() => {})

      const shellCmd = isKiwix
        ? 'if [ ! -f /data/kiwix-library.xml ]; then echo \'<?xml version="1.0" encoding="UTF-8"?><library version="20110515"/>\' > /data/kiwix-library.xml; fi'
        : "apk add --no-cache openssl >/dev/null 2>&1; if [ ! -f /data/cert.pem ] || [ ! -f /data/key.pem ]; then openssl req -x509 -newkey rsa:2048 -nodes -keyout /data/key.pem -out /data/cert.pem -days 3650 -subj '/CN=vaultwarden'; chmod 600 /data/key.pem; fi"

      const createResp = await client.post(
        `/api/endpoints/${endpointId}/docker/containers/create?name=${initContName}`,
        {
          Image: 'alpine:latest',
          Cmd: ['sh', '-c', shellCmd],
          HostConfig: {
            Binds: [`${volName}:/data`],
          },
        },
        { timeout: 15000 }
      )
      const cid = createResp.data?.Id
      if (cid) {
        await client.post(`/api/endpoints/${endpointId}/docker/containers/${cid}/start`, null, {
          timeout: 15000,
        })
        await new Promise((r) => setTimeout(r, 3000))
        await client
          .delete(`/api/endpoints/${endpointId}/docker/containers/${cid}?force=true`, {
            timeout: 10000,
          })
          .catch(() => {})
      }
    } catch (err: any) {
      logger.debug(`[PortainerService] Remote volume init skipped/failed: ${err?.message}`)
    }
  }

  /**
   * Deploy a NOMAD service to remote Portainer.
   * Validates API authentication upfront so failures give immediate actionable feedback.
   */
  public async deployService(
    serviceName: string,
    preinstall?: { hostStorageRoot?: string; extraEnv?: string[] }
  ): Promise<{ success: boolean; message: string }> {
    const service = await Service.query().where('service_name', serviceName).first()
    if (!service) {
      return { success: false, message: `Serviço "${serviceName}" não encontrado no catálogo.` }
    }

    const hostIp = (await this.getTargetHost()) || PortainerService.DEFAULT_TARGET_HOST
    const apiKey = await this.getApiKey()

    if (!apiKey) {
      const err =
        'Chave de API do Portainer não configurada. Acesse Configurações > Servidores e informe o token de acesso (API Key) para permitir instalações remotas.'
      this.broadcast(serviceName, 'error', err)
      service.installation_status = 'error'
      await service.save()
      return { success: false, message: err }
    }

    const { client } = await this.getClient()
    const endpointId = await this.getEndpointId()

    // Parse container config
    let config: any = {}
    try {
      if (service.container_config) {
        config =
          typeof service.container_config === 'string'
            ? JSON.parse(service.container_config)
            : service.container_config
      }
    } catch {
      config = {}
    }

    // Determine target host port, avoiding port 8080 conflicts
    let hostPort = service.ui_location
      ? service.ui_location.replace(/^https?:/, '').replace(/^.*?:/, '')
      : '8090'
    if (hostPort === '8080') {
      hostPort = PortainerService.PORT_REMAPS['8080'] || '8095'
      logger.info(`[PortainerService] Port 8080 is reserved. Remapped ${serviceName} to ${hostPort}.`)
    }

    this.broadcast(
      serviceName,
      'initializing',
      `Iniciando implantação de ${service.friendly_name} no servidor Portainer (${hostIp})...`
    )

    // Set installation status to installing
    service.installation_status = 'installing'
    await service.save()

    // Execute remote deploy asynchronously
    this.executeRemoteDeploy(
      service,
      config,
      hostPort,
      hostIp,
      client,
      apiKey,
      endpointId,
      preinstall
    ).catch(async (err) => {
      logger.error(`Remote deploy error for ${serviceName}: ${err.message}`)
      service.installation_status = 'error'
      await service.save()
      this.broadcast(serviceName, 'error', `Falha na instalação remota: ${err.message}`)
    })

    return {
      success: true,
      message: `Implantação de "${service.friendly_name}" enviada para o Servidor Portainer.`,
    }
  }

  private async executeRemoteDeploy(
    service: Service,
    config: any,
    hostPort: string,
    hostIp: string,
    client: AxiosInstance,
    _apiKey: string,
    endpointId: number,
    preinstall?: { hostStorageRoot?: string; extraEnv?: string[] }
  ): Promise<void> {
    const serviceName = service.service_name
    const scheme = /^https:/i.test(service.ui_location || '') ? 'https' : 'http'
    const targetUrl = `${scheme}://${hostIp}:${hostPort}`
    const stackName = `nomad-${serviceName}`
    const extraEnv = preinstall?.extraEnv || []

    try {
      // 1. Resolve real active endpointId if available
      try {
        const epResp = await client.get('/api/endpoints', { timeout: 10000 }).catch(() => null)
        let endpoints: any[] = []
        if (Array.isArray(epResp?.data)) {
          endpoints = epResp.data
        } else if (epResp?.data && Array.isArray(epResp.data.values)) {
          endpoints = epResp.data.values
        }
        if (endpoints.length > 0) {
          const activeEp = endpoints.find((e: any) => e.Type === 1 || e.Type === 2) || endpoints[0]
          if (activeEp?.Id) endpointId = activeEp.Id
        }
      } catch {}

      // 2. Clean up any existing conflicting containers or broken stacks BEFORE deploying
      this.broadcast(
        serviceName,
        'initializing',
        `Limpando contêineres ou stacks anteriores de ${stackName} no Portainer...`
      )
      await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)

      // 3. Detect if Portainer shares the same Docker host as NOMAD (to bind-mount real ZIM/data folders)
      const endpointStorageRoot = await this.detectEndpointHostStorageRoot(
        client,
        endpointId,
        preinstall?.hostStorageRoot
      )

      if (!endpointStorageRoot) {
        await this.initNamedVolumeIfRemoteOnly(client, endpointId, serviceName)
      }

      // 4. Resolve internal port
      let internalPort = '8080'
      if (config?.HostConfig?.PortBindings) {
        const keys = Object.keys(config.HostConfig.PortBindings)
        if (keys.length > 0) {
          internalPort = keys[0].replace(/\/.*$/, '')
        }
      } else if (config?.ExposedPorts) {
        const keys = Object.keys(config.ExposedPorts)
        if (keys.length > 0) {
          internalPort = keys[0].replace(/\/.*$/, '')
        }
      }

      const envVars = [
        ...(config?.Env || []),
        ...extraEnv,
        'LANG=pt_BR.UTF-8',
        'LC_ALL=pt_BR.UTF-8',
        'TZ=America/Sao_Paulo',
      ]

      // 5. Pull Docker image on Portainer endpoint first so stack creation doesn't time out
      this.broadcast(
        serviceName,
        'pulling',
        `Baixando imagem ${service.container_image} no Portainer...`
      )
      await client
        .post(
          `/api/endpoints/${endpointId}/docker/images/create?fromImage=${encodeURIComponent(service.container_image)}`,
          null,
          { timeout: 300000 }
        )
        .catch(() => {})

      // 6. Build clean single-service Docker Compose configuration
      const composeContent = this.buildComposeFile(
        serviceName,
        service.container_image,
        hostPort,
        config,
        service.container_command,
        endpointStorageRoot,
        extraEnv
      )

      // 7. Create fresh stack in Portainer
      this.broadcast(
        serviceName,
        'creating',
        `Implantando Stack "${stackName}" no Portainer...`
      )

      let deployedViaStack = false
      try {
        logger.info(`[PortainerService] Creating standalone stack ${stackName}...`)
        await client.post(
          `/api/stacks/create/standalone/string?endpointId=${endpointId}`,
          {
            name: stackName,
            stackFileContent: composeContent,
            env: [],
          },
          { timeout: 120000 }
        )
        deployedViaStack = true
      } catch (stackErr: any) {
        logger.warn(
          `[PortainerService] Stacks API failed (${stackErr?.response?.data?.message || stackErr?.message}). Cleaning up partial stack and falling back to Docker Container API...`
        )
        await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)
      }

      // 8. Fallback: If Stacks API was unavailable, deploy container directly via Docker Engine Proxy
      if (!deployedViaStack) {
        this.broadcast(
          serviceName,
          'creating',
          `Implantando contêiner ${stackName} via Docker Engine do Portainer...`
        )

        const rawBinds: string[] = config?.HostConfig?.Binds || []
        const { binds: resolvedBinds, usesHostBinds } = this.rewriteBindsForHostStorage(
          rawBinds,
          endpointStorageRoot
        )

        const defaultBinds =
          resolvedBinds.length > 0
            ? resolvedBinds.map((b: string) => {
                if (!usesHostBinds && b.startsWith('/')) {
                  const parts = b.split(':')
                  const targetPath = parts[1] || '/data'
                  const mode = parts[2] ? `:${parts[2]}` : ''
                  return `nomad-${serviceName}-data:${targetPath}${mode}`
                }
                return b
              })
            : [`nomad-${serviceName}-data:/data`]

        const isKiwix = serviceName.toLowerCase().includes('kiwix')
        const cmdArray = isKiwix
          ? ['--library', '/data/kiwix-library.xml', '--monitorLibrary', '--address=all']
          : service.container_command
            ? service.container_command.trim().split(/\s+/)
            : undefined

        const containerPayload: any = {
          Image: service.container_image,
          name: stackName,
          Env: envVars,
          ...(config?.User ? { User: config.User } : {}),
          ...(cmdArray ? { Cmd: cmdArray } : {}),
          ExposedPorts: {
            [`${internalPort}/tcp`]: {},
          },
          HostConfig: {
            RestartPolicy: { Name: 'unless-stopped' },
            PortBindings: {
              [`${internalPort}/tcp`]: [{ HostPort: String(hostPort) }],
            },
            Binds: defaultBinds,
          },
        }

        const createResp = await client.post(
          `/api/endpoints/${endpointId}/docker/containers/create?name=${stackName}`,
          containerPayload,
          { timeout: 30000 }
        )
        const containerId = createResp.data?.Id

        if (containerId) {
          this.broadcast(serviceName, 'starting', `Iniciando contêiner no servidor Portainer...`)
          await client.post(
            `/api/endpoints/${endpointId}/docker/containers/${containerId}/start`,
            null,
            { timeout: 30000 }
          )
        }
      }

      // 9. Verification: Check that the main container is actually running
      this.broadcast(serviceName, 'starting', `Verificando saúde do serviço no Portainer...`)
      await new Promise((r) => setTimeout(r, 3500))

      const verifyResp = await client
        .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
        .catch(() => null)

      const runningCont = (verifyResp?.data || []).find(
        (c: any) =>
          !c.Names?.some((n: string) => n.endsWith('-init')) &&
          c.Names?.some(
            (n: string) =>
              n.toLowerCase() === `/${stackName.toLowerCase()}` ||
              n.toLowerCase() === `/${serviceName.toLowerCase()}` ||
              n.toLowerCase().includes(stackName.toLowerCase())
          )
      )

      if (!runningCont) {
        throw new Error(`O contêiner ${stackName} não foi encontrado após a implantação no Portainer.`)
      }

      if (runningCont.State !== 'running') {
        // Attempt to start it once if it was left in 'created' state
        await client
          .post(`/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/start`, null, {
            timeout: 15000,
          })
          .catch(() => {})
        await new Promise((r) => setTimeout(r, 2500))

        const recheckResp = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/json`, {
            timeout: 10000,
          })
          .catch(() => null)

        if (!recheckResp?.data?.State?.Running) {
          let logs = ''
          try {
            const logsResp = await client.get(
              `/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/logs?stderr=1&stdout=1&tail=20`,
              { timeout: 10000 }
            )
            logs = typeof logsResp?.data === 'string' ? logsResp.data : ''
          } catch {}
          await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)
          throw new Error(
            `Contêiner parou após iniciar. ${logs ? `Logs: ${logs.replace(/[^\x20-\x7E\n]/g, '').slice(0, 200)}` : ''}`
          )
        }
      }

      // 10. Mark as installed and linked to remote server
      await this.markAsDeployedRemotely(serviceName)
      service.installed = true
      service.installation_status = 'idle'
      service.custom_url = targetUrl
      await service.save()

      this.broadcast(
        serviceName,
        'completed',
        `Aplicação instalada e ativa no Servidor Portainer em ${targetUrl}!`
      )
    } catch (apiErr: any) {
      logger.error(`Portainer remote deploy failed for ${serviceName}: ${apiErr.message}`)
      await this.unmarkDeployedRemotely(serviceName)
      service.installed = false
      service.installation_status = 'error'
      await service.save()
      this.broadcast(serviceName, 'error', `Falha ao implantar no Portainer: ${apiErr.message}`)
    }
  }

  public async undeployService(
    serviceName: string,
    removeImage = false
  ): Promise<{ success: boolean; message: string }> {
    const service = await Service.query().where('service_name', serviceName).first()
    if (!service) {
      return { success: false, message: `Serviço ${serviceName} não encontrado` }
    }

    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()
    const stackName = `nomad-${serviceName}`

    if (apiKey) {
      try {
        await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)
        if (removeImage && service.container_image) {
          await client
            .delete(
              `/api/endpoints/${endpointId}/docker/images/${encodeURIComponent(service.container_image)}?force=true`,
              { timeout: 15000 }
            )
            .catch(() => {})
        }
      } catch (err: any) {
        logger.warn(`[PortainerService] Undeploy remote container error: ${err.message}`)
      }
    }

    await this.unmarkDeployedRemotely(serviceName)
    service.installed = false
    service.installation_status = 'idle'
    service.custom_url = null
    await service.save()

    this.broadcast(
      serviceName,
      'uninstalled',
      `Serviço ${service.friendly_name || serviceName} desinstalado do servidor remoto.`
    )
    return {
      success: true,
      message: `Serviço ${service.friendly_name || serviceName} desinstalado com sucesso.`,
    }
  }

  public async affectRemoteContainer(
    serviceName: string,
    action: 'start' | 'stop' | 'restart'
  ): Promise<{ success: boolean; message: string }> {
    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()
    const stackName = `nomad-${serviceName}`

    if (!apiKey) {
      return { success: true, message: `Ação ${action} simulada para ${serviceName}` }
    }

    try {
      // 1. Direct container action (works reliably for both Stack containers and standalone containers)
      const listResp = await client
        .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
        .catch(() => null)
      const existing = (listResp?.data || []).find(
        (c: any) =>
          !c.Names?.some((n: string) => n.endsWith('-init')) &&
          c.Names?.some(
            (n: string) =>
              n.toLowerCase() === `/${stackName.toLowerCase()}` ||
              n.toLowerCase() === `/${serviceName.toLowerCase()}` ||
              n.toLowerCase().includes(stackName.toLowerCase())
          )
      )
      if (existing?.Id) {
        await client.post(
          `/api/endpoints/${endpointId}/docker/containers/${existing.Id}/${action}`,
          null,
          { timeout: 30000 }
        )
        return {
          success: true,
          message: `Serviço ${serviceName} executou ${action} com sucesso no servidor Portainer.`,
        }
      }

      // 2. Fallback to stack action if stack exists
      const stacksResp = await client.get('/api/stacks', { timeout: 15000 }).catch(() => null)
      const existingStack = (stacksResp?.data || []).find(
        (s: any) => s.Name?.toLowerCase() === stackName.toLowerCase()
      )
      if (existingStack?.Id && (action === 'start' || action === 'stop')) {
        await client.post(
          `/api/stacks/${existingStack.Id}/${action}?endpointId=${endpointId}`,
          null,
          { timeout: 30000 }
        )
        return {
          success: true,
          message: `Stack ${stackName} executou ${action} com sucesso no Portainer.`,
        }
      }

      return {
        success: false,
        message: `Contêiner ${stackName} não encontrado no Portainer.`,
      }
    } catch (err: any) {
      return { success: false, message: `Falha ao executar ${action} no Portainer: ${err.message}` }
    }
  }

  /**
   * Update a remote Portainer service/stack to a target version or latest image tag.
   * Preserves all container volumes, configurations and data intact.
   */
  public async updateRemoteService(
    serviceName: string,
    targetVersion?: string
  ): Promise<{ success: boolean; message: string }> {
    const service = await Service.query().where('service_name', serviceName).first()
    if (!service) {
      return { success: false, message: `Serviço ${serviceName} não encontrado.` }
    }

    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()
    const stackName = `nomad-${serviceName}`

    if (!apiKey) {
      return { success: false, message: 'Chave de API do Portainer não configurada.' }
    }

    let newImage = service.container_image
    if (targetVersion) {
      const base = newImage.split(':')[0]
      newImage = `${base}:${targetVersion}`
    }

    this.broadcast(
      serviceName,
      'pulling',
      `Baixando nova versão (${newImage}) no servidor Portainer...`
    )

    try {
      // 1. Pull new image
      await client.post(
        `/api/endpoints/${endpointId}/docker/images/create?fromImage=${encodeURIComponent(newImage)}`,
        null,
        { timeout: 300000 }
      )

      let hostPort = service.ui_location
        ? service.ui_location.replace(/^https?:/, '').replace(/^.*?:/, '')
        : '8090'
      if (hostPort === '8080') {
        hostPort = PortainerService.PORT_REMAPS['8080'] || '8095'
      }

      let config: any = {}
      try {
        if (service.container_config) {
          config =
            typeof service.container_config === 'string'
              ? JSON.parse(service.container_config)
              : service.container_config
        }
      } catch {}

      const endpointStorageRoot = await this.detectEndpointHostStorageRoot(client, endpointId)

      // 2. Build updated compose definition
      const composeContent = this.buildComposeFile(
        serviceName,
        newImage,
        hostPort,
        config,
        service.container_command,
        endpointStorageRoot
      )

      // 3. Clean up old stack/containers and recreate stack in Portainer
      this.broadcast(serviceName, 'recreating', `Atualizando Stack ${stackName} no Portainer...`)
      await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)

      await client.post(
        `/api/stacks/create/standalone/string?endpointId=${endpointId}`,
        {
          name: stackName,
          stackFileContent: composeContent,
          env: [],
        },
        { timeout: 120000 }
      )

      // 4. Verify health
      await new Promise((r) => setTimeout(r, 4000))

      service.container_image = newImage
      service.available_update_version = null
      service.installation_status = 'idle'
      await service.save()

      this.broadcast(
        serviceName,
        'completed',
        `Serviço ${service.friendly_name || serviceName} atualizado com sucesso no Portainer!`
      )

      return {
        success: true,
        message: `Serviço ${service.friendly_name || serviceName} atualizado para ${newImage} com sucesso.`,
      }
    } catch (err: any) {
      logger.error(`Update error for remote service ${serviceName}: ${err.message}`)
      this.broadcast(serviceName, 'error', `Falha ao atualizar no Portainer: ${err.message}`)
      return { success: false, message: `Falha ao atualizar no Portainer: ${err.message}` }
    }
  }
}
