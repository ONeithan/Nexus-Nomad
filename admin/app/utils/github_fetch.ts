import axios from 'axios'
import dns from 'node:dns'
import https from 'node:https'
import { isNewerVersion } from './version.js'

const PUBLIC_DNS_SERVERS = ['1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4']

/**
 * Resolve IPv4 addresses for a hostname using public DNS (1.1.1.1 / 8.8.8.8)
 * and DNS-over-HTTPS (DoH) via direct IP so container /etc/resolv.conf
 * failures (EAI_AGAIN / ENOTFOUND on boot) never block GitHub checks.
 */
async function resolveIPv4WithFallback(hostname: string): Promise<string[]> {
  // 1. Try direct UDP/TCP DNS query against Cloudflare & Google DNS
  try {
    const resolver = new dns.promises.Resolver()
    resolver.setServers(PUBLIC_DNS_SERVERS)
    const ips = await resolver.resolve4(hostname)
    if (Array.isArray(ips) && ips.length > 0) {
      return ips
    }
  } catch {
    // Proceed to DoH fallback
  }

  // 2. Try DNS-over-HTTPS (DoH) directly to Cloudflare IP 1.1.1.1 (bypasses UDP port 53 & /etc/resolv.conf)
  const dohEndpoints = [
    {
      url: `https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
      servername: 'cloudflare-dns.com',
    },
    {
      url: `https://8.8.8.8/resolve?name=${encodeURIComponent(hostname)}&type=A`,
      servername: 'dns.google',
    },
  ]

  for (const endpoint of dohEndpoints) {
    try {
      const response = await axios.get(endpoint.url, {
        headers: { Accept: 'application/dns-json' },
        timeout: 4000,
        httpsAgent: new https.Agent({
          servername: endpoint.servername,
        }),
      })
      const answers = response.data?.Answer
      if (Array.isArray(answers)) {
        const ips = answers
          .filter((a: any) => a?.type === 1 && typeof a?.data === 'string')
          .map((a: any) => a.data.trim())
        if (ips.length > 0) {
          return ips
        }
      }
    } catch {
      // Try next DoH endpoint
    }
  }

  throw new Error(`Unable to resolve ${hostname} via system DNS, public DNS, or DoH`)
}

/**
 * Custom https.Agent that transparently falls back to public DNS (1.1.1.1 / 8.8.8.8)
 * and DNS-over-HTTPS if the container's OS resolver fails with EAI_AGAIN / ENOTFOUND.
 */
export const resilientGithubHttpsAgent = new https.Agent({
  keepAlive: true,
  lookup(hostname, options, callback: any) {
    dns.lookup(hostname, options as any, (err, address, family) => {
      if (!err && address) {
        return callback(null, address, family)
      }

      resolveIPv4WithFallback(hostname)
        .then((ips) => {
          const wantAll = typeof options === 'object' && options !== null && (options as any).all
          if (wantAll) {
            return callback(
              null,
              ips.map((ip) => ({ address: ip, family: 4 }))
            )
          }
          return callback(null, ips[0], 4)
        })
        .catch(() => {
          // Return original dns.lookup error if all fallbacks failed
          return callback(err || new Error(`DNS lookup failed for ${hostname}`))
        })
    })
  },
})

const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'Nexus-NOMAD-Updater',
}

export async function fetchGithubJson<T = any>(url: string, timeout = 7000): Promise<T> {
  const response = await axios.get<T>(url, {
    headers: GITHUB_HEADERS,
    timeout,
    httpsAgent: resilientGithubHttpsAgent,
  })
  return response.data
}

/**
 * Fetch the latest Nexus NOMAD version from GitHub using a 4-layer fallback strategy:
 * 1. GitHub REST API `/releases/latest` (or `/releases` when earlyAccess is enabled)
 * 2. GitHub REST API `/releases` list (selects highest non-draft release)
 * 3. GitHub REST API `/tags` list (selects highest semver tag)
 * 4. GitHub web redirect `https://github.com/ONeithan/Nexus-Nomad/releases/latest`
 *    (immune to GitHub REST API rate limits)
 */
export async function fetchLatestNexusVersion(earlyAccess = false): Promise<string> {
  const errors: string[] = []

  // Strategy 1: /releases/latest (when !earlyAccess)
  if (!earlyAccess) {
    try {
      const data = await fetchGithubJson<{ tag_name?: string; draft?: boolean; prerelease?: boolean }>(
        'https://api.github.com/repos/ONeithan/Nexus-Nomad/releases/latest'
      )
      if (data?.tag_name && !data.draft && !data.prerelease) {
        const clean = data.tag_name.replace(/^v/i, '').trim()
        if (clean) return clean
      }
    } catch (err: any) {
      errors.push(`releases/latest: ${err?.message || err}`)
    }
  }

  // Strategy 2: /releases list (picks highest eligible version)
  try {
    const releases = await fetchGithubJson<
      Array<{ tag_name?: string; draft?: boolean; prerelease?: boolean }>
    >('https://api.github.com/repos/ONeithan/Nexus-Nomad/releases?per_page=20')

    if (Array.isArray(releases) && releases.length > 0) {
      let best = ''
      for (const rel of releases) {
        if (!rel?.tag_name || rel.draft) continue
        if (!earlyAccess && rel.prerelease) continue
        const candidate = rel.tag_name.replace(/^v/i, '').trim()
        if (!candidate) continue
        if (!best || isNewerVersion(candidate, best, earlyAccess)) {
          best = candidate
        }
      }
      if (best) return best
    }
  } catch (err: any) {
    errors.push(`releases: ${err?.message || err}`)
  }

  // Strategy 3: Web redirect on github.com/ONeithan/Nexus-Nomad/releases/latest (no API rate limit)
  if (!earlyAccess) {
    try {
      const resp = await axios.get('https://github.com/ONeithan/Nexus-Nomad/releases/latest', {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 7000,
        httpsAgent: resilientGithubHttpsAgent,
        headers: { 'User-Agent': 'Nexus-NOMAD-Updater' },
      })
      const location = String(resp.headers?.location || '')
      const match = location.match(/\/releases\/tag\/v?([^/?#]+)/i)
      if (match?.[1]) {
        return decodeURIComponent(match[1]).replace(/^v/i, '').trim()
      }
    } catch (err: any) {
      errors.push(`web-redirect: ${err?.message || err}`)
    }
  }

  // Strategy 4: /tags list (picks highest semver tag)
  try {
    const tags = await fetchGithubJson<Array<{ name?: string }>>(
      'https://api.github.com/repos/ONeithan/Nexus-Nomad/tags?per_page=30'
    )
    if (Array.isArray(tags) && tags.length > 0) {
      let best = ''
      for (const t of tags) {
        const candidate = (t?.name || '').replace(/^v/i, '').trim()
        if (!candidate) continue
        if (!best || isNewerVersion(candidate, best, earlyAccess)) {
          best = candidate
        }
      }
      if (best) return best
    }
  } catch (err: any) {
    errors.push(`tags: ${err?.message || err}`)
  }

  throw new Error(`Falha ao consultar versões no GitHub (${errors.join(' | ')})`)
}

