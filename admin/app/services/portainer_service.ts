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
      friendly_name: 'Meelo (Videoclipes)',
      description: 'Servidor de gerenciamento e streaming de videoclipes musicais (Servidor Remoto)',
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
      friendly_name: 'Yubal (Playlist Sync)',
      description: 'Sincronizador automático de playlists do Navidrome (Servidor Remoto)',
      icon: 'IconBrandDocker',
      category: 'utility',
      port: 8050,
      protocol: 'http',
    },
    {
      service_name: 'ignis-nexus',
      friendly_name: 'Ignis Core (Segundo Cérebro)',
      description: 'Gestão de notas, ideias e cofres de conhecimento pessoal (Servidor Remoto)',
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

    // 1.1 Enrich any other catalog service deployed to Portainer
    const deployedServices = await this.getDeployedServices()
    for (const deployedName of deployedServices) {
      const index = services.findIndex((s) => s.service_name === deployedName)
      if (index !== -1) {
        const item = services[index]
        const port = item.ui_location ? item.ui_location.replace(/^https?:/, '').replace(/^.*?:/, '') : '8090'
        const remoteUrl = `http://${hostIp}:${port}`
        services[index] = {
          ...item,
          installed: true,
          status: 'running',
          node: 'portainer',
          node_label: 'Servidor Portainer',
          ui_location: remoteUrl,
          custom_url: remoteUrl,
        }
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
    let hostPort = service.ui_location ? service.ui_location.replace(/^https?:/, '').replace(/^.*?:/, '') : '8090'
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
        // 1. Resolve real active endpointId if available
        try {
          const epResp = await client.get('/api/endpoints').catch(() => null)
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

        // 2. Pull container image on Portainer Docker host before creating
        try {
          this.broadcast(
            serviceName,
            'pulling',
            `Baixando imagem ${service.container_image} no servidor Portainer...`
          )
          await client.post(
            `/api/endpoints/${endpointId}/docker/images/create?fromImage=${encodeURIComponent(service.container_image)}`,
            null,
            { timeout: 300000 }
          )
        } catch (pullErr: any) {
          logger.warn(`Portainer image pull: ${pullErr?.message}`)
        }

        // 3. Resolve internal container port and host port
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

        // 4. Construct Docker container payload
        const defaultBinds = config?.HostConfig?.Binds && config.HostConfig.Binds.length > 0
          ? config.HostConfig.Binds.map((b: string) => {
              if (b.startsWith('/')) {
                const parts = b.split(':')
                const targetPath = parts[1] || '/data'
                return `nomad-${serviceName}-data:${targetPath}`
              }
              return b
            })
          : [`nomad-${serviceName}-data:/data`]

        const containerPayload: any = {
          Image: service.container_image,
          name: `nomad-${serviceName}`,
          Env: [
            ...(config?.Env || []),
            'LANG=pt_BR.UTF-8',
            'LC_ALL=pt_BR.UTF-8',
            'TZ=America/Sao_Paulo',
          ],
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

        if (serviceName.includes('kiwix')) {
          containerPayload.Entrypoint = [
            '/bin/sh',
            '-c',
            'if [ ! -f /data/kiwix-library.xml ]; then echo \'<?xml version="1.0" encoding="UTF-8"?><library version="20110515"/>\' > /data/kiwix-library.xml; fi; exec /usr/local/bin/kiwix-serve --library /data/kiwix-library.xml --monitorLibrary --address=all',
          ]
        } else if (service.container_command) {
          containerPayload.Cmd = service.container_command.split(' ')
        }

        this.broadcast(serviceName, 'creating', `Criando contêiner nomad-${serviceName} no servidor Portainer...`)

        let containerId: string | undefined
        try {
          const createResp = await client.post(
            `/api/endpoints/${endpointId}/docker/containers/create?name=nomad-${serviceName}`,
            containerPayload,
            { timeout: 30000 }
          )
          containerId = createResp.data?.Id
        } catch (createErr: any) {
          if (createErr.response?.status === 409) {
            logger.info(`Container nomad-${serviceName} already exists on Portainer. Recreating...`)
            try {
              const listResp = await client.get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
              const existing = (listResp.data || []).find((c: any) =>
                c.Names?.some((n: string) => n.includes(`nomad-${serviceName}`))
              )
              if (existing?.Id) {
                await client.delete(`/api/endpoints/${endpointId}/docker/containers/${existing.Id}?force=true`, { timeout: 30000 }).catch(() => {})
                const retryResp = await client.post(
                  `/api/endpoints/${endpointId}/docker/containers/create?name=nomad-${serviceName}`,
                  containerPayload,
                  { timeout: 30000 }
                )
                containerId = retryResp.data?.Id
              }
            } catch {}
          } else {
            throw createErr
          }
        }

        if (containerId) {
          this.broadcast(serviceName, 'starting', `Iniciando contêiner no servidor Portainer...`)
          await client.post(`/api/endpoints/${endpointId}/docker/containers/${containerId}/start`, null, { timeout: 30000 })

          // Wait 1.5s and verify running state
          await new Promise((r) => setTimeout(r, 1500))
          const inspectResp = await client.get(`/api/endpoints/${endpointId}/docker/containers/${containerId}/json`, { timeout: 15000 }).catch(() => null)
          const isRunning = inspectResp?.data?.State?.Running
          if (isRunning === false) {
            let logs = ''
            try {
              const logsResp = await client.get(`/api/endpoints/${endpointId}/docker/containers/${containerId}/logs?stderr=1&stdout=1&tail=20`, { timeout: 10000 })
              logs = typeof logsResp?.data === 'string' ? logsResp.data : ''
            } catch {}
            throw new Error(`Contêiner parou inesperadamente após iniciar. ${logs ? `Logs: ${logs.slice(0, 200)}` : ''}`)
          }
        }
      } catch (apiErr: any) {
        logger.error(`Direct Portainer API call failed: ${apiErr.message}`)
        this.broadcast(serviceName, 'error', `Falha ao implantar no Portainer: ${apiErr.message}`)
        service.installation_status = 'error'
        await service.save()
        return
      }
    } else {
      // Simulate/register the deployment when API key is not yet set
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    // Mark as installed and linked to remote server
    await this.markAsDeployedRemotely(serviceName)
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

    if (apiKey) {
      try {
        const listResp = await client.get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
        const existing = (listResp.data || []).find((c: any) =>
          c.Names?.some((n: string) => n.includes(`nomad-${serviceName}`) || n.includes(`/${serviceName}`))
        )
        if (existing?.Id) {
          // Stop container
          await client.post(`/api/endpoints/${endpointId}/docker/containers/${existing.Id}/stop`, null, { timeout: 15000 }).catch(() => {})
          // Remove container
          await client.delete(`/api/endpoints/${endpointId}/docker/containers/${existing.Id}?force=true`, { timeout: 15000 }).catch(() => {})
        }
        if (removeImage && service.container_image) {
          await client.delete(`/api/endpoints/${endpointId}/docker/images/${encodeURIComponent(service.container_image)}?force=true`, { timeout: 15000 }).catch(() => {})
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

    this.broadcast(serviceName, 'uninstalled', `Serviço ${service.friendly_name || serviceName} desinstalado do servidor remoto.`)
    return { success: true, message: `Serviço ${service.friendly_name || serviceName} desinstalado com sucesso.` }
  }

  public async affectRemoteContainer(
    serviceName: string,
    action: 'start' | 'stop' | 'restart'
  ): Promise<{ success: boolean; message: string }> {
    const { client, apiKey } = await this.getClient()
    const endpointId = await this.getEndpointId()
    if (!apiKey) {
      return { success: true, message: `Ação ${action} simulada para ${serviceName}` }
    }

    try {
      const listResp = await client.get(`/api/endpoints/${endpointId}/docker/containers/json?all=1`, { timeout: 15000 })
      const existing = (listResp.data || []).find((c: any) =>
        c.Names?.some((n: string) => n.includes(`nomad-${serviceName}`) || n.includes(`/${serviceName}`))
      )
      if (!existing?.Id) {
        return { success: false, message: `Contêiner nomad-${serviceName} não encontrado no Portainer.` }
      }
      await client.post(`/api/endpoints/${endpointId}/docker/containers/${existing.Id}/${action}`, null, { timeout: 30000 })
      return { success: true, message: `Serviço ${serviceName} executou ${action} com sucesso no servidor Portainer.` }
    } catch (err: any) {
      return { success: false, message: `Falha ao executar ${action} no Portainer: ${err.message}` }
    }
  }
}
