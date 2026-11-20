import https from 'node:https'
import os from 'node:os'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import axios, { type AxiosInstance } from 'axios'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import transmit from '@adonisjs/transmit/services/main'
import KVStore from '#models/kv_store'
import Service from '#models/service'
import type { ServiceSlim } from '../../types/services.js'
import { BROADCAST_CHANNELS } from '../../constants/broadcast.js'
import {
  containerMatchesCatalogService,
  isNomadManagedContainer,
} from '../utils/container_matcher.js'
import {
  clearInstallProgress,
  setInstallProgress,
  translateDockerDeployErrorPtBr,
} from '../utils/install_progress_tracker.js'
import {
  getStackBlueprint,
  hasMultiServiceSidecars,
  getStarterConfigFile,
} from '../utils/app_stack_blueprints.js'

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
    const url = await this.getBaseUrl()
    const apiKey = await this.getApiKey()
    if (url && apiKey) return true
    const kvVal = await KVStore.getValue('portainer.enabled')
    if (kvVal !== null) return Boolean(kvVal)
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
    let endpointId = await this.getEndpointId()

    // Ensure active endpointId is resolved dynamically
    if (apiKey) {
      try {
        const epResp = await client.get('/api/endpoints', { timeout: 6000 }).catch(() => null)
        const endpoints: any[] = Array.isArray(epResp?.data)
          ? epResp.data
          : Array.isArray(epResp?.data?.values)
            ? epResp.data.values
            : []
        if (endpoints.length > 0 && !endpoints.some((e) => Number(e.Id) === endpointId)) {
          const activeEp = endpoints.find((e: any) => e.Type === 1 || e.Type === 2) || endpoints[0]
          if (activeEp?.Id) endpointId = Number(activeEp.Id)
        }
      } catch {}
    }

    // 1. Fetch live stacks and containers from Portainer FIRST if API Key is available
    let liveStacks: Array<{ Id: number; Name: string; Status?: number; EndpointId?: number }> = []
    let liveContainers: Array<{
      fullId: string
      id: string
      name: string
      image: string
      projectName: string
      composeService: string
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
            const composeProject = c.Labels?.['com.docker.compose.project'] || ''
            const composeService = c.Labels?.['com.docker.compose.service'] || ''
            const projectName = composeProject || cleanName.split('-')[0] || cleanName
            const publicPort = (c.Ports || []).find((p: any) => p.PublicPort)?.PublicPort
            return {
              fullId: c.Id || '',
              id: c.Id ? c.Id.slice(0, 12) : '',
              name: cleanName,
              image: c.Image || '',
              projectName: projectName.toLowerCase(),
              composeService: composeService.toLowerCase(),
              state: c.State || 'unknown',
              publicPort,
            }
          })
        }
      } catch (err: any) {
        logger.debug(`[PortainerService] Dynamic stack discovery: ${err?.message}`)
      }
    }

    // NOTE: syncWithDellInventory is called by read-only GET /api/system/services (including polling).
    // It MUST NEVER delete Portainer stacks or containers, because deleting a stack mid-deploy causes
    // Portainer to run `docker compose down` -> SIGTERM -> SIGKILL (exited - code 137) on booting apps!

    // 2. Reconcile & Enrich catalog services deployed to or already running on Portainer
    const deployedSet = new Set(deployedServices)
    const matchedByService = new Map<string, (typeof liveContainers)[number]>()

    if (portainerReachable) {
      for (const svc of services) {
        const found = liveContainers.find((c) => containerMatchesCatalogService(svc, c))
        if (found) {
          matchedByService.set(svc.service_name, found)
          if (!deployedSet.has(svc.service_name)) {
            deployedSet.add(svc.service_name)
            await this.markAsDeployedRemotely(svc.service_name)
          }
        }
      }
    }

    for (const deployedName of Array.from(deployedSet)) {
      const index = services.findIndex((s) => s.service_name === deployedName)
      const targetSvc = services.find((s) => s.service_name === deployedName)
      const matchedCont =
        matchedByService.get(deployedName) ||
        (targetSvc
          ? liveContainers.find((c) => containerMatchesCatalogService(targetSvc, c))
          : liveContainers.find((c) =>
              containerMatchesCatalogService({ service_name: deployedName }, c)
            ))

      // If Portainer is reachable and the container no longer exists (e.g. removed by user or failed deploy),
      // automatically unmark it so NOMAD shows "Instalar" instead of a phantom "Ativo" card!
      if (portainerReachable && !matchedCont) {
        const isCurrentlyInstalling =
          PortainerService.activeDeploys.has(deployedName) ||
          (index !== -1 && services[index].installation_status === 'installing')
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
        const defaultPort = this.resolveNumericPort(item.ui_location, undefined, item.service_name)
        const resolvedPort = matchedCont?.publicPort ? String(matchedCont.publicPort) : defaultPort
        const remoteUrl =
          item.service_name === 'nomad_ollama' ? '/chat' : `${scheme}://${hostIp}:${resolvedPort}`
        const realStatus = matchedCont
          ? matchedCont.state === 'running'
            ? 'running'
            : 'stopped'
          : 'running'
        const isExternal = matchedCont
          ? !isNomadManagedContainer(matchedCont.name, matchedCont.projectName)
          : false

        services[index] = {
          ...item,
          installed: true,
          status: realStatus,
          node: 'portainer',
          node_label: isExternal ? 'Portainer (Vinculado)' : 'Servidor Portainer',
          ui_location: remoteUrl,
          custom_url: item.custom_url || remoteUrl,
        }
      }
    }

    // Track which live containers are already linked to catalog apps so we never show duplicates
    const claimedContainerIds = new Set<string>()
    for (const svc of services) {
      if (svc.installed) {
        const match = matchedByService.get(svc.service_name)
        if (match?.fullId) claimedContainerIds.add(match.fullId)
      }
    }

    // 3. Inject Known Remote Services ONLY if their container ACTUALLY exists on Portainer and wasn't already linked to catalog
    const existingServiceNames = new Set(services.map((s) => s.service_name.toLowerCase()))
    let nextId = 9000

    for (const remoteApp of remoteKnown) {
      const barePattern = remoteApp.service_name.replace(/-nexus$/, '').replace(/-remote$/, '')
      if (
        existingServiceNames.has(remoteApp.service_name.toLowerCase()) ||
        existingServiceNames.has(`nomad_${barePattern}`) ||
        services.some((s) => s.installed && s.service_name.toLowerCase().includes(barePattern))
      ) {
        continue
      }

      const matched = liveContainers.find(
        (c) =>
          !claimedContainerIds.has(c.fullId) &&
          containerMatchesCatalogService({ service_name: barePattern }, c)
      )
      if (!matched) continue

      claimedContainerIds.add(matched.fullId)
      const resolvedPort = matched.publicPort || remoteApp.port
      const isRunning = matched.state === 'running'
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
        container_image: matched.image || 'remote-container',
        available_update_version: null,
        auto_update_enabled: false,
        is_custom: false,
        is_user_modified: false,
        is_deprecated: false,
        is_link_tile: true,
        link_color: '#10b981',
        category: remoteApp.category,
        node: 'portainer',
        node_label: 'Portainer (Vinculado)',
        is_unmanaged: true,
      })
      existingServiceNames.add(remoteApp.service_name.toLowerCase())
    }

    // 4. Dynamic Discovery: Add any OTHER standalone containers/stacks running on Portainer not yet in catalog
    for (const stack of liveStacks) {
      const rawStackName = stack.Name || ''
      const lowerStackName = rawStackName.toLowerCase()

      const stackContainers = liveContainers.filter(
        (c) =>
          !c.name.endsWith('-init') &&
          (c.projectName === lowerStackName || c.name.toLowerCase().includes(lowerStackName))
      )
      const allClaimed =
        stackContainers.length > 0 && stackContainers.every((c) => claimedContainerIds.has(c.fullId))

      const alreadyHandled =
        allClaimed ||
        lowerStackName.startsWith('nomad-') ||
        lowerStackName.startsWith('nomad_') ||
        existingServiceNames.has(lowerStackName) ||
        existingServiceNames.has(`${lowerStackName}-nexus`) ||
        existingServiceNames.has(`nomad-${lowerStackName}`) ||
        existingServiceNames.has(`nomad_${lowerStackName}`)

      if (alreadyHandled) {
        continue
      }

      const isRunning =
        stackContainers.length > 0
          ? stackContainers.some((c) => c.state === 'running')
          : stack.Status === 1
      const publicPort = stackContainers.find((c) => c.publicPort)?.publicPort

      const launchUrl = publicPort
        ? `http://${hostIp}:${publicPort}`
        : `https://${hostIp}:9443`

      const friendlyTitle = this.formatStackTitle(rawStackName)
      for (const c of stackContainers) {
        if (c.fullId) claimedContainerIds.add(c.fullId)
      }

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

  private pendingGpuServices = new Set<string>()

  /**
   * Resolves a valid numeric host port from ui_location (ignoring internal routes like '/chat')
   * or from container_config bindings/exposed ports, applying reserved port remaps.
   */
  private resolveNumericPort(
    uiLocation?: string | null,
    containerConfig?: any,
    serviceName?: string
  ): string {
    let port = ''
    const loc = (uiLocation || '').trim()
    if (/^\d+$/.test(loc)) {
      port = loc
    } else {
      const explicitMatch = loc.match(/^(?:https?:)?(?:\/\/[^/:]+)?[:](\d+)$/i)
      if (explicitMatch?.[1]) {
        port = explicitMatch[1]
      }
    }

    if (!port && containerConfig) {
      const bindings = containerConfig?.HostConfig?.PortBindings
      if (bindings && typeof bindings === 'object') {
        for (const entries of Object.values(bindings)) {
          if (Array.isArray(entries) && entries[0] && (entries[0] as any).HostPort) {
            const candidate = String((entries[0] as any).HostPort).trim()
            if (/^\d+$/.test(candidate)) {
              port = candidate
              break
            }
          }
        }
      }
      if (!port && containerConfig?.ExposedPorts && typeof containerConfig.ExposedPorts === 'object') {
        const firstKey = Object.keys(containerConfig.ExposedPorts)[0]
        const exposedMatch = firstKey?.match(/^(\d+)/)
        if (exposedMatch?.[1]) {
          port = exposedMatch[1]
        }
      }
    }

    if (!port && serviceName === 'nomad_ollama') {
      port = '11434'
    }
    if (!port || !/^\d+$/.test(port)) {
      port = '8090'
    }

    if (port === '8080') {
      return PortainerService.PORT_REMAPS['8080'] || '8095'
    }
    return port
  }

  /**
   * Detects whether the remote Portainer Docker endpoint has GPU container runtime support.
   */
  private async endpointSupportsGpuRuntime(
    client: AxiosInstance,
    endpointId: number
  ): Promise<boolean> {
    try {
      const res = await client.get(`/api/endpoints/${endpointId}/docker/info`, { timeout: 10000 })
      const runtimes = res.data?.Runtimes
      if (runtimes && typeof runtimes === 'object') {
        return Object.keys(runtimes).some((key) => key.toLowerCase().includes('nvidia'))
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Lists container mount points (including CIFS/NFS/host binds) on the active Portainer endpoint.
   */
  public async getContainerStorageMounts(): Promise<
    Array<{
      containerName: string
      image: string
      state: string
      source: string
      destination: string
      type: string
      networkDevice?: string
      driver?: string
    }>
  > {
    try {
      if (!(await this.isEnabled())) return []
      const { client, baseUrl, apiKey } = await this.getClient()
      if (!baseUrl || !apiKey) return []

      let endpointId = await this.getEndpointId()
      const epResp = await client.get('/api/endpoints', { timeout: 4000 }).catch(() => null)
      const eps: any[] = Array.isArray(epResp?.data)
        ? epResp.data
        : Array.isArray(epResp?.data?.values)
          ? epResp.data.values
          : []
      if (eps.length > 0 && !eps.some((e) => Number(e.Id) === endpointId)) {
        endpointId = Number(eps[0].Id) || endpointId
      }

      const [containersResp, volumesResp] = await Promise.all([
        client
          .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 5000 })
          .catch(() => null),
        client
          .get(`/api/endpoints/${endpointId}/docker/volumes`, { timeout: 5000 })
          .catch(() => null),
      ])

      const volumeMap = new Map<string, { driver: string; device?: string }>()
      const vols: any[] = Array.isArray(volumesResp?.data?.Volumes) ? volumesResp.data.Volumes : []
      for (const v of vols) {
        if (v?.Name) {
          volumeMap.set(v.Name, {
            driver: v.Driver || 'local',
            device: v.Options?.device ? String(v.Options.device) : undefined,
          })
        }
      }

      const containers: any[] = Array.isArray(containersResp?.data) ? containersResp.data : []
      const out: Array<{
        containerName: string
        image: string
        state: string
        source: string
        destination: string
        type: string
        networkDevice?: string
        driver?: string
      }> = []

      for (const c of containers) {
        const name = (Array.isArray(c.Names) && c.Names[0] ? String(c.Names[0]) : c.Id || '')
          .replace(/^\//, '')
          .trim()
        const mounts: any[] = Array.isArray(c.Mounts) ? c.Mounts : []
        for (const m of mounts) {
          const dest = String(m?.Destination || '')
          const src = String(m?.Source || '')
          if (!dest || dest === '/var/run/docker.sock' || src.startsWith('/var/run/')) continue
          const volMeta = m?.Name ? volumeMap.get(String(m.Name)) : undefined
          out.push({
            containerName: name,
            image: String(c.Image || ''),
            state: String(c.State || ''),
            source: src || String(m?.Name || ''),
            destination: dest,
            type: String(m?.Type || 'bind'),
            networkDevice: volMeta?.device,
            driver: m?.Driver || volMeta?.driver,
          })
        }
      }

      return out
    } catch {
      return []
    }
  }

  /**
   * Broadcast an installation event to the frontend via SSE
   */
  private broadcast(serviceName: string, event: string, message: string) {
    setInstallProgress(serviceName, event, message)
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
    extraEnv: string[] = [],
    hostIp = '127.0.0.1'
  ): string {
    const isKiwix = serviceName.toLowerCase().includes('kiwix')
    const bp = getStackBlueprint(serviceName)

    // 1. Build Ports List accurately (preserving protocol /udp vs /tcp and matching primary UI port)
    const portsList: string[] = []
    const portBindings = config?.HostConfig?.PortBindings || {}
    const exposedPorts = Object.keys(config?.ExposedPorts || {})
    const boundKeys = new Set<string>()

    let primaryBindingKey = ''
    const bindingEntries = Object.entries(portBindings)
    if (bindingEntries.length > 0) {
      const exactMatch = bindingEntries.find(
        ([, arr]) => String((arr as any)?.[0]?.HostPort || '') === String(primaryHostPort)
      )
      const tcpMatch = bindingEntries.find(([k]) => !k.endsWith('/udp'))
      primaryBindingKey = (exactMatch || tcpMatch || bindingEntries[0])[0]
    } else if (exposedPorts.length > 0) {
      primaryBindingKey = exposedPorts.find((k) => !k.endsWith('/udp')) || exposedPorts[0]
    } else {
      primaryBindingKey = '8080/tcp'
    }

    const formatPortEntry = (hostP: string, bindingKey: string): string => {
      const [intNum, protoRaw] = bindingKey.split('/')
      const proto = protoRaw === 'udp' ? '/udp' : ''
      return `"${hostP}:${intNum}${proto}"`
    }

    if (!bp?.proxyOwnsHostPort) {
      const pProtoKey = primaryBindingKey.includes('/') ? primaryBindingKey : `${primaryBindingKey}/tcp`
      portsList.push(formatPortEntry(primaryHostPort, pProtoKey))
      boundKeys.add(pProtoKey)
    }

    for (const [bindingKey, bindingArr] of bindingEntries) {
      const pProtoKey = bindingKey.includes('/') ? bindingKey : `${bindingKey}/tcp`
      if (!boundKeys.has(pProtoKey)) {
        const hostP = String((bindingArr as any)?.[0]?.HostPort || pProtoKey.split('/')[0])
        portsList.push(formatPortEntry(hostP, pProtoKey))
        boundKeys.add(pProtoKey)
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
        const isSystemSocket = bind.startsWith('/var/run/docker.sock')
        if ((usesHostBinds && bind.startsWith('/')) || isSystemSocket) {
          volumeMounts.push(`- ${bind}`)
        } else {
          const parts = bind.split(':')
          const rawTargetPath = parts[1] || '/data'
          // Convert single nginx file bind (`/etc/nginx/conf.d/default.conf`) to its parent directory when using named Docker volumes
          const targetPath =
            rawTargetPath === '/etc/nginx/conf.d/default.conf'
              ? '/etc/nginx/conf.d'
              : rawTargetPath
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

    if (bp?.extraAppVolumes) {
      for (const volSpec of bp.extraAppVolumes(serviceName)) {
        volumeMounts.push(`- ${volSpec}`)
      }
    }

    // 3. Environment Variables (deduplicated by key, avoiding LC_ALL=pt_BR.UTF-8 locale warnings)
    const blueprintEnv = bp ? bp.extraEnv(hostIp, primaryHostPort) : []
    const rawEnvVars = [
      ...(config?.Env || []),
      ...blueprintEnv,
      ...extraEnv,
      'TZ=America/Sao_Paulo',
    ]
    const envMap = new Map<string, string>()
    for (const item of rawEnvVars) {
      const idx = item.indexOf('=')
      if (idx > 0) {
        envMap.set(item.slice(0, idx), item)
      }
    }
    const envVars = Array.from(envMap.values())

    const portsSection =
      portsList.length > 0
        ? `    ports:\n${portsList.map((p) => `      - ${p}`).join('\n')}\n`
        : ''
    const volumesBlock = volumeMounts.map((v) => `      ${v}`).join('\n')
    const envBlock = envVars.map((e) => `      - ${JSON.stringify(e)}`).join('\n')
    const userLine = config?.User ? `    user: "${config.User}"\n` : ''
    const shmLine = bp?.shmSize ? `    shm_size: "${bp.shmSize}"\n` : ''
    const entrypointLine = bp?.composeEntrypointOverride
      ? `    entrypoint: ${JSON.stringify(bp.composeEntrypointOverride)}\n`
      : ''
    const dependsOnLine = bp?.dependsOnYaml || ''

    let cmdBlock = ''
    if (isKiwix) {
      cmdBlock = `    command: ["--library", "/data/kiwix-library.xml", "--monitorLibrary", "--address=all"]\n`
    } else if (cmd && cmd.trim()) {
      const parts = cmd.trim().split(/\s+/).map((s) => JSON.stringify(s))
      cmdBlock = `    command: [${parts.join(', ')}]\n`
    }

    const lowerSvcName = serviceName.toLowerCase()
    const requiresPreSeededVolume =
      lowerSvcName.includes('kiwix') ||
      lowerSvcName.includes('calibre') ||
      lowerSvcName.includes('vaultwarden') ||
      lowerSvcName.includes('meshcore') ||
      Boolean(getStarterConfigFile(serviceName, hostIp, primaryHostPort))

    const allVolumeDefs: string[] = Array.from(declaredNamedVolumes).map((v) =>
      requiresPreSeededVolume ? `  ${v}:\n    external: true` : `  ${v}:\n    name: ${v}`
    )
    if (bp) {
      for (const sv of bp.sidecarVolumeNames(serviceName)) {
        allVolumeDefs.push(`  ${sv}:\n    name: ${sv}`)
      }
    }

    const topLevelVolumesBlock =
      allVolumeDefs.length > 0 ? `\nvolumes:\n${allVolumeDefs.join('\n')}\n` : ''

    const sidecarsBlock = bp ? bp.sidecarServicesYaml(serviceName, hostIp, primaryHostPort) : ''
    const sidecarsSection = sidecarsBlock ? `\n${sidecarsBlock}\n` : ''

    const gpuBlock = this.pendingGpuServices.has(serviceName)
      ? `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
`
      : ''

    return `services:
  ${serviceName}:
    image: ${image}
    container_name: nomad-${serviceName}
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
${gpuBlock}${userLine}${shmLine}${entrypointLine}${dependsOnLine}${portsSection}    volumes:
${volumesBlock}
    environment:
${envBlock}
${cmdBlock}${sidecarsSection}${topLevelVolumesBlock}`
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
      const selfHostname = os.hostname()

      // Match by container ID (os.hostname inside Docker), known admin name, or any container mounting /app/storage
      const adminCont =
        containers.find((c: any) => selfHostname && c.Id?.startsWith(selfHostname)) ||
        containers.find((c: any) =>
          c.Names?.some(
            (n: string) =>
              n === '/nomad_admin' ||
              n.includes('nomad_admin') ||
              n.includes('nomad-admin')
          )
        )

      if (adminCont) {
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
      }

      return null
    } catch {
      return null
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
    stackName: string,
    hostPort?: string
  ): Promise<void> {
    const lowerStack = stackName.toLowerCase()
    const lowerService = serviceName.toLowerCase()
    const altStack = `nomad-${lowerService.replace(/^nomad[-_]/, '')}`
    const candidateEpIds = await this.resolveCandidateEndpointIds(client, endpointId)
    const numericHostPort = hostPort ? Number(hostPort) : 0

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
          const cState = String(c.State || '').toLowerCase()
          const isStopped = cState === 'exited' || cState === 'dead' || cState === 'created'
          const holdsTargetPort =
            numericHostPort > 0 &&
            (c.Ports || []).some((p: any) => Number(p?.PublicPort) === numericHostPort)

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
            comSvc === lowerStack ||
            (isStopped && holdsTargetPort)

          if (isMatch && c.Id) {
            logger.info(
              `[PortainerService] Removing container ${cNames.join(',')} (${c.Id.slice(0, 12)}) on endpoint ${epId}...`
            )
            await client
              .post(`/api/endpoints/${epId}/docker/containers/${c.Id}/stop?t=2`, null, { timeout: 15000 })
              .catch(() => {})
            await client
              .delete(`/api/endpoints/${epId}/docker/containers/${c.Id}?force=true&v=true`, {
                timeout: 20000,
              })
              .catch(() => {})
          }
        }
      }
    }

    const deleteOrphanNetworks = async () => {
      const targetNets = new Set([`${lowerStack}_default`, `${altStack}_default`, `${lowerService}_default`])
      for (const epId of candidateEpIds) {
        const netResp = await client
          .get(`/api/endpoints/${epId}/docker/networks`, { timeout: 8000 })
          .catch(() => null)
        const networks: any[] = Array.isArray(netResp?.data) ? netResp.data : []
        for (const n of networks) {
          const nName = String(n?.Name || '').toLowerCase()
          if (targetNets.has(nName) && n?.Id) {
            await client
              .delete(`/api/endpoints/${epId}/docker/networks/${n.Id}`, { timeout: 8000 })
              .catch(() => {})
          }
        }
      }
    }

    try {
      // 1. Delete stacks first
      await deleteMatchingStacks()
      await new Promise((r) => setTimeout(r, 600))
      // 2. Force-remove any remaining containers (including stopped containers holding target port)
      await deleteMatchingContainers()
      await new Promise((r) => setTimeout(r, 400))
      // 3. Second pass on stacks and clean up orphan Compose networks
      await deleteMatchingStacks()
      await deleteOrphanNetworks()
    } catch (err: any) {
      logger.warn(`[PortainerService] Cleanup warning for ${serviceName}: ${err?.message}`)
    }
  }

  /**
   * Build a minimal POSIX ustar tar archive in memory for a single file,
   * used to upload bundled assets (e.g. ZIM sample, Calibre metadata.db)
   * directly into a remote Portainer container volume via Docker Archive API.
   */
  private buildSingleFileTar(filename: string, content: Buffer): Buffer {
    const header = Buffer.alloc(512, 0)
    const nameBuf = Buffer.from(filename, 'utf8')
    nameBuf.copy(header, 0, 0, Math.min(nameBuf.length, 100))
    header.write('0000644\0', 100, 8, 'ascii')
    header.write('0000000\0', 108, 8, 'ascii')
    header.write('0000000\0', 116, 8, 'ascii')
    header.write(content.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii')
    header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0', 136, 12, 'ascii')
    header.fill(0x20, 148, 156) // checksum field as spaces
    header.write('0', 156, 1, 'ascii') // regular file
    header.write('ustar\0', 257, 6, 'ascii')
    header.write('00', 263, 2, 'ascii')

    let chksum = 0
    for (let i = 0; i < 512; i++) chksum += header[i]
    header.write(chksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii')

    const padLen = (512 - (content.length % 512)) % 512
    return Buffer.concat([header, content, Buffer.alloc(padLen, 0), Buffer.alloc(1024, 0)])
  }

  /**
   * Ensure all named volumes required by `serviceName` exist on the remote Docker endpoint
   * (so `external: true` in Compose never fails), and seed initial data/configs for apps
   * that crash if their volume starts empty (Kiwix, Calibre-Web, Vaultwarden, MeshCore).
   */
  private async initNamedVolumeIfRemoteOnly(
    client: AxiosInstance,
    endpointId: number,
    serviceName: string,
    config: any,
    serviceImage: string,
    hostIp = '127.0.0.1',
    hostPort = '8080'
  ): Promise<void> {
    const rawBinds: string[] = config?.HostConfig?.Binds || []
    const volumeDefs: Array<{ volName: string; targetPath: string }> = []

    if (rawBinds.length > 0) {
      for (const bind of rawBinds) {
        const parts = bind.split(':')
        const rawTargetPath = parts[1] || '/data'
        const targetPath =
          rawTargetPath === '/etc/nginx/conf.d/default.conf'
            ? '/etc/nginx/conf.d'
            : rawTargetPath
        const cleanName =
          targetPath
            .replace(/^\//, '')
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .toLowerCase() || 'data'
        volumeDefs.push({ volName: `nomad-${serviceName}-${cleanName}`, targetPath })
      }
    } else {
      volumeDefs.push({ volName: `nomad-${serviceName}-data`, targetPath: '/data' })
    }

    // 1. Explicitly create every named volume on the Portainer Docker endpoint
    for (const v of volumeDefs) {
      await client
        .post(`/api/endpoints/${endpointId}/docker/volumes/create`, { Name: v.volName }, { timeout: 10000 })
        .catch(() => {})
    }

    const lowerName = serviceName.toLowerCase()
    const isKiwix = lowerName.includes('kiwix')
    const isCalibre = lowerName.includes('calibre')
    const isVaultwarden = lowerName.includes('vaultwarden')
    const isMeshcore = lowerName.includes('meshcore')
    const starterCfg = getStarterConfigFile(serviceName, hostIp, hostPort)

    if (!isKiwix && !isCalibre && !isVaultwarden && !isMeshcore && !starterCfg) return

    const primaryVol = volumeDefs[0]?.volName || `nomad-${serviceName}-data`
    const primaryTarget = volumeDefs[0]?.targetPath || '/data'
    const initContName = `nomad-tmp-init-${Date.now()}`

    if (starterCfg && !isKiwix && !isCalibre && !isVaultwarden && !isMeshcore) {
      try {
        await client
          .post(`/api/endpoints/${endpointId}/docker/images/create?fromImage=alpine%3Alatest`, null, {
            timeout: 60000,
          })
          .catch(() => {})
        const b64 = Buffer.from(starterCfg.content, 'utf8').toString('base64')
        const targetFile = `${starterCfg.volumeTargetDir}/${starterCfg.filename}`
        const cmd = `mkdir -p "${starterCfg.volumeTargetDir}" && [ -s "${targetFile}" ] || echo '${b64}' | base64 -d > "${targetFile}"; chmod 666 "${targetFile}" 2>/dev/null || true`
        const cResp = await client.post(
          `/api/endpoints/${endpointId}/docker/containers/create?name=${initContName}`,
          {
            Image: 'alpine:latest',
            Cmd: ['sh', '-c', cmd],
            HostConfig: { Binds: [`${primaryVol}:${starterCfg.volumeTargetDir}`] },
          },
          { timeout: 15000 }
        )
        if (cResp.data?.Id) {
          await client.post(`/api/endpoints/${endpointId}/docker/containers/${cResp.data.Id}/start`, null, { timeout: 15000 })
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 800))
            const insp = await client.get(`/api/endpoints/${endpointId}/docker/containers/${cResp.data.Id}/json`, { timeout: 8000 }).catch(() => null)
            if (insp?.data?.State?.Running === false) break
          }
          await client.delete(`/api/endpoints/${endpointId}/docker/containers/${cResp.data.Id}?force=true`, { timeout: 10000 }).catch(() => {})
        }
      } catch (cfgErr: any) {
        logger.debug(`[PortainerService] Starter config init skipped for ${serviceName}: ${cfgErr?.message}`)
      }
      return
    }

    try {
      if (isKiwix) {
        // Use the Kiwix image itself (already pulled) so `kiwix-manage` is available!
        const initScript =
          'if ! ls /data/*.zim >/dev/null 2>&1; then wget -q -O /data/wikipedia_en_100_mini_2026-01.zim "https://github.com/Crosstalk-Solutions/project-nomad/raw/refs/heads/main/install/wikipedia_en_100_mini_2026-01.zim" || true; fi; ' +
          'if ls /data/*.zim >/dev/null 2>&1; then rm -f /data/kiwix-library.xml && kiwix-manage /data/kiwix-library.xml add /data/*.zim; fi; ' +
          'if [ ! -s /data/kiwix-library.xml ]; then echo \'<?xml version="1.0" encoding="UTF-8"?><library version="20110515"/>\' > /data/kiwix-library.xml; fi'

        const createResp = await client.post(
          `/api/endpoints/${endpointId}/docker/containers/create?name=${initContName}`,
          {
            Image: serviceImage,
            Entrypoint: ['sh', '-c'],
            Cmd: [initScript],
            HostConfig: {
              Binds: [`${primaryVol}:/data`],
            },
          },
          { timeout: 15000 }
        )
        const cid = createResp.data?.Id
        if (cid) {
          // Upload bundled ZIM directly into /data before starting so it works even 100% offline
          try {
            const zimFilename = 'wikipedia_en_100_mini_2026-01.zim'
            const localAsset = join(process.cwd(), 'assets/kiwix', zimFilename)
            const localStorage = join(process.cwd(), 'storage/zim', zimFilename)
            let zimBuf: Buffer | null = null
            try {
              zimBuf = await readFile(localStorage)
            } catch {
              try {
                zimBuf = await readFile(localAsset)
              } catch {}
            }
            if (zimBuf) {
              const tarBuf = this.buildSingleFileTar(zimFilename, zimBuf)
              await client.put(
                `/api/endpoints/${endpointId}/docker/containers/${cid}/archive?path=/data`,
                tarBuf,
                { headers: { 'Content-Type': 'application/x-tar' }, timeout: 60000 }
              )
            }
          } catch (uploadErr: any) {
            logger.debug(`[PortainerService] ZIM archive upload skipped: ${uploadErr?.message}`)
          }

          await client.post(`/api/endpoints/${endpointId}/docker/containers/${cid}/start`, null, {
            timeout: 15000,
          })
          // Wait up to 45s for kiwix-manage to finish
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 1500))
            const insp = await client
              .get(`/api/endpoints/${endpointId}/docker/containers/${cid}/json`, { timeout: 8000 })
              .catch(() => null)
            if (insp?.data?.State?.Running === false) break
          }
          await client
            .delete(`/api/endpoints/${endpointId}/docker/containers/${cid}?force=true`, { timeout: 10000 })
            .catch(() => {})
        }
        return
      }

      // Alpine-based init for Calibre-Web / Vaultwarden / MeshCore
      await client
        .post(`/api/endpoints/${endpointId}/docker/images/create?fromImage=alpine%3Alatest`, null, {
          timeout: 60000,
        })
        .catch(() => {})

      const booksVol = volumeDefs.find((v) => v.targetPath === '/books')?.volName || primaryVol
      const certsVol = volumeDefs.find((v) => v.targetPath === '/certs')?.volName || primaryVol
      const nginxConfVol = volumeDefs.find((v) => v.targetPath === '/etc/nginx/conf.d')?.volName

      const mountBinds: string[] = isCalibre
        ? [`${booksVol}:/books`]
        : isMeshcore && nginxConfVol
          ? [`${certsVol}:/certs`, `${nginxConfVol}:/etc/nginx/conf.d`]
          : [`${primaryVol}:${primaryTarget}`]

      const certDirTarget = isMeshcore ? '/certs' : primaryTarget
      const meshcoreNginxCmd =
        isMeshcore && nginxConfVol
          ? `; printf 'server {\\n    listen 443 ssl;\\n    server_name _;\\n    ssl_certificate     /certs/cert.pem;\\n    ssl_certificate_key /certs/key.pem;\\n    root /usr/share/nginx/html;\\n    index index.html;\\n    location / {\\n        try_files $uri $uri/ /index.html;\\n    }\\n}\\n' > /etc/nginx/conf.d/default.conf; chmod 644 /etc/nginx/conf.d/default.conf`
          : ''

      const shellCmd = isCalibre
        ? 'chown -R 1000:1000 /books && chmod -R u+rwX /books'
        : `apk add --no-cache openssl >/dev/null 2>&1; if [ ! -f ${certDirTarget}/cert.pem ] || [ ! -f ${certDirTarget}/key.pem ]; then openssl req -x509 -newkey rsa:2048 -nodes -keyout ${certDirTarget}/key.pem -out ${certDirTarget}/cert.pem -days 3650 -subj '/CN=${lowerName}'; chmod 644 ${certDirTarget}/cert.pem ${certDirTarget}/key.pem; fi${meshcoreNginxCmd}`

      const createResp = await client.post(
        `/api/endpoints/${endpointId}/docker/containers/create?name=${initContName}`,
        {
          Image: 'alpine:latest',
          Cmd: ['sh', '-c', shellCmd],
          HostConfig: {
            Binds: mountBinds,
          },
        },
        { timeout: 15000 }
      )
      const cid = createResp.data?.Id
      if (cid) {
        if (isCalibre) {
          try {
            const dbBuf = await readFile(join(process.cwd(), 'assets/calibre/metadata.db'))
            const tarBuf = this.buildSingleFileTar('metadata.db', dbBuf)
            await client.put(
              `/api/endpoints/${endpointId}/docker/containers/${cid}/archive?path=/books`,
              tarBuf,
              { headers: { 'Content-Type': 'application/x-tar' }, timeout: 30000 }
            )
          } catch {}
        }

        await client.post(`/api/endpoints/${endpointId}/docker/containers/${cid}/start`, null, {
          timeout: 15000,
        })
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 1500))
          const insp = await client
            .get(`/api/endpoints/${endpointId}/docker/containers/${cid}/json`, { timeout: 8000 })
            .catch(() => null)
          if (insp?.data?.State?.Running === false) break
        }
        await client
          .delete(`/api/endpoints/${endpointId}/docker/containers/${cid}?force=true`, { timeout: 10000 })
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

    // Determine target host port, avoiding port 8080 and internal UI routes (e.g. '/chat')
    let parsedContainerCfg: any = null
    try {
      parsedContainerCfg = service.container_config ? JSON.parse(service.container_config) : null
    } catch {
      parsedContainerCfg = null
    }
    const hostPort = this.resolveNumericPort(service.ui_location, parsedContainerCfg, serviceName)
    if (service.ui_location === '8080') {
      logger.info(`[PortainerService] Port 8080 is reserved. Remapped ${serviceName} to ${hostPort}.`)
    }

    clearInstallProgress(serviceName)
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

  private static deployQueue: Promise<void> = Promise.resolve()
  private static activeDeploys = new Set<string>()

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
    PortainerService.activeDeploys.add(service.service_name)
    const run = async () => {
      try {
        await this._runRemoteDeployInternal(
          service,
          config,
          hostPort,
          hostIp,
          client,
          _apiKey,
          endpointId,
          preinstall
        )
      } finally {
        PortainerService.activeDeploys.delete(service.service_name)
      }
    }
    const chained = PortainerService.deployQueue.then(run, run)
    PortainerService.deployQueue = chained.catch(() => {})
    return chained
  }

  private async _runRemoteDeployInternal(
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
    let targetUrl = `${scheme}://${hostIp}:${hostPort}`
    const stackName = `nomad-${serviceName}`
    const extraEnv = preinstall?.extraEnv || []
    let createdOrModifiedContainer = false

    try {
      // 1. Resolve real active endpointId FIRST before checking GPU or containers
      try {
        const epResp = await client.get('/api/endpoints', { timeout: 10000 }).catch(() => null)
        let endpoints: any[] = []
        if (Array.isArray(epResp?.data)) {
          endpoints = epResp.data
        } else if (epResp?.data && Array.isArray(epResp.data.values)) {
          endpoints = epResp.data.values
        }
        if (endpoints.length > 0 && !endpoints.some((e: any) => Number(e?.Id) === endpointId)) {
          const activeEp = endpoints.find((e: any) => e.Type === 1 || e.Type === 2) || endpoints[0]
          if (activeEp?.Id) endpointId = Number(activeEp.Id)
        }
      } catch {}

      this.pendingGpuServices.delete(serviceName)
      if (serviceName === 'nomad_ollama' && (await this.endpointSupportsGpuRuntime(client, endpointId))) {
        this.pendingGpuServices.add(serviceName)
      }

      // 1.5 Pre-deploy check: auto-link pre-existing user container instead of creating conflicting stack,
      // and check host port collisions BEFORE modifying stacks!
      try {
        const preCheckResp = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 10000 })
          .catch(() => null)
        if (Array.isArray(preCheckResp?.data)) {
          const mappedPre = preCheckResp.data.map((c: any) => {
            const rawName = (c.Names && c.Names[0]) || ''
            const cleanName = rawName.replace(/^\//, '')
            const composeProject = c.Labels?.['com.docker.compose.project'] || ''
            const composeService = c.Labels?.['com.docker.compose.service'] || ''
            const projectName = composeProject || cleanName.split('-')[0] || cleanName
            const publicPort = (c.Ports || []).find((p: any) => p.PublicPort)?.PublicPort
            const allPublicPorts = (c.Ports || []).map((p: any) => Number(p.PublicPort)).filter(Boolean)
            return {
              fullId: c.Id || '',
              name: cleanName,
              image: c.Image || '',
              projectName: projectName.toLowerCase(),
              composeService: composeService.toLowerCase(),
              state: c.State || 'unknown',
              publicPort,
              allPublicPorts,
            }
          })

          const existingMatch = mappedPre.find((c) => containerMatchesCatalogService(service, c))
          if (existingMatch && !isNomadManagedContainer(existingMatch.name, existingMatch.projectName)) {
            const linkedPort = existingMatch.publicPort ? String(existingMatch.publicPort) : hostPort
            const linkedUrl = serviceName === 'nomad_ollama' ? '/chat' : `${scheme}://${hostIp}:${linkedPort}`
            await this.markAsDeployedRemotely(serviceName)
            service.installed = true
            service.installation_status = 'idle'
            service.custom_url = serviceName === 'nomad_ollama' ? null : linkedUrl
            if (serviceName === 'nomad_ollama') {
              service.ui_location = '/chat'
              await KVStore.setValue('ai.remoteOllamaUrl', `http://${hostIp}:${linkedPort}`).catch(() => {})
            }
            await service.save()
            this.broadcast(
              serviceName,
              'completed',
              `Contêiner existente "${existingMatch.name}" identificado no Portainer e vinculado automaticamente (porta ${linkedPort})!`
            )
            return
          }

          const requestedPortNum = Number(hostPort)
          const occupiedPorts = new Set<number>()
          let selfNamesMatches = (c: { name: string; projectName: string }) => {
            const lowerN = c.name.toLowerCase()
            const lowerP = c.projectName.toLowerCase()
            return (
              lowerN === stackName.toLowerCase() ||
              lowerN === serviceName.toLowerCase() ||
              lowerP === stackName.toLowerCase()
            )
          }
          for (const c of mappedPre) {
            if (!selfNamesMatches(c)) {
              for (const p of c.allPublicPorts) {
                occupiedPorts.add(p)
              }
            }
          }

          if (requestedPortNum > 0 && occupiedPorts.has(requestedPortNum)) {
            const holder = mappedPre.find(
              (c) => !selfNamesMatches(c) && c.allPublicPorts.includes(requestedPortNum)
            )
            let nextPort = requestedPortNum + 1
            while (occupiedPorts.has(nextPort) && nextPort < requestedPortNum + 200) {
              nextPort++
            }
            if (!occupiedPorts.has(nextPort)) {
              logger.warn(
                `[PortainerService] Port ${hostPort} already held by "${holder?.name || 'another container'}". Auto-remapping ${serviceName} to free port ${nextPort}.`
              )
              this.broadcast(
                serviceName,
                'initializing',
                `Porta ${hostPort} já ocupada por "${holder?.name || 'outro contêiner'}"; remapeando ${service.friendly_name || serviceName} para porta livre ${nextPort}...`
              )
              hostPort = String(nextPort)
              targetUrl = `${scheme}://${hostIp}:${hostPort}`
              if (serviceName !== 'nomad_ollama') {
                service.ui_location = scheme === 'https' ? `https:${hostPort}` : hostPort
              }
            } else {
              throw new Error(
                `A porta ${hostPort} já está em uso no Portainer pelo contêiner "${holder?.name || 'desconhecido'}" e não foi possível encontrar porta alternativa.`
              )
            }
          }
        }
      } catch (preErr: any) {
        if (preErr?.message?.includes('já está em uso no Portainer')) {
          throw preErr
        }
      }

      // 2. Clean up any existing conflicting containers or broken stacks BEFORE deploying
      createdOrModifiedContainer = true
      this.broadcast(
        serviceName,
        'initializing',
        `[1/5] Limpando contêineres ou stacks anteriores de ${stackName} no Portainer...`
      )
      await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName, hostPort)

      // 3. Resolve internal port & env
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

      // Safeguard: Open WebUI full `:main` image (4.5 GB) bundles PyTorch/SentenceTransformers and
      // triggers Linux OOM Killer (exit code 137) on homelab servers. Automatically use `:main-slim` (~200 MB / ~300 MB RAM).
      if (serviceName === 'nomad_open_webui') {
        if (!service.container_image || service.container_image === 'ghcr.io/open-webui/open-webui:main') {
          service.container_image = 'ghcr.io/open-webui/open-webui:main-slim'
          await service.save().catch(() => {})
        }
        const openWebUiDefaults = [
          'UVICORN_WORKERS=1',
          'WEBUI_SECRET_KEY=nomad_open_webui_secret_key_2026',
          'ANONYMIZED_TELEMETRY=false',
          'DO_NOT_TRACK=true',
          'SCARF_NO_ANALYTICS=true',
          'ENABLE_COMMUNITY_SHARING=false',
        ]
        for (const defVar of openWebUiDefaults) {
          const k = defVar.split('=')[0]
          if (
            !extraEnv.some((e) => e.startsWith(`${k}=`)) &&
            !(config?.Env || []).some((e: string) => e.startsWith(`${k}=`))
          ) {
            extraEnv.push(defVar)
          }
        }
      }

      const rawEnvVars = [
        ...(config?.Env || []),
        ...extraEnv,
        'TZ=America/Sao_Paulo',
      ]
      const envMap = new Map<string, string>()
      for (const item of rawEnvVars) {
        const idx = item.indexOf('=')
        if (idx > 0) envMap.set(item.slice(0, idx), item)
      }
      const envVars = Array.from(envMap.values())

      // 4. Pull Docker image on Portainer endpoint first so stack creation & volume init use it immediately
      this.broadcast(
        serviceName,
        'pulling',
        `[2/5] Baixando imagem ${service.container_image} no Portainer...`
      )
      let imageAlreadyCached = false
      try {
        await client.get(
          `/api/endpoints/${endpointId}/docker/images/${encodeURIComponent(service.container_image)}/json`,
          { timeout: 10000 }
        )
        imageAlreadyCached = true
      } catch {
        imageAlreadyCached = false
      }

      if (!imageAlreadyCached) {
        const maxPullAttempts = 3
        for (let pAttempt = 1; pAttempt <= maxPullAttempts; pAttempt++) {
          this.broadcast(
            serviceName,
            'pulling',
            pAttempt === 1
              ? `Baixando imagem ${service.container_image} no servidor Portainer (pode levar alguns minutos)...`
              : `[2/5] Conexão com registry oscilou — retentando download de ${service.container_image} (${pAttempt}/${maxPullAttempts})...`
          )
          try {
            const pullRes = await client.post(
              `/api/endpoints/${endpointId}/docker/images/create?fromImage=${encodeURIComponent(service.container_image)}`,
              null,
              { timeout: 900000, responseType: 'text' }
            )
            const rawStream = typeof pullRes.data === 'string' ? pullRes.data : ''
            if (rawStream.includes('"errorDetail"') || rawStream.includes('"error":')) {
              const errorMatch = rawStream.match(/"error"\s*:\s*"([^"]+)"/)
              const errMsg = errorMatch?.[1] || 'Falha ao baixar imagem Docker no Portainer.'
              throw new Error(errMsg)
            }
            break
          } catch (pullErr: any) {
            // Verify whether daemon finished caching the image despite HTTP proxy timeout
            const cachedAfterErr = await client
              .get(
                `/api/endpoints/${endpointId}/docker/images/${encodeURIComponent(service.container_image)}/json`,
                { timeout: 10000 }
              )
              .then(() => true)
              .catch(() => false)
            if (cachedAfterErr) break

            const rawPullMsg = String(pullErr?.message || pullErr || '')
            const lowerPull = rawPullMsg.toLowerCase()
            const isTransientNetworkErr =
              lowerPull.includes('httpreadseeker') ||
              lowerPull.includes('failed to copy') ||
              lowerPull.includes('eof') ||
              lowerPull.includes('timeout') ||
              lowerPull.includes('econnreset') ||
              lowerPull.includes('etimedout') ||
              lowerPull.includes('tls') ||
              lowerPull.includes('socket') ||
              lowerPull.includes('connection reset') ||
              lowerPull.includes('context canceled')

            if (isTransientNetworkErr && pAttempt < maxPullAttempts) {
              await new Promise((r) => setTimeout(r, pAttempt * 3000))
              continue
            }

            throw new Error(
              `Falha ao baixar a imagem "${service.container_image}" no servidor Portainer: ${translateDockerDeployErrorPtBr(rawPullMsg)}`
            )
          }
        }
      }

      // 5. Detect if Portainer shares the same Docker host as NOMAD; if remote-only, seed named volumes
      this.broadcast(
        serviceName,
        'preinstall',
        `[3/5] Preparando armazenamento e biblioteca de ${service.friendly_name || serviceName}...`
      )
      const endpointStorageRoot = await this.detectEndpointHostStorageRoot(
        client,
        endpointId,
        preinstall?.hostStorageRoot
      )

      if (!endpointStorageRoot) {
        await this.initNamedVolumeIfRemoteOnly(
          client,
          endpointId,
          serviceName,
          config,
          service.container_image,
          hostIp,
          hostPort
        )
      }

      // 6. Build single- or multi-service Docker Compose configuration
      const composeContent = this.buildComposeFile(
        serviceName,
        service.container_image,
        hostPort,
        config,
        service.container_command,
        endpointStorageRoot,
        extraEnv,
        hostIp
      )
      const isMultiService = hasMultiServiceSidecars(serviceName)

      // 7. Create fresh stack in Portainer
      this.broadcast(
        serviceName,
        'creating',
        isMultiService
          ? `[4/5] Implantando Stack completo (${stackName} + banco/serviços de apoio) no Portainer...`
          : `[4/5] Implantando Stack "${stackName}" no Portainer...`
      )

      let deployedViaStack = false
      let stackFailureReason = ''
      try {
        logger.info(`[PortainerService] Creating standalone stack ${stackName}...`)
        await client.post(
          `/api/stacks/create/standalone/string?endpointId=${endpointId}`,
          {
            name: stackName,
            stackFileContent: composeContent,
            env: [],
          },
          { timeout: 300000 }
        )

        // Multi-service stacks (Postgres/Redis/ElasticSearch/MariaDB) need extra time for companion pulls, DB init & healthchecks.
        // Portainer Stack Status codes: 1 = Active, 2 = Inactive, 3 = Deploying, 4 = Error
        const stackPollAttempts = isMultiService ? 30 : 3
        let createdStack: any = null
        let spawnedCont: any = null
        for (let sAttempt = 0; sAttempt < stackPollAttempts; sAttempt++) {
          await new Promise((r) => setTimeout(r, sAttempt === 0 ? 3500 : 3000))
          const [postStackResp, postContResp] = await Promise.all([
            client.get('/api/stacks', { timeout: 10000 }).catch(() => null),
            client.get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 10000 }).catch(() => null),
          ])
          createdStack = Array.isArray(postStackResp?.data)
            ? postStackResp.data.find((s: any) => (s.Name || '').toLowerCase() === stackName.toLowerCase())
            : null
          const contList: any[] = Array.isArray(postContResp?.data) ? postContResp.data : []
          spawnedCont =
            contList.find(
              (c: any) =>
                !c.Names?.some((n: string) => n.endsWith('-init')) &&
                (c.Labels?.['com.docker.compose.service']?.toLowerCase() === serviceName.toLowerCase() ||
                  c.Names?.some((n: string) => n.toLowerCase() === `/${stackName.toLowerCase()}`))
            ) ||
            contList.find(
              (c: any) =>
                !c.Names?.some((n: string) => n.endsWith('-init')) &&
                !c.Names?.some((n: string) => /-(db|redis|meili|es|web)$/.test(n.toLowerCase())) &&
                (c.Labels?.['com.docker.compose.project']?.toLowerCase() === stackName.toLowerCase() ||
                  c.Names?.some((n: string) => n.toLowerCase().includes(stackName.toLowerCase())))
            )
          if (spawnedCont && spawnedCont.State === 'running' && createdStack?.Status !== 2 && createdStack?.Status !== 4) {
            break
          }
          if (createdStack?.Status === 4) {
            break
          }
          if (spawnedCont && (spawnedCont.State === 'exited' || spawnedCont.State === 'dead')) {
            break
          }
        }

        if (spawnedCont && spawnedCont.State === 'running' && createdStack?.Status !== 2 && createdStack?.Status !== 4) {
          deployedViaStack = true
        } else {
          let portainerStackDetail = ''
          if (createdStack?.Id) {
            const stackDetail = await client
              .get(`/api/stacks/${createdStack.Id}`, { timeout: 8000 })
              .catch(() => null)
            const depStatuses = stackDetail?.data?.DeploymentStatus || createdStack?.DeploymentStatus
            const lastMsg = Array.isArray(depStatuses) && depStatuses.length > 0
              ? depStatuses[depStatuses.length - 1]?.Message
              : stackDetail?.data?.StatusMessage || ''
            if (lastMsg) portainerStackDetail = String(lastMsg).trim()
          }
          stackFailureReason = `estado=${spawnedCont?.State || 'não criado'}, stackStatus=${createdStack?.Status ?? '?'}${portainerStackDetail ? `, detalhe=${portainerStackDetail}` : ''}`
          logger.warn(
            `[PortainerService] Stack ${stackName} check (${stackFailureReason}).${isMultiService ? '' : ' Falling back to direct Docker Engine API...'}`
          )
          if (isMultiService) {
            throw new Error(
              `Stack multi-serviço ${stackName} falhou (${stackFailureReason}).`
            )
          }
          await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName, hostPort)
        }
      } catch (stackErr: any) {
        if (isMultiService) {
          throw stackErr
        }
        logger.warn(
          `[PortainerService] Stacks API failed (${stackErr?.response?.data?.message || stackErr?.message}). Cleaning up partial stack and falling back to Docker Container API...`
        )
        await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName, hostPort)
      }

      // 8. Fallback: If Stacks API was unavailable or stalled in Error, deploy container directly via Docker Engine Proxy
      if (!deployedViaStack) {
        this.broadcast(
          serviceName,
          'creating',
          `Implantando contêiner ${stackName} via Docker Engine do Portainer...`
        )

        // Ensure named volumes exist when falling back directly to Docker Engine API
        if (!endpointStorageRoot) {
          await this.initNamedVolumeIfRemoteOnly(
            client,
            endpointId,
            serviceName,
            config,
            service.container_image
          )
        }

        const rawBinds: string[] = config?.HostConfig?.Binds || []
        const { binds: resolvedBinds, usesHostBinds } = this.rewriteBindsForHostStorage(
          rawBinds,
          endpointStorageRoot
        )

        const defaultBinds =
          resolvedBinds.length > 0
            ? resolvedBinds.map((b: string) => {
                if (b.startsWith('/var/run/docker.sock')) {
                  return b
                }
                if (!usesHostBinds && b.startsWith('/')) {
                  const parts = b.split(':')
                  const rawTargetPath = parts[1] || '/data'
                  const targetPath =
                    rawTargetPath === '/etc/nginx/conf.d/default.conf'
                      ? '/etc/nginx/conf.d'
                      : rawTargetPath
                  const mode = parts[2] ? `:${parts[2]}` : ''
                  const cleanName =
                    targetPath
                      .replace(/^\//, '')
                      .replace(/[^a-zA-Z0-9_-]/g, '-')
                      .toLowerCase() || 'data'
                  return `nomad-${serviceName}-${cleanName}:${targetPath}${mode}`
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
            ExtraHosts: ['host.docker.internal:host-gateway'],
            ...(this.pendingGpuServices.has(serviceName)
              ? {
                  DeviceRequests: [
                    {
                      Driver: 'nvidia',
                      Count: -1,
                      Capabilities: [['gpu']],
                    },
                  ],
                }
              : {}),
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

      // 9. Verification: Poll for the main container (handles slower image pulls / concurrent queue)
      this.broadcast(
        serviceName,
        'starting',
        `[5/5] Verificando inicialização e saúde do serviço no Portainer...`
      )
      let runningCont: any = null
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 3500 : 2500))
        const verifyResp = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
          .catch(() => null)

        const contList: any[] = Array.isArray(verifyResp?.data) ? verifyResp.data : []
        runningCont =
          contList.find(
            (c: any) =>
              !c.Names?.some((n: string) => n.endsWith('-init')) &&
              (c.Labels?.['com.docker.compose.service']?.toLowerCase() === serviceName.toLowerCase() ||
                c.Names?.some(
                  (n: string) =>
                    n.toLowerCase() === `/${stackName.toLowerCase()}` ||
                    n.toLowerCase() === `/${serviceName.toLowerCase()}`
                ))
          ) ||
          contList.find(
            (c: any) =>
              !c.Names?.some((n: string) => n.endsWith('-init') || /-(db|redis|meili|es|web)$/.test(n.toLowerCase())) &&
              (c.Labels?.['com.docker.compose.project']?.toLowerCase() === stackName.toLowerCase() ||
                c.Names?.some(
                  (n: string) =>
                    n.toLowerCase().includes(stackName.toLowerCase()) ||
                    n.toLowerCase().includes(serviceName.toLowerCase())
                ))
          )
        if (runningCont) break
      }

      if (!runningCont) {
        throw new Error(`O contêiner ${stackName} não foi encontrado após a implantação no Portainer.`)
      }

      if (runningCont.State !== 'running') {
        try {
          await client.post(`/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/start`, null, {
            timeout: 15000,
          })
          await new Promise((r) => setTimeout(r, 2500))
        } catch (startErr: any) {
          const httpStatus = startErr?.response?.status
          if (httpStatus === 304) {
            // Docker Engine 304 means container was already started/restarting; wait briefly and proceed to inspectCheck + logs
            await new Promise((r) => setTimeout(r, 2500))
          } else {
            const dockerMsg = startErr?.response?.data?.message || startErr?.message || 'falha desconhecida ao iniciar'
            throw new Error(`Contêiner permaneceu parado (${runningCont.State}) e falhou ao iniciar: ${dockerMsg}`)
          }
        }
      }

      let inspectCheck: any = null
      for (let iAttempt = 0; iAttempt < 12; iAttempt++) {
        inspectCheck = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/json`, {
            timeout: 20000,
          })
          .catch(() => null)
        const healthStatus = inspectCheck?.data?.State?.Health?.Status
        if (inspectCheck?.data?.State) {
          // If the container defines a Docker HEALTHCHECK and is still 'starting', wait up to ~36s before evaluating
          if (healthStatus === 'starting' && inspectCheck.data.State.Running && iAttempt < 11) {
            await new Promise((r) => setTimeout(r, 3000))
            continue
          }
          break
        }
        await new Promise((r) => setTimeout(r, 2000))
      }

      const cState = inspectCheck?.data?.State
      const restartCount = inspectCheck?.data?.RestartCount ?? 0
      const healthStatus = cState?.Health?.Status
      const isHealthyRunning = cState
        ? Boolean(cState.Running) &&
          cState.Status !== 'created' &&
          cState.Status !== 'exited' &&
          cState.Status !== 'dead' &&
          !cState.Restarting &&
          healthStatus !== 'unhealthy' &&
          restartCount <= 2
        : runningCont.State === 'running'

      if (!isHealthyRunning) {
        let logs = ''
        try {
          const logsResp = await client.get(
            `/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/logs?stderr=1&stdout=1&tail=25`,
            { timeout: 10000 }
          )
          logs = typeof logsResp?.data === 'string' ? logsResp.data : ''
        } catch {}
        const oomDetected = Boolean(cState?.OOMKilled)
        throw new Error(
          oomDetected
            ? `Contêiner encerrado por falta de memória RAM (OOMKilled) no servidor Portainer.`
            : healthStatus === 'unhealthy'
              ? `Contêiner iniciou mas falhou no Healthcheck (unhealthy) no Portainer.${logs ? ` Logs: ${logs.replace(/[^\x20-\x7E\n]/g, '').slice(0, 220)}` : ''}`
              : `Contêiner não permaneceu ativo (estado: ${cState?.Status || runningCont.State}, código: ${cState?.ExitCode ?? '?'}, reinícios: ${restartCount}). ${logs ? `Logs: ${logs.replace(/[^\x20-\x7E\n]/g, '').slice(0, 220)}` : ''}`
        )
      }

      if (serviceName === 'nomad_filebrowser') {
        // Garante usuário padrão/personalizado no FileBrowser mesmo se .filebrowser.db já existia
        const autoApply = await KVStore.getValue('portainer.autoApplyCredentials').catch(() => false)
        const cfgUser = String(
          (await KVStore.getValue('portainer.defaultUsername').catch(() => '')) || ''
        ).trim()
        const cfgPass = String(
          (await KVStore.getValue('portainer.defaultPassword').catch(() => '')) || ''
        )
        const effectivePass = autoApply && cfgPass ? cfgPass : 'nomad'
        const cmds: string[][] = [
          ['filebrowser', 'users', 'update', 'admin', '--password', effectivePass, '-d', '/db/.filebrowser.db'],
          ['filebrowser', 'users', 'add', 'admin', effectivePass, '--perm.admin', '-d', '/db/.filebrowser.db'],
        ]
        if (autoApply && cfgUser && cfgUser !== 'admin') {
          cmds.push(
            ['filebrowser', 'users', 'add', cfgUser, effectivePass, '--perm.admin', '-d', '/db/.filebrowser.db'],
            ['filebrowser', 'users', 'update', cfgUser, '--password', effectivePass, '-d', '/db/.filebrowser.db']
          )
        }
        for (const cmd of cmds) {
          try {
            const execCreate = await client.post(
              `/api/endpoints/${endpointId}/docker/containers/${runningCont.Id}/exec`,
              { AttachStdout: true, AttachStderr: true, Cmd: cmd },
              { timeout: 8000 }
            )
            if (execCreate.data?.Id) {
              await client.post(
                `/api/endpoints/${endpointId}/docker/exec/${execCreate.data.Id}/start`,
                { Detach: false, Tty: false },
                { timeout: 8000 }
              )
            }
          } catch {
            // Non-fatal
          }
        }
      }

      // 10. Mark as installed and linked to remote server
      this.pendingGpuServices.delete(serviceName)
      await this.markAsDeployedRemotely(serviceName)
      service.installed = true
      service.installation_status = 'idle'
      if (serviceName === 'nomad_ollama') {
        service.ui_location = '/chat'
        service.custom_url = null
        await KVStore.setValue('ai.remoteOllamaUrl', `http://${hostIp}:${hostPort}`).catch(() => {})
      } else {
        service.custom_url = targetUrl
      }
      await service.save()

      this.broadcast(
        serviceName,
        'completed',
        serviceName === 'nomad_ollama'
          ? `Assistente de IA ativo no Portainer (API em http://${hostIp}:${hostPort}) e conectado ao /chat!`
          : `Aplicação instalada e ativa no Servidor Portainer em ${targetUrl}!`
      )
    } catch (apiErr: any) {
      this.pendingGpuServices.delete(serviceName)
      logger.error(`Portainer remote deploy failed for ${serviceName}: ${apiErr.message}`)
      if (createdOrModifiedContainer) {
        // Remove failed/zombie `created`/`exited`/`unhealthy` container left behind by this attempt
        await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName).catch(() => {})
      }
      await this.unmarkDeployedRemotely(serviceName)
      service.installed = false
      service.installation_status = 'error'
      await service.save()
      const detailedErr = translateDockerDeployErrorPtBr(apiErr?.message || apiErr)
      this.broadcast(serviceName, 'error', `Falha ao implantar no Portainer: ${detailedErr}`)
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
        const listResp = await client
          .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 10000 })
          .catch(() => null)
        const containers: any[] = Array.isArray(listResp?.data) ? listResp.data : []
        const matched = containers.find((c: any) =>
          containerMatchesCatalogService(service, {
            name: (c.Names?.[0] || '').replace(/^\//, ''),
            image: c.Image || '',
            projectName: c.Labels?.['com.docker.compose.project'] || '',
            composeService: c.Labels?.['com.docker.compose.service'] || '',
          })
        )
        const matchedName = (matched?.Names?.[0] || '').replace(/^\//, '')
        const matchedProject = matched?.Labels?.['com.docker.compose.project'] || ''
        const isExternal = matched && !isNomadManagedContainer(matchedName, matchedProject)

        if (!isExternal) {
          await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName)
          if (removeImage && service.container_image) {
            await client
              .delete(
                `/api/endpoints/${endpointId}/docker/images/${encodeURIComponent(service.container_image)}?force=true`,
                { timeout: 15000 }
              )
              .catch(() => {})
          }
        } else {
          logger.info(
            `[PortainerService] Unlinking user-managed container "${matchedName}" without deleting it from Portainer.`
          )
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
      const svcRecord = await Service.query().where('service_name', serviceName).first().catch(() => null)
      const listResp = await client
        .get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
        .catch(() => null)
      const existing = (listResp?.data || []).find((c: any) =>
        containerMatchesCatalogService(
          svcRecord || { service_name: serviceName },
          {
            name: (c.Names?.[0] || '').replace(/^\//, ''),
            image: c.Image || '',
            projectName: c.Labels?.['com.docker.compose.project'] || '',
            composeService: c.Labels?.['com.docker.compose.service'] || '',
          }
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
      await this.cleanupBeforeRemoteDeploy(client, endpointId, serviceName, stackName, hostPort)

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
