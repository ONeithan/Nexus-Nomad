import KVStore from '#models/kv_store'
import https from 'node:https'
import http from 'node:http'
import logger from '@adonisjs/core/services/logger'

export interface TruenasStatus {
  enabled: boolean
  online: boolean
  url: string
  version?: string
  hostname?: string
  pools?: string[]
  error?: string
}

export class TruenasService {
  public async isEnabled(): Promise<boolean> {
    const enabled = await KVStore.getValue('truenas.enabled')
    return enabled === true
  }

  public async getStatus(overrideUrl?: string, overrideApiKey?: string): Promise<TruenasStatus> {
    const enabled = await this.isEnabled()
    const storedUrl = (await KVStore.getValue('truenas.url')) || ''
    const storedKey = (await KVStore.getValue('truenas.apiKey')) || ''
    const rawUrl = (overrideUrl !== undefined ? overrideUrl : storedUrl).trim()
    const apiKey = (overrideApiKey !== undefined ? overrideApiKey : storedKey).trim()

    if (!rawUrl) {
      return {
        enabled,
        online: false,
        url: '',
        error: 'Nenhum endereço de servidor TrueNAS configurado.',
      }
    }

    // Auto-prepend https:// if protocol is missing
    const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`

    try {
      const cleanUrl = url.replace(/\/+$/, '')
      const infoUrl = `${cleanUrl}/api/v2.0/system/info`

      const headers: Record<string, string> = {
        Accept: 'application/json',
      }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const res = await this.fetchJson(infoUrl, headers)
      if (res.ok) {
        const info = res.data || {}
        let pools: string[] = []
        try {
          const poolRes = await this.fetchJson(`${cleanUrl}/api/v2.0/pool`, headers)
          if (poolRes.ok && Array.isArray(poolRes.data)) {
            pools = poolRes.data.map((p: any) => p.name).filter(Boolean)
          }
        } catch {
          // Pool listing is optional
        }

        return {
          enabled,
          online: true,
          url: cleanUrl,
          version: info.version || 'TrueNAS SCALE / Core',
          hostname: info.hostname || 'truenas',
          pools,
        }
      } else {
        return {
          enabled,
          online: false,
          url: cleanUrl,
          error: res.error || `HTTP ${res.status}: Não foi possível autenticar no TrueNAS.`,
        }
      }
    } catch (err: any) {
      logger.warn(`TrueNAS connection check failed: ${err.message}`)
      return {
        enabled,
        online: false,
        url,
        error: err.message || 'Falha na conexão com o servidor TrueNAS.',
      }
    }
  }

  private fetchJson(
    urlStr: string,
    headers: Record<string, string>
  ): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(urlStr)
        const isHttps = parsed.protocol === 'https:'
        const reqModule = isHttps ? https : http
        const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined

        const req = reqModule.request(
          urlStr,
          {
            method: 'GET',
            headers,
            agent,
            timeout: 5000,
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => (data += chunk))
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const json = JSON.parse(data)
                  resolve({ ok: true, status: res.statusCode, data: json })
                } catch {
                  resolve({ ok: true, status: res.statusCode, data: {} })
                }
              } else if (res.statusCode === 401 || res.statusCode === 403) {
                resolve({
                  ok: false,
                  status: res.statusCode || 401,
                  error: 'Chave de API inválida ou sem permissão de acesso no TrueNAS.',
                })
              } else {
                resolve({
                  ok: false,
                  status: res.statusCode || 500,
                  error: `Servidor retornou código HTTP ${res.statusCode}`,
                })
              }
            })
          }
        )

        req.on('timeout', () => {
          req.destroy()
          resolve({ ok: false, status: 408, error: 'Tempo limite esgotado ao conectar ao TrueNAS (5s).' })
        })

        req.on('error', (err) => {
          resolve({ ok: false, status: 500, error: err.message || 'Erro de rede ao conectar ao TrueNAS.' })
        })

        req.end()
      } catch (e: any) {
        resolve({ ok: false, status: 500, error: e.message || 'URL do TrueNAS inválida.' })
      }
    })
  }
}
