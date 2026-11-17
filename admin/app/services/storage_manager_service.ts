import {
  readdir,
  stat,
  lstat,
  readlink,
  mkdir,
  rename,
  rm,
  symlink,
  cp,
  statfs,
  readFile,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import si from 'systeminformation'
import logger from '@adonisjs/core/services/logger'
import KVStore from '#models/kv_store'
import { DockerService } from './docker_service.js'

export interface FolderUsageItem {
  name: string
  label: string
  path: string
  sizeBytes: number
  fileCount: number
}

export interface StorageFileEntry {
  name: string
  path: string
  isDirectory: boolean
  isSymlink: boolean
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

export class StorageManagerService {
  private _allowedRootsCache: Set<string> | null = null

  private getStorageRoot(): string {
    return resolve(process.cwd(), 'storage')
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
    if (!existsSync(dirPath) || depth > 5) {
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
    const folderUsage: FolderUsageItem[] = []

    if (existsSync(storageRoot)) {
      const entries = await readdir(storageRoot, { withFileTypes: true }).catch(() => [])
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const fullPath = join(storageRoot, entry.name)
        const stats = await this.getDirStats(fullPath)
        folderUsage.push({
          name: entry.name,
          label: FOLDER_LABELS[entry.name] || entry.name,
          path: fullPath,
          sizeBytes: stats.sizeBytes,
          fileCount: stats.fileCount,
        })
      }
    }

    folderUsage.sort((a, b) => b.sizeBytes - a.sizeBytes)

    // Discover all physical disks and mounted filesystems on the system
    const mountTargets: Array<{
      label: string
      path: string
      freeBytes: number
      totalBytes: number
      isPrimary?: boolean
      diskType?: string
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
    const candidateDirs = ['/mnt', '/media', '/run/media', '/data', '/disks', '/volumes']
    for (const baseDir of candidateDirs) {
      if (!existsSync(baseDir)) continue
      try {
        const entries = await readdir(baseDir, { withFileTypes: true }).catch(() => [])
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const fullPath = join(baseDir, entry.name)
          const resolvedPath = resolve(fullPath)
          if (mountTargets.some((m) => resolve(m.path) === resolvedPath)) continue

          try {
            const fsStats = await statfs(fullPath)
            const totalBytes = Number(fsStats.blocks) * Number(fsStats.bsize)
            const freeBytes = Number(fsStats.bavail) * Number(fsStats.bsize)
            if (totalBytes > 0) {
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

    const preferredDownloadDisk = (await KVStore.getValue('storage.preferredDownloadDisk')) || storageRoot

    return {
      storageRoot,
      preferredDownloadDisk,
      folderUsage,
      mountTargets,
      unmountedDisks,
    }
  }

  async browsePath(requestedPath?: string): Promise<{
    currentPath: string
    parentPath: string | null
    entries: StorageFileEntry[]
  }> {
    const storageRoot = this.getStorageRoot()
    const target = requestedPath ? resolve(requestedPath) : storageRoot
    if (!(await this.isPathAllowed(target)) || !existsSync(target)) {
      throw new Error('Caminho inválido ou fora dos diretórios permitidos do N.O.M.A.D.')
    }

    const rawEntries = await readdir(target, { withFileTypes: true })
    const entries: StorageFileEntry[] = []

    for (const entry of rawEntries) {
      const fullPath = join(target, entry.name)
      try {
        const lst = await lstat(fullPath)
        const isSymlink = lst.isSymbolicLink()
        const st = isSymlink ? await stat(fullPath).catch(() => lst) : lst
        entries.push({
          name: entry.name,
          path: fullPath,
          isDirectory: st.isDirectory(),
          isSymlink,
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
      parentPath,
      entries,
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
      throw new Error('A origem e o destino são idênticos.')
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

        if (existsSync(currentTarget)) {
          await mkdir(destPath, { recursive: true })
          try {
            await rename(currentTarget, destPath)
          } catch (err: any) {
            if (err?.code === 'EXDEV' || err?.code === 'EEXIST' || err?.code === 'ENOTEMPTY') {
              await cp(currentTarget, destPath, { recursive: true })
              await rm(currentTarget, { recursive: true, force: true })
            } else {
              throw err
            }
          }
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

    try {
      await rename(src, destPath)
    } catch (err: any) {
      if (err?.code === 'EXDEV' || err?.code === 'EEXIST' || err?.code === 'ENOTEMPTY') {
        // Cross-device move ou pasta já existente no destino
        await cp(src, destPath, { recursive: true })
        await rm(src, { recursive: true, force: true })
      } else {
        throw err
      }
    }

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
    const [enabled, shareName, username, hostPath] = await Promise.all([
      KVStore.getValue('samba.enabled'),
      KVStore.getValue('samba.shareName'),
      KVStore.getValue('samba.username'),
      KVStore.getValue('samba.hostPath'),
    ])

    let containerRunning = false
    try {
      const dockerService = new DockerService()
      const docker = (dockerService as any).docker
      if (docker) {
        const containers = await docker.listContainers({ all: true })
        const sambaCont = containers.find((c: any) =>
          c.Names?.some((n: string) => n.replace(/^\//, '') === SAMBA_CONTAINER_NAME)
        )
        containerRunning = sambaCont?.State === 'running'
      }
    } catch {
      containerRunning = false
    }

    return {
      enabled: enabled === true,
      containerRunning,
      shareName: shareName || 'nomad-biblioteca',
      username: username || 'nomad',
      hostPath: hostPath || process.env.HOST_STORAGE_PATH || this.getStorageRoot(),
    }
  }

  async configureSamba(params: {
    enabled: boolean
    shareName: string
    username: string
    password: string
    hostPath: string
  }) {
    await Promise.all([
      KVStore.setValue('samba.enabled', params.enabled),
      KVStore.setValue('samba.shareName', params.shareName || 'nomad-biblioteca'),
      KVStore.setValue('samba.username', params.username || 'nomad'),
      KVStore.setValue('samba.password', params.password || 'nomad123'),
      KVStore.setValue('samba.hostPath', params.hostPath || this.getStorageRoot()),
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

      const hostBindPath = params.hostPath || process.env.HOST_STORAGE_PATH || '/storage'
      const shareDef = `${params.shareName || 'nomad-biblioteca'};/mount;yes;no;no;${params.username || 'nomad'}`
      const userDef = `${params.username || 'nomad'};${params.password || 'nomad123'}`

      const created = await docker.createContainer({
        name: SAMBA_CONTAINER_NAME,
        Image: 'dperson/samba:latest',
        Cmd: ['-p', '-u', userDef, '-s', shareDef],
        HostConfig: {
          RestartPolicy: { Name: 'unless-stopped' },
          PortBindings: {
            '139/tcp': [{ HostPort: '139' }],
            '445/tcp': [{ HostPort: '445' }],
          },
          Binds: [`${hostBindPath}:/mount`],
        },
        ExposedPorts: { '139/tcp': {}, '445/tcp': {} },
      })
      await created.start()

      return {
        success: true,
        containerRunning: true,
        message: `Servidor Samba "${params.shareName}" ativo nas portas 139/445!`,
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
}

