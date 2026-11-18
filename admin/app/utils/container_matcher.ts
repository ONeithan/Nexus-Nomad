export interface MatchableContainerInfo {
  name: string
  image?: string | null
  projectName?: string | null
  composeService?: string | null
  ports?: number[]
}

export interface MatchableServiceInfo {
  service_name: string
  container_image?: string | null
  friendly_name?: string | null
}

const CORE_INFRA_NAMES = new Set([
  'nomad_admin',
  'nomad-admin',
  'nomad_mysql',
  'nomad_redis',
  'nomad_dozzle',
  'nomad_updater',
  'nomad_disk_collector',
  'nomad_samba',
  'portainer',
  'portainer_agent',
  'portainer-ce',
])

const GENERIC_IMAGE_TAILS = new Set([
  'server',
  'web',
  'app',
  'data',
  'api',
  'client',
  'admin',
  'db',
  'redis',
  'postgres',
  'mysql',
  'nginx',
  'proxy',
  'node',
  'latest',
  'main',
])

const SERVICE_ALIASES: Record<string, string[]> = {
  jellyfin: ['jellyfin'],
  navidrome: ['navidrome'],
  komga: ['komga'],
  ollama: ['ollama'],
  open_webui: ['open-webui', 'openwebui', 'open_webui'],
  kolibri_2: ['kolibri'],
  kolibri: ['kolibri'],
  kiwix: ['kiwix', 'kiwix-serve', 'kiwix_serve'],
  kiwix_server: ['kiwix', 'kiwix-serve'],
  calibreweb: ['calibre-web', 'calibreweb', 'calibre_web'],
  stirling_pdf: ['stirling-pdf', 'stirlingpdf', 's-pdf', 'stirling'],
  vaultwarden: ['vaultwarden', 'bitwarden'],
  filebrowser: ['filebrowser', 'file-browser'],
  homeassistant: ['homeassistant', 'home-assistant'],
  uptime_kuma: ['uptime-kuma', 'uptimekuma'],
  nginx_proxy_manager: ['nginx-proxy-manager', 'jc21-nginx-proxy-manager'],
  adguard: ['adguardhome', 'adguard-home', 'adguard'],
  pihole: ['pihole', 'pi-hole'],
  immich: ['immich-server', 'immich_server', 'immich'],
  audiobookshelf: ['audiobookshelf'],
  syncthing: ['syncthing'],
  flatnotes: ['flatnotes'],
  cyberchef: ['cyberchef'],
  excalidraw: ['excalidraw'],
  it_tools: ['it-tools', 'ittools'],
  homebox: ['homebox'],
  metube: ['metube'],
  suwayomi: ['suwayomi', 'tachidesk'],
  meelo: ['meelo'],
  hedgedoc: ['hedgedoc'],
  duplicati: ['duplicati'],
  freshrss: ['freshrss'],
  linkding: ['linkding'],
  vikunja: ['vikunja'],
  planka: ['planka'],
  forgejo: ['forgejo', 'gitea'],
  homepage: ['homepage'],
  beszel: ['beszel'],
  dockge: ['dockge'],
  traccar: ['traccar'],
  meshcore_web: ['meshcore', 'meshcore-web'],
  meshtastic_web: ['meshtastic', 'meshtastic-web'],
}

