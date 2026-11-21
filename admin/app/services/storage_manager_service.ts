import {
  readdir,
  stat,
  lstat,
  readlink,
  realpath,
  mkdir,
  rename,
  rm,
  symlink,
  cp,
  statfs,
  readFile,
} from 'node:fs/promises'
import os from 'node:os'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import si from 'systeminformation'
import logger from '@adonisjs/core/services/logger'
import KVStore from '#models/kv_store'
import { DockerService } from './docker_service.js'

export interface DiskQuotaEntry {
  enabled: boolean
  limitBytes: number
}

export interface ExternalMountItem {
  sourceType: 'jellyfin' | 'container' | 'network' | 'truenas'
  label: string
  containerName?: string
  containerDest?: string
  hostOrNetworkPath: string
  moduleKey?: string
  state?: string
  originLabel?: string
  totalBytes?: number
  freeBytes?: number
}

export interface ModuleLocationStatus {
  key: string
  containerPath: string
  exists: boolean
  isSymlink: boolean
  realPath: string
  realHostPath: string
  currentDiskPath: string
  currentDiskLabel: string
  sizeBytes: number
  fileCount: number
  externalSources: ExternalMountItem[]
}

export interface FolderUsageItem {
  name: string
  label: string
  path: string
  realPath?: string
  isSymlink?: boolean
  targetDiskLabel?: string
  targetDiskPath?: string
  sizeBytes: number
  fileCount: number
}

export interface StorageFileEntry {
  name: string
  path: string
  isDirectory: boolean
  isSymlink: boolean
  resolvedTarget?: string
  targetDiskLabel?: string
  sizeBytes: number
  modifiedAt: string
}

const FOLDER_LABELS: Record<string, string> = {
  zim: 'Biblioteca ZIM (Kiwix / Wikipédia)',
  books: 'Livros & E-books (Calibre-Web)',
  maps: 'Mapas Vetoriais Offline (PMTiles)',
  media: 'Mídia, Filmes & Séries (Jellyfin)',
  kb_uploads: 'Base de Conhecimento RAG / Documentos',
  ollama: 'Modelos de IA Local (Ollama)',
  kolibri: 'Plataforma Educacional (Kolibri Gen1)',
  'kolibri-gen2': 'Plataforma Educacional (Kolibri Gen2)',
  'stirling-pdf': 'Stirling PDF (Configs & Arquivos)',
  filebrowser: 'Gerenciador de Arquivos (FileBrowser)',
  calibreweb: 'Calibre-Web (Configurações)',
}

const SAMBA_CONTAINER_NAME = 'nomad_samba'
const MIN_PRIMARY_SYSTEM_RESERVE_BYTES = 20 * 1024 ** 3 // 20 GiB mínimos livres para o sistema

export class StorageManagerService {
  private _allowedRootsCache: Set<string> | null = null

  private getStorageRoot(): string {
    return resolve(process.cwd(), 'storage')
  }

  private async getAdminContainerBinds(): Promise<Array<{ source: string; destination: string }>> {
    try {
      const dockerService = new DockerService()
      const docker = (dockerService as any).docker
      if (!docker) return []
      const containers = await docker.listContainers({ all: true })
      const hn = os.hostname()
      const adminCont =
        containers.find((c: any) => hn && c.Id?.startsWith(hn)) ||
        containers.find((c: any) =>
          c.Names?.some((n: string) => n === '/nomad_admin' || n.includes('nomad_admin'))
        )
      if (!adminCont?.Id) return []
      const inspected = await docker.getContainer(adminCont.Id).inspect()
      const binds = (inspected?.Mounts || [])
        .filter(
          (m: any) =>
            m.Type === 'bind' &&
            m.Source &&
            m.Destination &&
            !String(m.Destination).startsWith('/app/update') &&
            !String(m.Source).startsWith('/app/update')
        )
        .map((m: any) => ({ source: String(m.Source), destination: String(m.Destination) }))
        .sort((a: { destination: string }, b: { destination: string }) => b.destination.length - a.destination.length)
      return binds
    } catch {
      return []
    }
  }

  public async resolveRealHostPath(containerOrHostPath: string): Promise<string> {
    const raw = (containerOrHostPath || '').trim() || this.getStorageRoot()
    const storageRoot = this.getStorageRoot()
    const normalizedInput =
      raw === '/storage' || raw.startsWith('/storage/')
        ? raw.replace(/^\/storage/, storageRoot)
        : resolve(raw)
    const binds = await this.getAdminContainerBinds()

    for (const b of binds) {
      const dest = resolve(b.destination)
      if (dest.startsWith('/app/update') || b.source.startsWith('/app/update')) continue
      if (normalizedInput === dest) return b.source
      if (normalizedInput.startsWith(dest + '/') || normalizedInput.startsWith(dest + '\\')) {
        const rel = normalizedInput.slice(dest.length).replace(/^[\\/]+/, '')
        return rel ? join(b.source, rel) : b.source
      }
    }

    // Fallback using DockerService's host storage root resolver for /app/storage paths
    if (normalizedInput === storageRoot || normalizedInput.startsWith(storageRoot + '/')) {
      try {
        const dockerService = new DockerService()
        const hostRoot = await dockerService.getHostStorageRoot()
        if (hostRoot && !hostRoot.startsWith('/app/update')) {
          const rel = normalizedInput.slice(storageRoot.length).replace(/^[\\/]+/, '')
          return rel ? join(hostRoot, rel) : hostRoot
        }
      } catch {}
    }

    return normalizedInput
  }

