import {
  readdir,
  stat,
  lstat,
  mkdir,
  rename,
  rm,
  symlink,
  cp,
  statfs,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
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
  private getStorageRoot(): string {
    return resolve(process.cwd(), 'storage')
  }

  private getAllowedRoots(): string[] {
    const roots = [this.getStorageRoot()]
    if (existsSync('/mnt')) {
      roots.push('/mnt')
    }
    return roots
  }

  private isPathAllowed(targetPath: string): boolean {
    const resolved = resolve(targetPath)
    return this.getAllowedRoots().some(
      (root) => resolved === root || resolved.startsWith(`${root}/`) || resolved.startsWith(`${root}\\`)
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

    // Discover available mount targets (/mnt/* + storageRoot)
    const mountTargets: Array<{ label: string; path: string; freeBytes: number; totalBytes: number }> = []
    const checkPoints = [
      { label: 'Armazenamento Interno NOMAD (storage)', path: storageRoot },
    ]
    if (existsSync('/mnt')) {
      const mnts = await readdir('/mnt', { withFileTypes: true }).catch(() => [])
      for (const m of mnts) {
        if (m.isDirectory()) {
          checkPoints.push({ label: `Disco Externo (/mnt/${m.name})`, path: `/mnt/${m.name}` })
        }
      }
    }

    for (const cp of checkPoints) {
      try {
        const fsStats = await statfs(cp.path)
        const totalBytes = Number(fsStats.blocks) * Number(fsStats.bsize)
        const freeBytes = Number(fsStats.bavail) * Number(fsStats.bsize)
        mountTargets.push({
          label: cp.label,
          path: cp.path,
          freeBytes,
          totalBytes,
        })
      } catch {
        mountTargets.push({ label: cp.label, path: cp.path, freeBytes: 0, totalBytes: 0 })
      }
    }

    const preferredDownloadDisk = (await KVStore.getValue('storage.preferredDownloadDisk')) || storageRoot

    return {
      storageRoot,
      preferredDownloadDisk,
      folderUsage,
      mountTargets,
    }
  }

  async browsePath(requestedPath?: string): Promise<{
    currentPath: string
    parentPath: string | null
    entries: StorageFileEntry[]
  }> {
    const storageRoot = this.getStorageRoot()
    const target = requestedPath ? resolve(requestedPath) : storageRoot
    if (!this.isPathAllowed(target) || !existsSync(target)) {
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
    const parentPath = this.isPathAllowed(parent) && parent !== target ? parent : null

    return {
      currentPath: target,
      parentPath,
      entries,
    }
  }

  async moveContent(sourcePath: string, destDir: string, createSymlink = true) {
    const src = resolve(sourcePath)
    const dstDir = resolve(destDir)

    if (!this.isPathAllowed(src) || !this.isPathAllowed(dstDir)) {
      throw new Error('Origem ou destino fora dos diretórios permitidos.')
    }
    if (!existsSync(src)) {
      throw new Error('Arquivo ou pasta de origem não encontrado.')
    }

    await mkdir(dstDir, { recursive: true })
    const destPath = join(dstDir, basename(src))

    if (src === destPath) {
      throw new Error('A origem e o destino são idênticos.')
    }

    try {
      await rename(src, destPath)
    } catch (err: any) {
      if (err?.code === 'EXDEV') {
        // Cross-device move (e.g. NVMe -> /mnt/nomad_storage HDD)
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
    if (!this.isPathAllowed(resolved) || resolved === this.getStorageRoot() || resolved === '/mnt') {
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
    if (!this.isPathAllowed(target)) {
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