export function normalizeCompactToken(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function extractImageRepoTail(image?: string | null): string {
  if (!image) return ''
  const withoutDigest = String(image).split('@')[0]
  const lastColon = withoutDigest.lastIndexOf(':')
  const lastSlash = withoutDigest.lastIndexOf('/')
  const repo = lastColon > lastSlash ? withoutDigest.slice(0, lastColon) : withoutDigest
  const tail = repo.split('/').pop() || repo
  return tail.toLowerCase()
}

export function getCatalogServiceTokens(svc: MatchableServiceInfo): {
  exactNames: Set<string>
  compactTokens: Set<string>
  imageRepo: string
  imageTail: string
} {
  const sName = String(svc.service_name || '').toLowerCase().trim()
  const bareName = sName.replace(/^nomad[-_]/, '').replace(/_2$/, '')
  const imageNoTag = String(svc.container_image || '').split('@')[0].split(':')[0].toLowerCase()
  const imageTail = extractImageRepoTail(svc.container_image)

  const exactNames = new Set<string>([sName, bareName, `nomad-${sName}`, `nomad_${sName}`, `nomad-${bareName}`, `nomad_${bareName}`])
  const compactTokens = new Set<string>()

  const addToken = (tok: string) => {
    const t = tok.toLowerCase().trim()
    if (!t) return
    exactNames.add(t)
    const compact = normalizeCompactToken(t)
    if (compact.length >= 4 && !GENERIC_IMAGE_TAILS.has(t)) {
      compactTokens.add(compact)
    }
  }

  addToken(sName)
  addToken(bareName)
  if (bareName !== sName.replace(/^nomad[-_]/, '')) {
    addToken(sName.replace(/^nomad[-_]/, ''))
  }
  const bareKey = bareName.replace(/-/g, '_')
  for (const alias of SERVICE_ALIASES[bareKey] || []) {
    addToken(alias)
  }
  for (const alias of SERVICE_ALIASES[sName.replace(/^nomad[-_]/, '').replace(/-/g, '_')] || []) {
    addToken(alias)
  }
  if (imageTail && !GENERIC_IMAGE_TAILS.has(imageTail) && imageTail.length >= 4) {
    addToken(imageTail)
  }

  return { exactNames, compactTokens, imageRepo: imageNoTag, imageTail }
}

export function isNomadManagedContainer(containerName: string, projectName?: string | null): boolean {
  const c = String(containerName || '').replace(/^\//, '').toLowerCase()
  const p = String(projectName || '').toLowerCase()
  return c.startsWith('nomad-') || c.startsWith('nomad_') || p.startsWith('nomad-') || p.startsWith('nomad_')
}

export function containerMatchesCatalogService(
  svc: MatchableServiceInfo,
  container: MatchableContainerInfo
): boolean {
  const cName = String(container.name || '').replace(/^\//, '').toLowerCase().trim()
  if (!cName || cName.endsWith('-init') || CORE_INFRA_NAMES.has(cName)) {
    return false
  }
  const cProj = String(container.projectName || '').toLowerCase().trim()
  const cSvc = String(container.composeService || '').toLowerCase().trim()
  const cImageFull = String(container.image || '').split('@')[0].split(':')[0].toLowerCase().trim()
  const cImageTail = extractImageRepoTail(container.image)

  const { exactNames, compactTokens, imageRepo } = getCatalogServiceTokens(svc)

  if (
    exactNames.has(cName) ||
    (cProj && exactNames.has(cProj)) ||
    (cSvc && exactNames.has(cSvc))
  ) {
    return true
  }

  if (imageRepo && cImageFull && (cImageFull === imageRepo || cImageFull.endsWith('/' + imageRepo))) {
    return true
  }

  const cNameCompact = normalizeCompactToken(cName.replace(/^nomad[-_]?/, ''))
  const cProjCompact = normalizeCompactToken(cProj.replace(/^nomad[-_]?/, ''))
  const cSvcCompact = normalizeCompactToken(cSvc.replace(/^nomad[-_]?/, ''))
  const cImgTailCompact = normalizeCompactToken(cImageTail)

  for (const tok of compactTokens) {
    if (
      cNameCompact === tok ||
      cProjCompact === tok ||
      cSvcCompact === tok ||
      (cImgTailCompact && !GENERIC_IMAGE_TAILS.has(cImageTail) && cImgTailCompact === tok)
    ) {
      return true
    }
    if (tok.length >= 5) {
      if (
        cNameCompact.includes(tok) ||
        cProjCompact.includes(tok) ||
        cSvcCompact.includes(tok)
      ) {
        return true
      }
    }
  }

  return false
}