  public async getDiskQuotas(): Promise<Record<string, DiskQuotaEntry>> {
    try {
      const raw = await KVStore.getValue('storage.diskQuotas')
      if (!raw || typeof raw !== 'string') return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  public async setDiskQuota(params: {
    path: string
    enabled: boolean
    limitGb: number
  }): Promise<Record<string, DiskQuotaEntry>> {
    const targetPath = resolve(params.path)
    const quotas = await this.getDiskQuotas()

    const overview = await this.getStorageOverview()
    const disk = overview.mountTargets.find(
      (m) => resolve(m.path) === targetPath || m.realHostPath === params.path
    )
    const totalBytes = disk?.totalBytes || 0
    const usedBytes = disk ? Math.max(0, disk.totalBytes - disk.freeBytes) : 0
    const minReserve = disk?.isPrimary
      ? Math.min(MIN_PRIMARY_SYSTEM_RESERVE_BYTES, Math.floor(totalBytes * 0.1))
      : 0

    let limitBytes = Math.round(Math.max(1, Number(params.limitGb) || 1) * 1024 ** 3)
    if (totalBytes > 0) {
      const maxAllowed = Math.max(1024 ** 3, totalBytes - minReserve)
      limitBytes = Math.min(limitBytes, maxAllowed)
      limitBytes = Math.max(limitBytes, Math.min(usedBytes + 1024 ** 3, maxAllowed))
    }

    quotas[targetPath] = {
      enabled: Boolean(params.enabled),
      limitBytes,
    }
    await KVStore.setValue('storage.diskQuotas', JSON.stringify(quotas))
    return quotas
  }

  public findDiskForResolvedPath<T extends { label: string; path: string; realHostPath?: string }>(
    resolvedPath: string,
    mountTargets: T[]
  ): T | null {
    const sorted = [...mountTargets].sort((a, b) => b.path.length - a.path.length)
    for (const mt of sorted) {
      const mtRes = resolve(mt.path)
      if (
        resolvedPath === mtRes ||
        resolvedPath.startsWith(mtRes + '/') ||
        resolvedPath.startsWith(mtRes + '\\') ||
        (mt.realHostPath &&
          (resolvedPath === mt.realHostPath || resolvedPath.startsWith(mt.realHostPath + '/')))
      ) {
        return mt
      }
    }
    return null
  }

  private async readNomadDiskInfo(): Promise<{
    diskLayout?: { blockdevices?: any[] }
    fsSize?: Array<{ fs: string; size: number; used: number; available: number; use: number; mount: string }>
  } | null> {
    const candidates = [
      join(this.getStorageRoot(), 'nomad-disk-info.json'),
      '/storage/nomad-disk-info.json',
      '/tmp/nomad-disk-info.json',
      join(process.cwd(), 'storage', 'nomad-disk-info.json'),
    ]
    for (const p of candidates) {
      if (existsSync(p)) {
        try {
          const content = await readFile(p, 'utf8')
          const parsed = JSON.parse(content)
          if (parsed && (parsed.fsSize || parsed.diskLayout)) {
            return parsed
          }
        } catch {}
      }
    }
    return null
  }

  private async getAllowedRoots(): Promise<string[]> {
    if (this._allowedRootsCache && this._allowedRootsCache.size > 0) {
      return Array.from(this._allowedRootsCache)
    }
    const roots = new Set<string>([resolve(this.getStorageRoot())])
    const candidateDirs = ['/mnt', '/media', '/run/media', '/data', '/disks', '/volumes']
    for (const d of candidateDirs) {
      if (existsSync(d)) roots.add(resolve(d))
    }

    try {
      const hostInfo = await this.readNomadDiskInfo()
      if (hostInfo?.fsSize) {
        for (const fs of hostInfo.fsSize) {
          if (
            fs.mount &&
            !fs.mount.startsWith('/sys') &&
            !fs.mount.startsWith('/proc') &&
            !fs.mount.startsWith('/dev') &&
            !fs.mount.startsWith('/app/update')
          ) {
            roots.add(resolve(fs.mount))
          }
        }
      }

      const fsSizes = await si.fsSize().catch(() => [])
      for (const fs of fsSizes) {
        if (
          fs.mount &&
          !fs.mount.startsWith('/sys') &&
          !fs.mount.startsWith('/proc') &&
          !fs.mount.startsWith('/dev') &&
          !fs.mount.startsWith('/app/update')
        ) {
          roots.add(resolve(fs.mount))
        }
      }
    } catch {}

    const preferredDisk = await KVStore.getValue('storage.preferredDownloadDisk')
    if (preferredDisk && typeof preferredDisk === 'string' && preferredDisk.trim()) {
      roots.add(resolve(preferredDisk.trim()))
    }

    this._allowedRootsCache = roots
    return Array.from(roots)
  }

  private async isPathAllowed(targetPath: string): Promise<boolean> {
    const resolved = resolve(targetPath)
    const allowed = await this.getAllowedRoots()
    return allowed.some(
      (root) =>
        resolved === root ||
        resolved.startsWith(`${root}/`) ||
        resolved.startsWith(`${root}\\`) ||
        // Windows drive root check: e.g. D:\path starting with D:
        (root.endsWith(':') && resolved.toUpperCase().startsWith(root.toUpperCase()))
    )
  }

  private async getDirStats(dirPath: string, depth = 0): Promise<{ sizeBytes: number; fileCount: number }> {
    if (!existsSync(dirPath) || depth > 8) {
      return { sizeBytes: 0, fileCount: 0 }
    }
    let sizeBytes = 0
    let fileCount = 0
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const full = join(dirPath, entry.name)
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          const sub = await this.getDirStats(full, depth + 1)
          sizeBytes += sub.sizeBytes
          fileCount += sub.fileCount
        } else if (entry.isFile()) {
          try {
            const st = await stat(full)
            sizeBytes += st.size
            fileCount += 1
          } catch {
            // ignore unreadable file
          }
        }
      }
    } catch {
      // ignore permission errors
    }
    return { sizeBytes, fileCount }
  }

  async getStorageOverview() {
    const storageRoot = this.getStorageRoot()

    // Discover all physical disks and mounted filesystems on the system
    const mountTargets: Array<{
      label: string
      path: string
      freeBytes: number
      totalBytes: number
      usedBytes?: number
      isPrimary?: boolean
      diskType?: string
      realHostPath?: string
      quotaEnabled?: boolean
      quotaLimitBytes?: number
      reserveSystemBytes?: number
      effectiveFreeBytes?: number
    }> = []

    // 1. Primary storage root
    let primaryFree = 0
    let primaryTotal = 0
    try {
      const fsStats = await statfs(storageRoot)
      primaryTotal = Number(fsStats.blocks) * Number(fsStats.bsize)
      primaryFree = Number(fsStats.bavail) * Number(fsStats.bsize)
    } catch {}

    mountTargets.push({
      label: `Armazenamento Interno NOMAD (storage)`,
      path: storageRoot,
      freeBytes: primaryFree,
      totalBytes: primaryTotal,
      isPrimary: true,
      diskType: 'Sistema',
    })

    // 2. Discover filesystems and host disks from nomad-disk-info.json (host collector sidecar)
    const hostDiskInfo = await this.readNomadDiskInfo()
    const unmountedDisks: Array<{ name: string; size: string; model: string; vendor: string }> = []
    let rootDevPrefix = ''

    if (hostDiskInfo) {
      const hostFsList = hostDiskInfo.fsSize || []
      const hostBlockDevices = hostDiskInfo.diskLayout?.blockdevices || []

      // Identifica o prefixo do dispositivo raiz do sistema para não duplicar partições do mesmo disco
      const rootFsEntry = hostFsList.find((f) => f.mount === '/' || resolve(f.mount) === resolve(storageRoot))
      rootDevPrefix = rootFsEntry ? rootFsEntry.fs.replace(/[0-9]+$/, '').replace(/p$/, '') : ''

      for (const fs of hostFsList) {
        if (!fs.size || fs.size <= 0) continue
        if (
          fs.mount === '/' ||
          fs.mount.startsWith('/boot') ||
          fs.mount.startsWith('/sys') ||
          fs.mount.startsWith('/proc') ||
          fs.mount.startsWith('/dev') ||
          fs.mount.startsWith('/app/update') ||
          fs.mount.startsWith('/etc')
        ) {
          continue
        }

        // Se a partição pertencer ao mesmo disco físico do sistema operacional, ignora como secundário
        if (rootDevPrefix && fs.fs.startsWith(rootDevPrefix)) {
          continue
        }

        const resolvedMount = resolve(fs.mount)
        const resolvedStorageRoot = resolve(storageRoot)
        if (
          resolvedMount === resolvedStorageRoot ||
          resolvedStorageRoot.startsWith(resolvedMount + '/') ||
          resolvedStorageRoot.startsWith(resolvedMount + '\\')
        ) {
          continue
        }

        if (mountTargets.some((m) => resolve(m.path) === resolvedMount)) continue

        let diskModel = ''
        let diskVendor = ''
        let diskName = ''
        for (const dev of hostBlockDevices) {
          if (dev.name && (fs.fs.includes(dev.name) || dev.name === fs.fs)) {
            diskName = dev.name
            diskModel = dev.model || ''
            diskVendor = dev.vendor || ''
            break
          }
          if (dev.children && Array.isArray(dev.children)) {
            for (const child of dev.children) {
              if (child.name && (fs.fs.includes(child.name) || child.name === fs.fs)) {
                diskName = dev.name
                diskModel = dev.model || ''
                diskVendor = dev.vendor || ''
                break
              }
            }
          }
        }

        const desc = [diskVendor, diskModel, diskName].filter(Boolean).join(' ') || fs.fs || 'Disco Local'
        mountTargets.push({
          label: `Disco Secundário (${fs.mount}) • ${desc}`,
          path: fs.mount,
          freeBytes: fs.available || Math.max(0, fs.size - fs.used),
          totalBytes: fs.size,
          isPrimary: false,
          diskType: 'HD Secundário',
        })
      }

      // Check for unmounted physical disks on the host
      for (const dev of hostBlockDevices) {
        if (dev.type === 'disk' && dev.name) {
          const hasMountedChild = hostFsList.some((fs) => fs.fs.includes(dev.name))
          if (!hasMountedChild && dev.size) {
            unmountedDisks.push({
              name: dev.name,
              size: String(dev.size),
              model: dev.model || 'Disco Local',
              vendor: dev.vendor || '',
            })
          }
        }
      }
    }

    // 3. Discover filesystems and physical disks via systeminformation
    try {
      const [fsSizes, diskLayout, blockDevices] = await Promise.all([
        si.fsSize().catch(() => []),
        si.diskLayout().catch(() => []),
        si.blockDevices().catch(() => []),
      ])

      const ignoredTypes = new Set([
        'tmpfs',
        'devtmpfs',
        'overlay',
        'squashfs',
        'shm',
        'proc',
        'sysfs',
        'cgroup',
        'devpts',
        'mqueue',
        'none',
        'rootfs',
      ])

      for (const fs of fsSizes) {
        if (!fs.size || fs.size <= 0) continue
        if (ignoredTypes.has(fs.type?.toLowerCase())) continue
        if (
          fs.mount === '/' ||
          fs.mount.startsWith('/boot') ||
          fs.mount.startsWith('/sys') ||
          fs.mount.startsWith('/proc') ||
          fs.mount.startsWith('/dev') ||
          fs.mount.startsWith('/app/update') ||
          fs.mount.startsWith('/etc')
        )
          continue
        if (fs.mount.startsWith('/app/') && resolve(fs.mount) !== resolve(storageRoot)) continue
        if (rootDevPrefix && fs.fs.startsWith(rootDevPrefix)) continue

        const resolvedMount = resolve(fs.mount)
        const resolvedStorageRoot = resolve(storageRoot)

        // If this filesystem is the one hosting storageRoot, update its label if helpful, but don't duplicate
        if (
          resolvedMount === resolvedStorageRoot ||
          resolvedStorageRoot.startsWith(resolvedMount + '/') ||
          resolvedStorageRoot.startsWith(resolvedMount + '\\')
        ) {
          const matchingDisk = diskLayout.find((d: any) => d.name && (fs.fs.includes(d.name) || d.device === fs.fs))
          if (matchingDisk) {
            const diskName = matchingDisk.vendor ? `${matchingDisk.vendor} ${matchingDisk.name}` : matchingDisk.name
            mountTargets[0].label = `Armazenamento Interno NOMAD (${fs.mount}) • ${diskName}`
            mountTargets[0].diskType = matchingDisk.interfaceType || (matchingDisk.type === 'NVMe' ? 'NVMe' : 'SSD')
          }
          continue
        }

        // Already added?
        if (mountTargets.some((m) => resolve(m.path) === resolvedMount)) continue

        // Find disk model / info for this secondary filesystem
        const matchingBlk = blockDevices.find(
          (b: any) => b.name === fs.fs || b.mount === fs.mount || (b.label && fs.fs.includes(b.label))
        )
        const matchingDl = diskLayout.find(
          (d: any) => (d.name && fs.fs.includes(d.name)) || (matchingBlk && matchingBlk.device === d.device)
        )

        let diskDesc = ''
        let typeBadge = 'Disco Secundário'
        if (matchingDl) {
          const vendor = matchingDl.vendor ? `${matchingDl.vendor} ` : ''
          diskDesc = `${vendor}${matchingDl.name}`.trim()
          typeBadge = matchingDl.interfaceType || matchingDl.type || (matchingBlk?.removable ? 'USB' : 'HD')
        } else if (matchingBlk?.label) {
          diskDesc = matchingBlk.label
        } else {
          diskDesc = fs.fs || 'Disco Local'
        }

        mountTargets.push({
          label: `Disco Secundário (${fs.mount}) • ${diskDesc}`,
          path: fs.mount,
          freeBytes: fs.available || Math.max(0, fs.size - fs.used),
          totalBytes: fs.size,
          isPrimary: false,
          diskType: typeBadge,
        })
      }
    } catch (err: any) {
      logger.warn(`[StorageManager] systeminformation disk scan warning: ${err.message}`)
    }

    // 4. Scan directory candidate mounts (/mnt/*, /media/*, /run/media/*, /data, /disks/*, /volumes/*)
    const { stat: fsStat } = await import('node:fs/promises')
    const candidateDirs = ['/mnt', '/media', '/run/media', '/data', '/disks', '/volumes']
    for (const baseDir of candidateDirs) {
      if (!existsSync(baseDir)) continue
      try {
        const baseStat = await fsStat(baseDir).catch(() => null)
        const entries = await readdir(baseDir, { withFileTypes: true }).catch(() => [])
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const fullPath = join(baseDir, entry.name)
          const resolvedPath = resolve(fullPath)
          if (mountTargets.some((m) => resolve(m.path) === resolvedPath)) continue

          try {
            // Skip plain subdirectories that share the same filesystem device as baseDir (not separate mounts)
            const entryStat = await fsStat(fullPath).catch(() => null)
            if (baseStat && entryStat && entryStat.dev === baseStat.dev) continue

            const fsStats = await statfs(fullPath)
            const totalBytes = Number(fsStats.blocks) * Number(fsStats.bsize)
            const freeBytes = Number(fsStats.bavail) * Number(fsStats.bsize)
            // Ignore tiny virtual/boot partitions smaller than 1 GiB
            if (totalBytes >= 1024 * 1024 * 1024) {
              mountTargets.push({
                label: `Disco Secundário (${fullPath})`,
                path: fullPath,
                freeBytes,
                totalBytes,
                isPrimary: false,
                diskType: 'Ponto de Montagem',
              })
            }
          } catch {}
        }
      } catch {}
    }

    // Update allowed roots cache so all discovered targets are permitted
    const newAllowedRoots = new Set<string>([resolve(storageRoot)])
    for (const mt of mountTargets) {
      newAllowedRoots.add(resolve(mt.path))
    }
    this._allowedRootsCache = newAllowedRoots

    const [preferredDownloadDiskRaw, diskQuotas] = await Promise.all([
      KVStore.getValue('storage.preferredDownloadDisk'),
      this.getDiskQuotas(),
    ])

    for (const mt of mountTargets) {
      mt.usedBytes = Math.max(0, mt.totalBytes - mt.freeBytes)
      let hostPath = await this.resolveRealHostPath(mt.path)
      // Never display a secondary disk's mount path as the primary disk's host path
      // unless their free space actually matches (same underlying partition)
      if (mt.isPrimary) {
        const collidesWithSecondary = mountTargets
          .filter((other) => !other.isPrimary)
          .find((other) => {
            const matchesPath =
              hostPath === other.path || hostPath.startsWith(other.path + '/')
            const freeDiff = Math.abs((mt.freeBytes || 0) - (other.freeBytes || 0))
            return matchesPath && freeDiff > 512 * 1024 * 1024
          })
        if (collidesWithSecondary || hostPath.startsWith('/app/update')) {
          hostPath = '/opt/project-nomad/storage'
        }
      }
      mt.realHostPath = hostPath
      const q = diskQuotas[resolve(mt.path)] || diskQuotas[mt.path]
      const minReserve = mt.isPrimary
        ? Math.min(MIN_PRIMARY_SYSTEM_RESERVE_BYTES, Math.floor(mt.totalBytes * 0.1))
        : 0
      mt.reserveSystemBytes = minReserve
      mt.quotaEnabled = Boolean(q?.enabled)
      const safeCap = Math.max(0, mt.totalBytes - minReserve)
      mt.quotaLimitBytes =
        mt.quotaEnabled && q?.limitBytes > 0 ? Math.min(q.limitBytes, safeCap) : safeCap
      mt.effectiveFreeBytes = mt.quotaEnabled
        ? Math.max(0, Math.min(mt.freeBytes, mt.quotaLimitBytes - mt.usedBytes))
        : mt.freeBytes
    }

    const rawPref = typeof preferredDownloadDiskRaw === 'string' ? preferredDownloadDiskRaw.trim() : ''
    const matchedPreferredDisk = rawPref
      ? mountTargets.find(
          (m) =>
            resolve(m.path) === resolve(rawPref) ||
            (m.realHostPath && resolve(m.realHostPath) === resolve(rawPref))
        ) || this.findDiskForResolvedPath(resolve(rawPref), mountTargets)
      : null
    const preferredDownloadDisk = matchedPreferredDisk?.path || mountTargets[0]?.path || storageRoot

    const folderUsage: FolderUsageItem[] = []
    if (existsSync(storageRoot)) {
      const entries = await readdir(storageRoot, { withFileTypes: true }).catch(() => [])
      for (const entry of entries) {
        const fullPath = join(storageRoot, entry.name)
        const isSym = entry.isSymbolicLink()
        let isDir = entry.isDirectory()
        let resolvedRealPath = fullPath
        if (isSym) {
          const st = await stat(fullPath).catch(() => null)
          isDir = Boolean(st?.isDirectory())
          if (isDir) {
            resolvedRealPath = await realpath(fullPath).catch(() => fullPath)
          }
        }
        if (!isDir) continue
        const stats = await this.getDirStats(resolvedRealPath)
        const diskMatch = this.findDiskForResolvedPath(resolvedRealPath, mountTargets)
        folderUsage.push({
          name: entry.name,
          label: FOLDER_LABELS[entry.name] || entry.name,
          path: fullPath,
          realPath: resolvedRealPath,
          isSymlink: isSym,
          targetDiskLabel: diskMatch?.label,
          targetDiskPath: diskMatch?.path,
          sizeBytes: stats.sizeBytes,
          fileCount: stats.fileCount,
        })
      }
    }
    folderUsage.sort((a, b) => b.sizeBytes - a.sizeBytes)

    const externalMounts = await this.collectExternalAndNetworkMounts(storageRoot)

    const CORE_MODULE_KEYS = ['zim', 'maps', 'kolibri-gen2', 'ollama', 'books', 'media', 'kb_uploads']
    const moduleLocations: Record<string, ModuleLocationStatus> = {}

    for (const modKey of CORE_MODULE_KEYS) {
      const existing = folderUsage.find((f) => f.name === modKey)
      const defaultPath = join(storageRoot, modKey)
      let realPath = existing?.realPath || defaultPath
      let isSymlink = Boolean(existing?.isSymlink)
      const exists = Boolean(existing) || existsSync(defaultPath)

      if (!existing && exists) {
        const lst = await lstat(defaultPath).catch(() => null)
        if (lst?.isSymbolicLink()) {
          isSymlink = true
          realPath = await realpath(defaultPath).catch(() => defaultPath)
        }
      }

      const diskMatch =
        this.findDiskForResolvedPath(realPath, mountTargets) ||
        mountTargets[0] || { path: storageRoot, label: 'Armazenamento Interno NOMAD', isPrimary: true }
      let realHostPath = await this.resolveRealHostPath(realPath)
      if (realHostPath.startsWith('/app/update')) {
        realHostPath = join(mountTargets[0]?.realHostPath || '/opt/project-nomad/storage', modKey)
      }

      const matchingExternal = externalMounts.filter((em) => em.moduleKey === modKey)

      moduleLocations[modKey] = {
        key: modKey,
        containerPath: defaultPath,
        exists,
        isSymlink: Boolean(isSymlink && !diskMatch.isPrimary),
        realPath,
        realHostPath,
        currentDiskPath: diskMatch.path,
        currentDiskLabel: diskMatch.label,
        sizeBytes: existing?.sizeBytes ?? 0,
        fileCount: existing?.fileCount ?? 0,
        externalSources: matchingExternal,
      }
    }

    return {
      storageRoot,
      preferredDownloadDisk,
      diskQuotas,
      folderUsage,
      mountTargets,
      unmountedDisks,
      externalMounts,
      moduleLocations,
    }
  }

  /**
   * Discovers mounts inside Local Docker & Portainer containers (especially Jellyfin),
   * network filesystems in /proc/mounts (CIFS/NFS/SMB3), Jellyfin XML library folders,
   * and configured TrueNAS shares.
   */
  private async collectExternalAndNetworkMounts(storageRoot: string): Promise<ExternalMountItem[]> {
    const items: ExternalMountItem[] = []
    const seen = new Set<string>()
    const addUnique = (item: ExternalMountItem) => {
      const key = `${item.sourceType}|${item.containerName || ''}|${item.containerDest || ''}|${item.hostOrNetworkPath}`
      if (seen.has(key)) return
      seen.add(key)
      items.push(item)
    }

    const inferModuleKey = (containerName: string, dest: string, src: string): string | undefined => {
      const lcName = containerName.toLowerCase()
      const lcDest = dest.toLowerCase()
      const lcSrc = src.toLowerCase()
      if (
        lcName.includes('jellyfin') ||
        lcDest.includes('/media') ||
        lcDest.includes('/movies') ||
        lcDest.includes('/tv') ||
        lcDest.includes('/shows') ||
        lcDest.includes('/series') ||
        lcDest.includes('/filmes') ||
        lcDest.includes('/music')
      ) {
        return 'media'
      }
      if (lcName.includes('kiwix') || lcDest.includes('/zim')) return 'zim'
      if (lcName.includes('kolibri') || lcSrc.includes('kolibri')) return 'kolibri-gen2'
      if (lcName.includes('ollama') || lcSrc.includes('ollama')) return 'ollama'
      if (lcName.includes('calibre') || lcDest.includes('/books')) return 'books'
      if (lcSrc.includes('/maps') || lcDest.includes('/maps')) return 'maps'
      if (lcSrc.includes('kb_uploads') || lcDest.includes('kb_uploads')) return 'kb_uploads'
      return undefined
    }

    // 1. Network mounts from /proc/mounts (CIFS / SMB3 / NFS / SSHFS / Rclone)
    try {
      if (existsSync('/proc/mounts')) {
        const rawMounts = await readFile('/proc/mounts', 'utf8')
        const lines = rawMounts.split('\n')
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length < 3) continue
          const dev = parts[0].replace(/\\040/g, ' ')
          const mnt = parts[1].replace(/\\040/g, ' ')
          const fstype = parts[2].toLowerCase()
          if (['cifs', 'smb3', 'nfs', 'nfs4', 'fuse.sshfs', 'fuse.rclone'].includes(fstype)) {
            let totalBytes: number | undefined
            let freeBytes: number | undefined
            try {
              const sfs = await statfs(mnt)
              totalBytes = Number(sfs.blocks) * Number(sfs.bsize)
              freeBytes = Number(sfs.bavail) * Number(sfs.bsize)
            } catch {}
            const isNas =
              dev.toLowerCase().includes('truenas') ||
              mnt.toLowerCase().includes('truenas') ||
              fstype === 'cifs' ||
              fstype.startsWith('nfs')
            addUnique({
              sourceType: 'network',
              label: `Montagem de Rede (${fstype.toUpperCase()})`,
              containerDest: mnt,
              hostOrNetworkPath: dev,
              moduleKey: isNas ? inferModuleKey('jellyfin', mnt, dev) || 'media' : undefined,
              originLabel: `Rede Host (${fstype.toUpperCase()})`,
              totalBytes,
              freeBytes,
            })
          }
        }
      }
    } catch {}

    // 2. Local Docker containers (e.g. Jellyfin, Kiwix, Kolibri, Calibre, Ollama)
    try {
      const dockerService = new DockerService()
      const [localContainers, localVolumesResp] = await Promise.all([
        dockerService.docker.listContainers({ all: true }).catch(() => []),
        dockerService.docker.listVolumes().catch(() => ({ Volumes: [] })),
      ])

      const localVolMap = new Map<string, { driver: string; device?: string }>()
      for (const v of (localVolumesResp as any)?.Volumes || []) {
        if (v?.Name) {
          localVolMap.set(v.Name, {
            driver: v.Driver || 'local',
            device: v.Options?.device ? String(v.Options.device) : undefined,
          })
        }
      }

      const interestingPrefixes = ['jellyfin', 'kiwix', 'kolibri', 'calibre', 'ollama']
      for (const c of localContainers) {
        const cName = (c.Names?.[0] || '').replace(/^\//, '')
        const lowerName = cName.toLowerCase()
        if (!interestingPrefixes.some((p) => lowerName.includes(p))) continue

        const mounts = Array.isArray((c as any).Mounts) ? (c as any).Mounts : []
        for (const m of mounts) {
          const dest = String(m?.Destination || '')
          const src = String(m?.Source || m?.Name || '')
          if (!dest || dest === '/var/run/docker.sock' || dest.startsWith('/dev')) continue
          if (dest === '/config' || dest === '/cache' || dest.startsWith('/etc')) continue

          const volMeta = m?.Name ? localVolMap.get(String(m.Name)) : undefined
          const resolvedSrc = volMeta?.device || src
          const modKey = inferModuleKey(cName, dest, resolvedSrc)
          if (!modKey) continue

          addUnique({
            sourceType: lowerName.includes('jellyfin') ? 'jellyfin' : 'container',
            label: `${cName} → ${dest}`,
            containerName: cName,
            containerDest: dest,
            hostOrNetworkPath: resolvedSrc,
            moduleKey: modKey,
            state: c.State,
            originLabel: volMeta?.device ? `Volume Rede (${volMeta.driver})` : 'Docker Local',
          })
        }
      }
    } catch {}

    // 3. Portainer remote containers (captures remote Jellyfin seeing TrueNAS / NAS shares!)
    try {
      const { PortainerService } = await import('./portainer_service.js')
      const portainerMounts = await new PortainerService().getContainerStorageMounts()
      const interestingPrefixes = ['jellyfin', 'kiwix', 'kolibri', 'calibre', 'ollama']
      for (const pm of portainerMounts) {
        const lowerName = pm.containerName.toLowerCase()
        if (!interestingPrefixes.some((p) => lowerName.includes(p))) continue
        const dest = pm.destination
        if (dest === '/config' || dest === '/cache' || dest.startsWith('/etc')) continue

        const resolvedSrc = pm.networkDevice || pm.source
        const modKey = inferModuleKey(pm.containerName, dest, resolvedSrc)
        if (!modKey) continue

        addUnique({
          sourceType: lowerName.includes('jellyfin') ? 'jellyfin' : 'container',
          label: `${pm.containerName} → ${dest}`,
          containerName: pm.containerName,
          containerDest: dest,
          hostOrNetworkPath: resolvedSrc,
          moduleKey: modKey,
          state: pm.state,
          originLabel: pm.networkDevice
            ? `Portainer (${pm.driver || 'Rede'})`
            : 'Portainer Remoto',
        })
      }
    } catch {}

    // 4. Local Jellyfin library XML definitions (captures library folder paths added inside Jellyfin)
    try {
      const jfDefaultDirs = [
        join(storageRoot, 'jellyfin/root/default'),
        join(storageRoot, 'jellyfin/config/root/default'),
      ]
      for (const base of jfDefaultDirs) {
        if (!existsSync(base)) continue
        const libs = await readdir(base, { withFileTypes: true }).catch(() => [])
        for (const lib of libs) {
          if (!lib.isDirectory()) continue
          const optXml = join(base, lib.name, 'options.xml')
          if (!existsSync(optXml)) continue
          const xml = await readFile(optXml, 'utf8').catch(() => '')
          const matches = xml.matchAll(/<Path>([^<]+)<\/Path>/gi)
          for (const match of matches) {
            const p = match[1]?.trim()
            if (!p) continue
            addUnique({
              sourceType: 'jellyfin',
              label: `Biblioteca Jellyfin: ${lib.name}`,
              containerName: 'jellyfin',
              containerDest: lib.name,
              hostOrNetworkPath: p,
              moduleKey: 'media',
              originLabel: 'Biblioteca Jellyfin',
            })
          }
        }
      }
    } catch {}

    // 5. TrueNAS configured SMB / NFS shares (from Servidores -> TrueNAS)
    try {
      const { TruenasService } = await import('./truenas_service.js')
      const tnShares = await new TruenasService().getSharedFolders()
      for (const sh of tnShares) {
        if (!sh.enabled) continue
        addUnique({
          sourceType: 'truenas',
          label: `TrueNAS ${sh.protocol}: ${sh.name}`,
          containerDest: sh.path,
          hostOrNetworkPath: sh.networkUri,
          moduleKey: 'media',
          originLabel: `TrueNAS (${sh.host})`,
        })
      }
    } catch {}

    return items
  }

  async browsePath(requestedPath?: string): Promise<{
    currentPath: string
    currentDiskLabel: string
    currentRealHostPath: string
    parentPath: string | null
    entries: StorageFileEntry[]
  }> {
    const storageRoot = this.getStorageRoot()
    const target = requestedPath ? resolve(requestedPath) : storageRoot
    if (!(await this.isPathAllowed(target)) || !existsSync(target)) {
      throw new Error('Caminho inválido ou fora dos diretórios permitidos do N.O.M.A.D.')
    }

    const overview = await this.getStorageOverview().catch(() => null)
    const mountTargets = overview?.mountTargets || []
    const realTargetDir = await realpath(target).catch(() => target)
    const currentDiskMatch = this.findDiskForResolvedPath(realTargetDir, mountTargets)
    const currentRealHostPath = await this.resolveRealHostPath(realTargetDir)

    const rawEntries = await readdir(target, { withFileTypes: true })
    const entries: StorageFileEntry[] = []

    for (const entry of rawEntries) {
      const fullPath = join(target, entry.name)
      try {
        const lst = await lstat(fullPath)
        const isSymlink = lst.isSymbolicLink()
        const st = isSymlink ? await stat(fullPath).catch(() => lst) : lst
        let resolvedTarget: string | undefined
        let targetDiskLabel: string | undefined
        if (isSymlink) {
          resolvedTarget = await realpath(fullPath).catch(() => undefined)
          if (resolvedTarget) {
            targetDiskLabel = this.findDiskForResolvedPath(resolvedTarget, mountTargets)?.label
          }
        }
        entries.push({
          name: entry.name,
          path: fullPath,
          isDirectory: st.isDirectory(),
          isSymlink,
          resolvedTarget,
          targetDiskLabel,
          sizeBytes: st.isFile() ? st.size : 0,
          modifiedAt: st.mtime.toISOString(),
        })
      } catch {
        // ignore broken symlinks or inaccessible files
      }
    }

    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return b.sizeBytes - a.sizeBytes
    })

    const parent = dirname(target)
    const parentPath = (await this.isPathAllowed(parent)) && parent !== target ? parent : null

    return {
      currentPath: target,
      currentDiskLabel: currentDiskMatch?.label || `Armazenamento Local (${target})`,
      currentRealHostPath,
      parentPath,
      entries,
    }
  }

  private async movePathCrossDevice(fromPath: string, toPath: string): Promise<void> {
    try {
      await rename(fromPath, toPath)
    } catch (err: any) {
      if (err?.code === 'EXDEV' || err?.code === 'EEXIST' || err?.code === 'ENOTEMPTY') {
        await cp(fromPath, toPath, { recursive: true })
        await rm(fromPath, { recursive: true, force: true })
      } else {
        throw err
      }
    }
  }

  async moveContent(sourcePath: string, destDir: string, createSymlink = true) {
    const src = resolve(sourcePath)
    const dstDir = resolve(destDir)

    if (!(await this.isPathAllowed(src)) || !(await this.isPathAllowed(dstDir))) {
      throw new Error('Origem ou destino fora dos diretórios permitidos.')
    }

    await mkdir(dstDir, { recursive: true })
    const destPath = join(dstDir, basename(src))

    if (src === destPath) {
      const srcLst = await lstat(src).catch(() => null)
      if (!srcLst?.isSymbolicLink()) {
        throw new Error('A origem e o destino são idênticos.')
      }

      // Unlinking a symlinked folder back into internal storage
      const rawTarget = await readlink(src)
      const currentTarget = resolve(dirname(src), rawTarget)
      await rm(src, { force: true })
      if (currentTarget !== src && existsSync(currentTarget)) {
        await this.movePathCrossDevice(currentTarget, src)
      } else {
        await mkdir(src, { recursive: true })
      }
      return { success: true, sourcePath: src, destPath, symlinkCreated: false }
    }

    // If source doesn't exist yet (e.g. initial download preparation on a new disk)
    if (!existsSync(src)) {
      await mkdir(destPath, { recursive: true })
      await mkdir(dirname(src), { recursive: true })
      if (createSymlink) {
        try {
          await symlink(destPath, src)
        } catch (err) {
          logger.warn(`[StorageManager] Não foi possível criar link simbólico inicial ${src} -> ${destPath}:`, err)
        }
      }
      return { success: true, sourcePath: src, destPath, symlinkCreated: createSymlink }
    }

    try {
      const stats = await lstat(src)
      if (stats.isSymbolicLink()) {
        const rawTarget = await readlink(src)
        const currentTarget = resolve(dirname(src), rawTarget)
        if (currentTarget === resolve(destPath)) {
          return { success: true, sourcePath: src, destPath, symlinkCreated: true, alreadyMapped: true }
        }

        await mkdir(destPath, { recursive: true })
        if (existsSync(currentTarget)) {
          await this.movePathCrossDevice(currentTarget, destPath)
        }

        await rm(src, { force: true })
        if (createSymlink) {
          try {
            await symlink(destPath, src)
          } catch (err) {
            logger.warn(`[StorageManager] Não foi possível recriar link simbólico ${src} -> ${destPath}:`, err)
          }
        }
        return { success: true, sourcePath: src, destPath, symlinkCreated: createSymlink }
      }
    } catch (e: any) {
      logger.warn(`[StorageManager] Verificação de link simbólico em ${src}: ${e?.message}`)
    }

    await this.movePathCrossDevice(src, destPath)

    if (createSymlink) {
      try {
        await symlink(destPath, src)
      } catch (err) {
        logger.warn(`[StorageManager] Não foi possível criar link simbólico ${src} -> ${destPath}:`, err)
      }
    }

    return { success: true, sourcePath: src, destPath, symlinkCreated: createSymlink }
  }

  async deleteContent(targetPath: string) {
    const resolved = resolve(targetPath)
    if (!(await this.isPathAllowed(resolved)) || resolved === this.getStorageRoot() || resolved === '/mnt') {
      throw new Error('Não é permitido excluir o diretório raiz de armazenamento.')
    }
    if (!existsSync(resolved)) {
      throw new Error('Arquivo ou pasta não encontrado.')
    }
    await rm(resolved, { recursive: true, force: true })
    return { success: true }
  }

  async createDirectory(parentDir: string, name: string) {
    const cleanName = name.replace(/[<>:"/\\|?*]+/g, '').trim()
    if (!cleanName) throw new Error('Nome de pasta inválido.')
    const target = resolve(parentDir, cleanName)
    if (!(await this.isPathAllowed(target))) {
      throw new Error('Caminho fora dos diretórios permitidos.')
    }
    await mkdir(target, { recursive: true })
    return { success: true, path: target }
  }

  async getSambaStatus() {
    const [enabled, shareName, username, savedHostPath] = await Promise.all([
      KVStore.getValue('samba.enabled'),
      KVStore.getValue('samba.shareName'),
      KVStore.getValue('samba.username'),
      KVStore.getValue('samba.hostPath'),
    ])

    let containerRunning = false
    let activeSambaMountSource: string | undefined
    try {
      const dockerService = new DockerService()
      const docker = (dockerService as any).docker
      if (docker) {
        const containers = await docker.listContainers({ all: true })
        const sambaCont = containers.find((c: any) =>
          c.Names?.some((n: string) => n.replace(/^\//, '') === SAMBA_CONTAINER_NAME)
        )
        containerRunning = sambaCont?.State === 'running'
        if (sambaCont?.Id) {
          const insp = await docker.getContainer(sambaCont.Id).inspect().catch(() => null)
          const mountEntry = (insp?.Mounts || []).find((m: any) => m.Destination === '/mount')
          activeSambaMountSource = mountEntry?.Source
        }
      }
    } catch {
      containerRunning = false
    }

    const overview = await this.getStorageOverview().catch(() => null)
    const mountTargets = overview?.mountTargets || []

    const rawPath = savedHostPath || this.getStorageRoot()
    const resolvedHostPath = await this.resolveRealHostPath(rawPath)
    const matchedDisk =
      mountTargets.find(
        (m) =>
          m.path === rawPath ||
          m.realHostPath === rawPath ||
          m.realHostPath === resolvedHostPath ||
          resolvedHostPath.startsWith((m.realHostPath || m.path) + '/')
      ) || this.findDiskForResolvedPath(resolve(rawPath), mountTargets)

    return {
      enabled: enabled === true,
      containerRunning,
      shareName: shareName || 'nomad-biblioteca',
      username: username || 'nomad',
      hostPath: rawPath,
      resolvedHostPath: activeSambaMountSource || resolvedHostPath,
      diskLabel: matchedDisk?.label || `Armazenamento Local (${rawPath})`,
    }
  }

  async configureSamba(params: {
    enabled: boolean
    shareName: string
    username: string
    password: string
    hostPath: string
  }) {
    const requestedPath = params.hostPath?.trim() || this.getStorageRoot()
    const realHostBindPath = await this.resolveRealHostPath(requestedPath)

    await Promise.all([
      KVStore.setValue('samba.enabled', params.enabled),
      KVStore.setValue('samba.shareName', params.shareName || 'nomad-biblioteca'),
      KVStore.setValue('samba.username', params.username || 'nomad'),
      KVStore.setValue('samba.password', params.password || 'nomad123'),
      KVStore.setValue('samba.hostPath', requestedPath),
    ])

    const dockerService = new DockerService()
    const docker = (dockerService as any).docker
    if (!docker) {
      return {
        success: true,
        containerRunning: false,
        message: 'Configuração Samba salva. Docker local indisponível para iniciar contêiner SMB automático.',
      }
    }

    try {
      const containers = await docker.listContainers({ all: true })
      const existing = containers.find((c: any) =>
        c.Names?.some((n: string) => n.replace(/^\//, '') === SAMBA_CONTAINER_NAME)
      )
      if (existing) {
        const cont = docker.getContainer(existing.Id)
        if (existing.State === 'running') await cont.stop().catch(() => {})
        await cont.remove({ force: true }).catch(() => {})
      }

      if (!params.enabled) {
        return { success: true, containerRunning: false, message: 'Compartilhamento Samba desativado.' }
      }

      // Pull dperson/samba if missing and launch SMB server exposing NOMAD storage
      await new Promise<void>((resolvePull, rejectPull) => {
        docker.pull('dperson/samba:latest', (err: any, stream: any) => {
          if (err) return rejectPull(err)
          docker.modem.followProgress(stream, (progErr: any) => {
            if (progErr) return rejectPull(progErr)
            resolvePull()
          })
        })
      })

      const shareName = params.shareName || 'nomad-biblioteca'
      const username = params.username || 'nomad'
      const password = params.password || 'nomad123'
      const shareDef = `${shareName};/mount;yes;no;no;${username}`
      const userDef = `${username};${password}`

      // Mount main host storage path + secondary mounted drives so wide symlinks resolve inside Windows Explorer
      const extraBinds: string[] = []
      const bindsSeen = new Set<string>([`${realHostBindPath}:/mount`])
      const adminBinds = await this.getAdminContainerBinds()
      for (const b of adminBinds) {
        if (
          (b.destination.startsWith('/mnt/') || b.destination.startsWith('/media/')) &&
          b.source !== realHostBindPath
        ) {
          const bindSpec = `${b.source}:${b.destination}`
          if (!bindsSeen.has(bindSpec)) {
            bindsSeen.add(bindSpec)
            extraBinds.push(bindSpec)
          }
        }
      }

      const cmdArgs = [
        '-p',
        '-g',
        'follow symlinks = yes',
        '-g',
        'wide links = yes',
        '-g',
        'unix extensions = no',
        '-u',
        userDef,
        '-s',
        shareDef,
      ]

      const created = await docker.createContainer({
        name: SAMBA_CONTAINER_NAME,
        Image: 'dperson/samba:latest',
        Cmd: cmdArgs,
        HostConfig: {
          RestartPolicy: { Name: 'unless-stopped' },
          PortBindings: {
            '139/tcp': [{ HostPort: '139' }],
            '445/tcp': [{ HostPort: '445' }],
          },
          Binds: [`${realHostBindPath}:/mount`, ...extraBinds],
        },
        ExposedPorts: { '139/tcp': {}, '445/tcp': {} },
      })
      await created.start()

      return {
        success: true,
        containerRunning: true,
        resolvedHostPath: realHostBindPath,
        message: `Servidor Samba "${shareName}" ativo nas portas 139/445 compartilhando "${realHostBindPath}"!`,
      }
    } catch (error: any) {
      logger.error('[StorageManagerService] Erro ao configurar Samba:', error)
      return {
        success: false,
        containerRunning: false,
        message: `Configuração salva, mas falha ao iniciar contêiner Samba: ${error.message}`,
      }
    }
  }

  /**
   * Validates quota & physical free space on the target disk (shared by Maps & ZIM).
   */
  public async resolveDownloadDiskTarget(targetDisk?: string, requiredBytes?: number) {
    const overview = await this.getStorageOverview()
    const requested = targetDisk?.trim() || overview.preferredDownloadDisk || overview.storageRoot
    const disk =
      overview.mountTargets.find(
        (m) => resolve(m.path) === resolve(requested) || m.realHostPath === requested
      ) ||
      this.findDiskForResolvedPath(resolve(requested), overview.mountTargets) ||
      overview.mountTargets[0]

    if (disk && requiredBytes && requiredBytes > 0) {
      if (
        disk.quotaEnabled &&
        typeof disk.effectiveFreeBytes === 'number' &&
        requiredBytes > disk.effectiveFreeBytes
      ) {
        const freeGb = (disk.effectiveFreeBytes / 1024 ** 3).toFixed(1)
        const needGb = (requiredBytes / 1024 ** 3).toFixed(1)
        throw new Error(
          `Limite de espaço configurado em "${disk.label}" excedido (${freeGb} GB disponíveis na cota para ${needGb} GB exigidos). Ajuste a cota ou selecione outro disco.`
        )
      }
      if (disk.freeBytes > 0 && requiredBytes > disk.freeBytes) {
        const freeGb = (disk.freeBytes / 1024 ** 3).toFixed(1)
        const needGb = (requiredBytes / 1024 ** 3).toFixed(1)
        throw new Error(
          `Espaço livre insuficiente em "${disk.label}" (${freeGb} GB livres para ${needGb} GB exigidos). Selecione outro HD.`
        )
      }
    }

    return { overview, disk }
  }

  /**
   * Non-blocking download directory resolver: moves/links the module folder instantly when
   * empty or tiny (<= 64 MB), or writes directly onto <targetDisk>/<moduleName> when large
   * existing content sits on another disk so batch/tier UI requests never freeze or time out.
   */
  public async prepareDownloadTargetDir(
    moduleName: string,
    targetDisk?: string,
    requiredBytes?: number
  ): Promise<{ targetDir: string; diskLabel: string; diskPath: string }> {
    const { overview, disk } = await this.resolveDownloadDiskTarget(
      targetDisk?.trim() || undefined,
      requiredBytes
    )
    const moduleSource = join(overview.storageRoot, moduleName)
    const currentLoc = overview.moduleLocations?.[moduleName]

    if (!disk) {
      await mkdir(moduleSource, { recursive: true })
      const resolvedFallback = await realpath(moduleSource).catch(() => moduleSource)
      return {
        targetDir: resolvedFallback,
        diskLabel: currentLoc?.currentDiskLabel || 'Armazenamento Interno NOMAD',
        diskPath: currentLoc?.currentDiskPath || overview.storageRoot,
      }
    }

    const targetNorm = resolve(disk.path)
    const storageRootNorm = resolve(overview.storageRoot)
    const isTargetPrimary = targetNorm === storageRootNorm
    const physicalTargetDir = isTargetPrimary ? moduleSource : join(disk.path, moduleName)
    const currentNorm = currentLoc?.currentDiskPath
      ? resolve(currentLoc.currentDiskPath)
      : storageRootNorm
    const srcLst = await lstat(moduleSource).catch(() => null)
    const alreadyOnTarget =
      currentNorm === targetNorm && (!isTargetPrimary || !srcLst?.isSymbolicLink())

    if (alreadyOnTarget) {
      await mkdir(physicalTargetDir, { recursive: true })
      return { targetDir: physicalTargetDir, diskLabel: disk.label, diskPath: disk.path }
    }

    const existingSize = currentLoc?.sizeBytes ?? 0
    const existingFiles = currentLoc?.fileCount ?? 0
    if (!currentLoc?.exists || (existingSize <= 64 * 1024 * 1024 && existingFiles <= 5)) {
      await this.moveContent(moduleSource, disk.path, !isTargetPrimary)
      await mkdir(physicalTargetDir, { recursive: true })
      return { targetDir: physicalTargetDir, diskLabel: disk.label, diskPath: disk.path }
    }

    await mkdir(physicalTargetDir, { recursive: true })
    return { targetDir: physicalTargetDir, diskLabel: disk.label, diskPath: disk.path }
  }

  /**
   * Maps a resolved real filesystem path to the matching physical disk entry from storage overview.
   */
  public resolveDiskForRealPath(
    realPath: string,
    mountTargets: Array<{ label: string; path: string; realHostPath?: string }>,
    fallbackRoot?: string
  ): { diskLabel: string; diskPath: string } {
    const matched = this.findDiskForResolvedPath(realPath, mountTargets) || mountTargets[0]
    if (matched) {
      return { diskLabel: matched.label, diskPath: matched.path }
    }
    return {
      diskLabel: 'Armazenamento Interno NOMAD',
      diskPath: fallbackRoot || this.getStorageRoot(),
    }
  }

  /**
   * Ensures a module folder (e.g. 'maps' or 'zim') points to the requested disk
   * and validates configured quota + physical free space before downloading.
   */
  public async prepareModuleTargetDisk(
    moduleName: string,
    targetDisk?: string,
    requiredBytes?: number
  ): Promise<{ diskLabel: string; diskPath: string }> {
    const effectiveRequested =
      targetDisk?.trim() || (await this.getStorageOverview()).moduleLocations?.[moduleName]?.currentDiskPath
    const { overview, disk } = await this.resolveDownloadDiskTarget(effectiveRequested, requiredBytes)
    const currentModuleDisk = overview.moduleLocations?.[moduleName]?.currentDiskPath

    if (targetDisk?.trim() && disk) {
      const targetNorm = resolve(disk.path)
      const currentNorm = currentModuleDisk ? resolve(currentModuleDisk) : resolve(overview.storageRoot)
      const sourcePath = join(overview.storageRoot, moduleName)
      const srcLst = await lstat(sourcePath).catch(() => null)
      const alreadyOnTarget =
        currentNorm === targetNorm &&
        (targetNorm !== resolve(overview.storageRoot) || !srcLst?.isSymbolicLink())

      if (!alreadyOnTarget) {
        await this.moveContent(
          sourcePath,
          disk.path,
          targetNorm !== resolve(overview.storageRoot)
        )
      }
    }

    return {
      diskLabel: disk?.label || 'Armazenamento Interno NOMAD',
      diskPath: disk?.path || overview.storageRoot,
    }
  }

  /**
   * Resolves per-file physical HD, real host path, and secondary-mount scanning
   * for a module asset folder (such as maps/pmtiles).
   */
  public async annotateModuleFilesStorage(params: {
    moduleRootPath: string
    activeDirPath: string
    relativeSubpathFromDisk: string
    activeEntries: Array<{ type: 'file'; key: string; name: string }>
    filenameFilter: (name: string) => boolean
  }) {
    const overview = await this.getStorageOverview().catch(() => null)
    const mountTargets = overview?.mountTargets || []
    const defaultPrimaryDisk = mountTargets[0] || {
      label: 'Armazenamento Interno NOMAD',
      path: this.getStorageRoot(),
      isPrimary: true,
      diskType: 'Sistema',
    }

    const [rootLst, dirLst] = await Promise.all([
      lstat(params.moduleRootPath).catch(() => null),
      lstat(params.activeDirPath).catch(() => null),
    ])
    const dirIsSymlink = Boolean(rootLst?.isSymbolicLink() || dirLst?.isSymbolicLink())
    const rootRealPath = await realpath(params.moduleRootPath).catch(() => resolve(params.moduleRootPath))
    const dirRealPath = await realpath(params.activeDirPath).catch(() =>
      join(rootRealPath, basename(params.activeDirPath))
    )
    let dirRealHostPath = await this.resolveRealHostPath(dirRealPath).catch(() => dirRealPath)
    if (dirRealHostPath.startsWith('/app/update')) {
      dirRealHostPath = join(defaultPrimaryDisk.realHostPath || '/opt/project-nomad/storage', basename(params.moduleRootPath))
    }
    const activeDirDisk =
      this.findDiskForResolvedPath(dirRealPath, mountTargets) ||
      this.findDiskForResolvedPath(dirRealHostPath, mountTargets) ||
      this.findDiskForResolvedPath(rootRealPath, mountTargets) ||
      defaultPrimaryDisk
    const effectiveSecondaryLink = Boolean(dirIsSymlink && !activeDirDisk.isPrimary)

    const resolveMeta = async (
      filePath: string,
      parentSymlink: boolean,
      inActiveLibrary: boolean,
      fallbackDisk: typeof defaultPrimaryDisk
    ) => {
      const [st, lst, fileRealPath] = await Promise.all([
        stat(filePath).catch(() => null),
        lstat(filePath).catch(() => null),
        realpath(filePath).catch(() => resolve(filePath)),
      ])
      const realHostPath = await this.resolveRealHostPath(fileRealPath).catch(() => fileRealPath)
      const matchedDisk =
        this.findDiskForResolvedPath(fileRealPath, mountTargets) ||
        this.findDiskForResolvedPath(realHostPath, mountTargets) ||
        fallbackDisk
      return {
        size_bytes: st ? Number(st.size) : null,
        diskLabel: matchedDisk.label,
        diskPath: matchedDisk.path,
        diskType: matchedDisk.diskType,
        isPrimaryDisk: Boolean(matchedDisk.isPrimary),
        realPath: fileRealPath,
        realHostPath,
        isSymlink: parentSymlink || Boolean(lst?.isSymbolicLink()),
        inActiveLibrary,
      }
    }

    const activeFiles = await Promise.all(
      params.activeEntries.map(async (entry) => ({
        ...entry,
        ...(await resolveMeta(entry.key, effectiveSecondaryLink, true, activeDirDisk)),
      }))
    )

    const seenKeys = new Set<string>()
    for (const f of activeFiles) {
      if (f.realPath) seenKeys.add(f.realPath)
      if (f.realHostPath) seenKeys.add(f.realHostPath)
    }

    const extraFiles: Array<typeof activeFiles[number]> = []
    for (const mt of mountTargets) {
      const candidateDir = join(mt.path, params.relativeSubpathFromDisk)
      if (!existsSync(candidateDir)) continue
      const candidateRealDir = await realpath(candidateDir).catch(() => resolve(candidateDir))
      if (candidateRealDir === dirRealPath) continue
      try {
        const items = await readdir(candidateDir, { withFileTypes: true })
        for (const item of items) {
          if (!(item.isFile() || item.isSymbolicLink()) || !params.filenameFilter(item.name)) continue
          const fullPath = join(candidateDir, item.name)
          const meta = await resolveMeta(fullPath, false, false, mt)
          if (seenKeys.has(meta.realPath) || seenKeys.has(meta.realHostPath)) continue
          seenKeys.add(meta.realPath)
          seenKeys.add(meta.realHostPath)
          extraFiles.push({
            type: 'file',
            key: fullPath,
            name: item.name,
            ...meta,
          })
        }
      } catch {}
    }

    const files = [...activeFiles, ...extraFiles]
    const diskMap = new Map<
      string,
      {
        diskLabel: string
        diskPath: string
        isPrimaryDisk: boolean
        count: number
        totalBytes: number
      }
    >()
    for (const f of files) {
      const k = f.diskPath || f.diskLabel || activeDirDisk.path
      const cur = diskMap.get(k) || {
        diskLabel: f.diskLabel || activeDirDisk.label,
        diskPath: f.diskPath || activeDirDisk.path,
        isPrimaryDisk: Boolean(f.isPrimaryDisk),
        count: 0,
        totalBytes: 0,
      }
      cur.count += 1
      cur.totalBytes += f.size_bytes || 0
      diskMap.set(k, cur)
    }

    return {
      files,
      storage: {
        currentDiskLabel: activeDirDisk.label,
        currentDiskPath: activeDirDisk.path,
        isPrimaryDisk: Boolean(activeDirDisk.isPrimary),
        diskType: activeDirDisk.diskType,
        realPath: dirRealPath,
        realHostPath: dirRealHostPath,
        isSymlink: effectiveSecondaryLink,
        disksSummary: Array.from(diskMap.values()),
      },
    }
  }
}

