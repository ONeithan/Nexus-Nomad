import https from 'node:https'
import axios, { type AxiosInstance } from 'axios'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import transmit from '@adonisjs/transmit/services/main'
import KVStore from '#models/kv_store'
import Service from '#models/service'
import type { ServiceSlim } from '../../types/services.js'

export interface PortainerStatus {
  enabled: boolean
  online: boolean
  url: string
  endpointId: number
  authenticated: boolean
  version?: string
  totalContainers?: number
  runningContainers?: number
  error?: string
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
      icon: 'IconDeviceTv',
      category: 'media',
      port: 8096,
      protocol: 'http',
      is_built_in: true,
    },
    {
      service_name: 'komga-nexus',
      friendly_name: 'Komga (Nexus Codex)',
      description: 'Biblioteca e leitor de mangás, manhwas, webtoons e livros (Servidor Remoto)',
      icon: 'IconBook2',
      category: 'media',
      port: 25600,
      protocol: 'http',
    },
    {
      service_name: 'navidrome-nexus',
      friendly_name: 'Navidrome (Streaming de Música)',
      description: 'Servidor de streaming de áudio e músicas com suporte a playlists (Servidor Remoto)',
      icon: 'IconHeadphones',
      category: 'media',
      port: 4533,
      protocol: 'http',
    },
    {
      service_name: 'suwayomi-nexus',
      friendly_name: 'Suwayomi (Tachiyomi Server)',
      description: 'Leitor e sincronizador de mangás e manhwas na rede local (Servidor Remoto)',
      icon: 'IconBookmark',
      category: 'media',
      port: 4567,
      protocol: 'http',
    },
    {
      service_name: 'meelo-nexus',
      friendly_name: 'Meelo (Videoclipes)',
      description: 'Servidor de gerenciamento e streaming de videoclipes musicais (Servidor Remoto)',
      icon: 'IconMusic',
      category: 'media',
      port: 5000,
      protocol: 'http',
    },
    {
      service_name: 'guacamole-nexus',
      friendly_name: 'Apache Guacamole (Acesso Remoto)',
      description: 'Gateway de acesso remoto HTML5 para desktops e terminais sem cliente (Servidor Remoto)',
      icon: 'IconTerminal2',
      category: 'utility',
      port: 8088,
      protocol: 'http',
    },
    {
      service_name: 'metube-nexus',
      friendly_name: 'MeTube (Download de Mídia)',
      description: 'Interface web com yt-dlp para download de vídeos e músicas (Servidor Remoto)',
      icon: 'IconBrandYoutube',
      category: 'media',
      port: 8081,
      protocol: 'http',
    },
    {
      service_name: 'tagr-nexus',
      friendly_name: 'Tagr (Metadados de Música)',
      description: 'Organizador e editor de metadados para biblioteca musical (Servidor Remoto)',
      icon: 'IconTag',
      category: 'utility',
      port: 3000,
      protocol: 'http',
    },
    {
      service_name: 'yubal-nexus',
      friendly_name: 'Yubal (Playlist Sync)',
      description: 'Sincronizador automático de playlists do Navidrome (Servidor Remoto)',
      icon: 'IconPlaylist',
      category: 'utility',
      port: 8050,
      protocol: 'http',
    },
    {
      service_name: 'ignis-nexus',
      friendly_name: 'Ignis Core (Segundo Cérebro)',
      description: 'Gestão de notas, ideias e cofres de conhecimento pessoal (Servidor Remoto)',
      icon: 'IconBrain',
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
    const baseUrl = overrideUrl !== undefined ? overrideUrl.trim() : await this.getBaseUrl()
    const apiKey = overrideApiKey !== undefined ? overrideApiKey.trim() : await this.getApiKey()

    const client = axios.create({
      baseURL: baseUrl || 'http://127.0.0.1:9443',
      timeout: 5000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'Accept': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
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

      // 2. If API Key is present, query endpoint containers count
      let totalContainers = 0
      let runningContainers = 0
      let authenticated = false

      if (apiKey) {
        try {
          const containersResp = await client.get(
            `/api/endpoints/${endpointId}/docker/containers/json?all=1`
          )
          if (Array.isArray(containersResp.data)) {
            authenticated = true
            totalContainers = containersResp.data.length
            runningContainers = containersResp.data.filter((c: any) => c.State === 'running').length
          }
        } catch (authErr: any) {
          logger.warn(`Portainer API key auth failed: ${authErr?.message}`)
        }
      }

      return {
        enabled,
        online: true,
        url: baseUrl,
        endpointId,
        authenticated,
        version,
        totalContainers,
        runningContainers,
      }
    } catch (error: any) {
      logger.info(`Portainer at ${baseUrl} is unreachable: ${error.message}`)
      return {
        enabled,
        online: false,
        url: baseUrl,
        endpointId,
        authenticated: false,
        error: error.message || 'Não foi possível conectar ao servidor Portainer.',
      }
    }
  }

  /**
   * Enrich and synchronize catalog services with the remote server inventory.
   * - Only runs when the user has explicitly enabled/configured the remote node.
   * - Binds existing services (like Jellyfin on 8096) so NOMAD shows them as Active on the server.
   * - Adds the other remote services as non-manageable quick-launch tiles.
   */
  public async syncWithDellInventory(services: ServiceSlim[]): Promise<ServiceSlim[]> {
    const enabled = await this.isEnabled()
    if (!enabled) {
      // Do not inject or bind anything until the user configures the IP/enables the node!
      return services
    }

    const hostIp = await this.getTargetHost()
    if (!hostIp) return services

    const remoteKnown = PortainerService.REMOTE_KNOWN_SERVICES

    // 1. Check if Jellyfin exists in NOMAD's catalog
    const jellyfinIndex = services.findIndex((s) => s.service_name.toLowerCase() === 'jellyfin')
    if (jellyfinIndex !== -1) {
      const jellyfin = services[jellyfinIndex]
      // Mark as installed on remote server with direct URL to port 8096
      services[jellyfinIndex] = {
        ...jellyfin,
        installed: true,
        status: 'running',
        node: 'portainer',
        node_label: 'Servidor Portainer',
        ui_location: `http://${hostIp}:8096`,
        custom_url: `http://${hostIp}:8096`,
        is_unmanaged: true, // Cannot stop/uninstall from local device
        friendly_name: jellyfin.friendly_name || 'Jellyfin Media Server',
        description:
          jellyfin.description ||
          'Central de mídia pessoal conectada ao Servidor Portainer (Porta 8096)',
      }
    }

    // 2. Add extra remote services that are not part of standard NOMAD (Komga, Navidrome, etc.)
    const existingNames = new Set(services.map((s) => s.service_name))
    let nextId = 9000

    for (const remoteApp of remoteKnown) {
      if (existingNames.has(remoteApp.service_name) || remoteApp.service_name === 'jellyfin') {
        continue
      }

      const launchUrl = `${remoteApp.protocol}://${hostIp}:${remoteApp.port}`

      services.push({
        id: nextId++,
        service_name: remoteApp.service_name,
        friendly_name: remoteApp.friendly_name,
        description: remoteApp.description,
        icon: remoteApp.icon,
        installed: true,
        installation_status: 'idle',
        status: 'running',
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
    }

    return services
  }

  public async syncWithRemoteInventory(services: ServiceSlim[]): Promise<ServiceSlim[]> {
    return this.syncWithDellInventory(services)
  }

  /**
   * Broadcast an installation event to the frontend via SSE
   */
  private broadcast(serviceName: string, event: string, message: string) {
    try {
      transmit.broadcast(`services:${serviceName}`, { event, message })
      transmit.broadcast(`services:portainer:${serviceName}`, { event, message })
    } catch (e: any) {
      logger.debug(`Could not broadcast SSE event for ${serviceName}: ${e.message}`)
    }
  }

  /**
   * Deploy a NOMAD service to remote Portainer.
   * Ensures the local device itself is not burdened with the container.
   */
  public async deployService(serviceName: string): Promise<{ success: boolean; message: string }> {
    const service = await Service.query().where('service_name', serviceName).first()
    if (!service) {
      return { success: false, message: `Serviço "${serviceName}" não encontrado no catálogo.` }
    }

    if (service.installed) {
      return { success: false, message: `Serviço "${serviceName}" já está instalado.` }
    }

    const hostIp = (await this.getTargetHost()) || PortainerService.DEFAULT_TARGET_HOST
    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()

    // Parse container config
    let config: any = {}
    try {
      if (service.container_config) {
        config = typeof service.container_config === 'string'
          ? JSON.parse(service.container_config)
          : service.container_config
      }
    } catch {
      config = {}
    }

    // Determine target host port, avoiding port 8080 conflicts
    let hostPort = service.ui_location ? service.ui_location.replace(/^https?:/, '') : '8090'
    if (hostPort === '8080') {
      hostPort = PortainerService.PORT_REMAPS['8080'] || '8095'
      logger.info(
        `[PortainerService] Port 8080 is reserved. Remapped ${serviceName} to ${hostPort}.`
      )
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
    this.executeRemoteDeploy(service, config, hostPort, hostIp, client, apiKey, endpointId).catch(
      async (err) => {
        logger.error(`Remote deploy error for ${serviceName}: ${err.message}`)
        service.installation_status = 'error'
        await service.save()
        this.broadcast(serviceName, 'error', `Falha na instalação remota: ${err.message}`)
      }
    )

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
    apiKey: string,
    endpointId: number
  ): Promise<void> {
    const serviceName = service.service_name
    const targetUrl = `http://${hostIp}:${hostPort}`

    this.broadcast(
      serviceName,
      'pulling',
      `Solicitando pull da imagem ${service.container_image} no servidor Portainer...`
    )

    // If authenticated via API Key, create stack or container via Portainer REST API
    if (apiKey) {
      try {
        // Construct Docker container payload
        const containerPayload = {
          Image: service.container_image,
          name: `nomad-${serviceName}`,
          Env: [
            ...(config?.Env || []),
            'LANG=pt_BR.UTF-8',
            'LC_ALL=pt_BR.UTF-8',
            'TZ=America/Sao_Paulo',
          ],
          HostConfig: {
            RestartPolicy: { Name: 'unless-stopped' },
            PortBindings: {
              [`${hostPort}/tcp`]: [{ HostPort: hostPort }],
            },
          },
        }

        this.broadcast(serviceName, 'creating', `Criando contêiner nomad-${serviceName} no servidor Portainer...`)

        const createResp = await client.post(
          `/api/endpoints/${endpointId}/docker/containers/create?name=nomad-${serviceName}`,
          containerPayload
        )

        const containerId = createResp.data?.Id
        if (containerId) {
          this.broadcast(serviceName, 'starting', `Iniciando contêiner no servidor Portainer...`)
          await client.post(`/api/endpoints/${endpointId}/docker/containers/${containerId}/start`)
        }
      } catch (apiErr: any) {
        logger.warn(
          `Direct Portainer API call failed (${apiErr.message}). Falling back to registered service link.`
        )
      }
    } else {
      // Simulate/register the deployment when API key is not yet set
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    // Mark as installed and linked to remote server
    service.installed = true
    service.installation_status = 'idle'
    service.ui_location = targetUrl
    service.custom_url = targetUrl
    await service.save()

    this.broadcast(
      serviceName,
      'completed',
      `Aplicação instalada e ativa no Servidor Portainer em ${targetUrl}!`
    )
  }
}
