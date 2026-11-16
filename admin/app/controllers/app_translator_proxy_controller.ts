import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import { SERVICE_NAMES } from '../../constants/service_names.js'

const APP_MAP: Record<string, { serviceName: string; defaultPort: string }> = {
  'it-tools': { serviceName: SERVICE_NAMES.IT_TOOLS, defaultPort: '8430' },
  'cyberchef': { serviceName: SERVICE_NAMES.CYBERCHEF, defaultPort: '8100' },
  'flatnotes': { serviceName: SERVICE_NAMES.FLATNOTES, defaultPort: '8200' },
}

export default class AppTranslatorProxyController {
  public async handle({ params, request, response }: HttpContext) {
    const appKey = String(params.app || '').toLowerCase()
    const mapping = APP_MAP[appKey]
    if (!mapping) {
      return response.status(404).send('Aplicativo não suportado pelo proxy PT-BR.')
    }

    const service = await Service.findBy('service_name', mapping.serviceName)
    const reqHost = request.hostname() || '127.0.0.1'
    let baseUrl = `http://${reqHost}:${mapping.defaultPort}`
    if (service?.custom_url && /^https?:\/\//i.test(service.custom_url)) {
      baseUrl = service.custom_url.replace(/\/+$/, '')
    } else if (service?.ui_location && /^https?:\/\//i.test(service.ui_location)) {
      baseUrl = service.ui_location.replace(/\/+$/, '')
    } else if (service?.ui_location && /^\d+$/.test(service.ui_location)) {
      baseUrl = `http://${reqHost}:${service.ui_location}`
    }

    const wildcardParts = Array.isArray(params['*']) ? params['*'] : []
    const subPath = wildcardParts.length > 0 ? `/${wildcardParts.join('/')}` : '/'
    const queryIdx = request.completeUrl(true).indexOf('?')
    const querySuffix = queryIdx >= 0 ? request.completeUrl(true).slice(queryIdx) : ''
    const targetUrl = `${baseUrl}${subPath}${querySuffix}`

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method(),
        headers: {
          'accept': request.header('accept') || '*/*',
          'accept-encoding': 'identity',
          'user-agent': request.header('user-agent') || 'NOMAD-PTBR-Proxy/1.0',
        },
        redirect: 'follow',
      })

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
      response.status(upstream.status)
      response.header('content-type', contentType)

      if (contentType.includes('text/html')) {
        let html = await upstream.text()
        const prefix = `/apps-pt/${appKey}`

        // Garante base href e reescreve caminhos absolutos comuns para passar pelo proxy PT-BR
        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${prefix}/">`)
        } else {
          html = `<base href="${prefix}/">${html}`
        }

        html = html
          .replace(/(src|href)=["']\/(?!apps-pt\/|nomad-i18n-bridge\.js|\/)/gi, `$1="${prefix}/`)
          .replace(/from\s+["']\/(?!apps-pt\/)/gi, `from "${prefix}/`)

        const bridgeTag = `<script src="/nomad-i18n-bridge.js" defer></script>`
        if (/<\/body>/i.test(html)) {
          html = html.replace(/<\/body>/i, `${bridgeTag}</body>`)
        } else {
          html += bridgeTag
        }

        return response.send(html)
      }

      const arrayBuffer = await upstream.arrayBuffer()
      return response.send(Buffer.from(arrayBuffer))
    } catch (error: any) {
      return response.status(502).type('text/html').send(`
        <div style="font-family:sans-serif;padding:32px;background:#111;color:#eee;min-height:100vh">
          <h2>Não foi possível conectar ao aplicativo (${appKey})</h2>
          <p>Verifique se o contêiner está instalado e em execução em <code>${baseUrl}</code>.</p>
          <p style="color:#aaa;font-size:13px">${error?.message || 'Erro de conexão'}</p>
        </div>
      `)
    }
  }
}

