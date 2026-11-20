import { lstat, mkdir, open, readdir, readFile, readlink, realpath, rename, rm, stat, unlink } from 'fs/promises'
import path, { join } from 'path'
import { FileEntry } from '../../types/files.js'
import { createReadStream } from 'fs'
import { LSBlockDevice, NomadDiskInfoRaw } from '../../types/system.js'

export const ZIM_STORAGE_PATH = '/storage/zim'
export const KIWIX_LIBRARY_XML_PATH = '/storage/zim/kiwix-library.xml'
export const BOOKS_STORAGE_PATH = '/storage/books'
// Shared media root (Jellyfin reads it as /media; File Browser shows it as "media"). Per-type
// subfolders are pre-created on Jellyfin install — see _runPreinstallActions__Jellyfin.
export const MEDIA_STORAGE_PATH = '/storage/media'
export const JELLYFIN_MEDIA_SUBFOLDERS = ['Movies', 'TV Shows', 'Music', 'Photos']
// Empty Calibre library bundled into the admin image (see install/calibre-empty-library/).
// Seeded into storage/books on Calibre-Web install so it doesn't dead-end at db config.
export const CALIBRE_EMPTY_LIBRARY_ASSET_PATH = 'assets/calibre/metadata.db'
// Vaultwarden's /data volume. A self-signed TLS cert is generated here on install so the
// web vault has the secure context (HTTPS) it requires — see _runPreinstallActions__Vaultwarden.
export const VAULTWARDEN_STORAGE_PATH = '/storage/vaultwarden'
// MeshCore Web's working dir. On install a self-signed cert (certs/) and an SSL nginx config
// (nginx-ssl.conf) are generated here, then bind-mounted into the container so the static client is
// served over HTTPS — required for its Web Bluetooth/Serial connections. See
// _runPreinstallActions__MeshCoreWeb.
export const MESHCORE_WEB_STORAGE_PATH = '/storage/meshcore-web'

export async function listDirectoryContents(dirPath: string): Promise<FileEntry[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const results: FileEntry[] = []
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isFile()) {
        results.push({
          type: 'file',
          key: fullPath,
          name: entry.name,
        })
      } else if (entry.isDirectory()) {
        results.push({
          type: 'directory',
          prefix: fullPath,
          name: entry.name,
        })
      } else if (entry.isSymbolicLink()) {
        try {
          const st = await stat(fullPath)
          if (st.isFile()) {
            results.push({ type: 'file', key: fullPath, name: entry.name })
          } else if (st.isDirectory()) {
            results.push({ type: 'directory', prefix: fullPath, name: entry.name })
          }
        } catch {
          // Ignore dangling/unmounted symlink entries instead of crashing
        }
      }
    }
    return results
  } catch {
    return []
  }
}

export async function listDirectoryContentsRecursive(
  dirPath: string,
  visited = new Set<string>()
): Promise<FileEntry[]> {
  let results: FileEntry[] = []
  try {
    const real = await realpath(dirPath).catch(() => dirPath)
    if (visited.has(real)) return []
    visited.add(real)
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const subdirectoryContents = await listDirectoryContentsRecursive(fullPath, visited)
        results = results.concat(subdirectoryContents)
      } else if (entry.isFile()) {
        results.push({
          type: 'file',
          key: fullPath,
          name: entry.name,
        })
      } else if (entry.isSymbolicLink()) {
        try {
          const st = await stat(fullPath)
          if (st.isDirectory()) {
            const sub = await listDirectoryContentsRecursive(fullPath, visited)
            results = results.concat(sub)
          } else if (st.isFile()) {
            results.push({ type: 'file', key: fullPath, name: entry.name })
          }
        } catch {
          // Ignore dangling/broken symlinks
        }
      }
    }
  } catch {
    return []
  }
  return results
}

export async function ensureDirectoryExists(targetPath: string): Promise<void> {
  try {
    const st = await stat(targetPath)
    if (st.isDirectory()) return
  } catch (error: any) {
    if (
      error.code !== 'ENOENT' &&
      error.code !== 'ELOOP' &&
      error.code !== 'ENOTDIR'
    ) {
      throw error
    }
  }

  // Walk path segment-by-segment resolving symlinks so Node's recursive mkdir
  // never chokes with ENOTDIR/ELOOP when e.g. /app/storage/maps -> /mnt/nomad_storage/maps
  // is a symlink or its destination folder hasn't been created yet.
  const abs = path.resolve(targetPath)
  const parsed = path.parse(abs)
  const parts = abs.slice(parsed.root.length).split(path.sep).filter(Boolean)
  let current = parsed.root

  for (const part of parts) {
    current = path.join(current, part)
    let lst = await lstat(current).catch(() => null)

    // Follow any symlink chain at this segment and materialize its target dir
    let hops = 0
    while (lst?.isSymbolicLink() && hops < 8) {
      hops++
      const rawLink = await readlink(current)
      const resolvedLink = path.resolve(path.dirname(current), rawLink)
      const targetLst = await lstat(resolvedLink).catch(() => null)

      if (!targetLst) {
        await mkdir(resolvedLink, { recursive: true })
        current = resolvedLink
        lst = await lstat(current).catch(() => null)
        break
      }

      if (targetLst.isFile()) {
        if (targetLst.size === 0) {
          await rm(resolvedLink, { force: true }).catch(() => {})
          await mkdir(resolvedLink, { recursive: true })
        } else {
          const backupPath = `${resolvedLink}.bak.${Date.now()}`
          await rename(resolvedLink, backupPath)
          await mkdir(resolvedLink, { recursive: true })
        }
        current = resolvedLink
        lst = await lstat(current).catch(() => null)
        break
      }

      current = resolvedLink
      lst = targetLst
    }

    if (!lst) {
      try {
        await mkdir(current, { recursive: true })
      } catch (mkdirErr: any) {
        if (mkdirErr?.code !== 'EEXIST') {
          throw mkdirErr
        }
      }
      continue
    }

    if (lst.isFile()) {
      // A stray file is sitting where a directory component must exist (causes ENOTDIR).
      if (lst.size === 0) {
        await rm(current, { force: true }).catch(() => {})
      } else {
        await rename(current, `${current}.bak.${Date.now()}`)
      }
      await mkdir(current, { recursive: true })
    }
  }
}

/**
 * Validates and repairs the destination directory (including symlinked secondary disks)
 * for a scheduled download filepath before execution.
 */
export async function repairDownloadDirectory(filepath: string): Promise<{
  repaired: boolean
  resolvedDir: string
  notePt?: string
}> {
  const dir = path.dirname(path.resolve(filepath))
  const preStat = await stat(dir).catch((e) => e)
  const needsRepair = preStat instanceof Error

  await ensureDirectoryExists(dir)
  const resolvedDir = await realpath(dir).catch(() => dir)

  if (needsRepair) {
    return {
      repaired: true,
      resolvedDir,
      notePt: `Diretório de destino reparado/validado automaticamente (${dir} → ${resolvedDir}).`,
    }
  }
  return { repaired: false, resolvedDir }
}

export async function getFile(path: string, returnType: 'buffer'): Promise<Buffer | null>
export async function getFile(
  path: string,
  returnType: 'stream'
): Promise<NodeJS.ReadableStream | null>
export async function getFile(path: string, returnType: 'string'): Promise<string | null>
export async function getFile(
  path: string,
  returnType: 'buffer' | 'string' | 'stream' = 'buffer'
): Promise<Buffer | string | NodeJS.ReadableStream | null> {
  try {
    if (returnType === 'string') {
      return await readFile(path, 'utf-8')
    } else if (returnType === 'stream') {
      return createReadStream(path)
    }
    return await readFile(path)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export async function getFileStatsIfExists(
  path: string
): Promise<{ size: number; modifiedTime: Date } | null> {
  try {
    const stats = await stat(path)
    return {
      size: stats.size,
      modifiedTime: stats.mtime,
    }
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.code === 'ELOOP' || error.code === 'ENOTDIR') {
      return null
    }
    throw error
  }
}

/**
 * Validates that a file has the ZIM magic number (0x44D495A).
 * Must be called before passing a file to @openzim/libzim Archive,
 * because a corrupted ZIM causes a native C++ abort that cannot be
 * caught by JS try/catch.
 */
export async function isValidZimFile(filePath: string): Promise<boolean> {
  let fh
  try {
    fh = await open(filePath, 'r')
    const buf = Buffer.alloc(4)
    const { bytesRead } = await fh.read(buf, 0, 4, 0)
    if (bytesRead < 4) return false
    // ZIM magic number: 72 17 32 04 (little-endian 0x044D4953)
    return buf[0] === 0x5a && buf[1] === 0x49 && buf[2] === 0x4d && buf[3] === 0x04
  } catch {
    return false
  } finally {
    await fh?.close()
  }
}

export async function deleteFileIfExists(path: string): Promise<void> {
  try {
    await unlink(path)
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

export function getAllFilesystems(
  device: LSBlockDevice,
  fsSize: NomadDiskInfoRaw['fsSize']
): NomadDiskInfoRaw['fsSize'] {
  const filesystems: NomadDiskInfoRaw['fsSize'] = []
  const seen = new Set()

  function traverse(dev: LSBlockDevice) {
    // Try to find matching filesystem
    const fs = fsSize.find((f) => matchesDevice(f.fs, dev.name))

    if (fs && !seen.has(fs.fs)) {
      filesystems.push(fs)
      seen.add(fs.fs)
    }

    // Traverse children recursively
    if (dev.children) {
      dev.children.forEach((child) => traverse(child))
    }
  }

  traverse(device)
  return filesystems
}

export function matchesDevice(fsPath: string, deviceName: string): boolean {
  // Remove /dev/ and /dev/mapper/ prefixes
  const normalized = fsPath.replace('/dev/mapper/', '').replace('/dev/', '')

  // Direct match (covers /dev/sda1 ↔ sda1, /dev/nvme0n1p1 ↔ nvme0n1p1)
  if (normalized === deviceName) {
    return true
  }

  // LVM/device-mapper: e.g., /dev/mapper/ubuntu--vg-ubuntu--lv contains "ubuntu--lv"
  if (fsPath.startsWith('/dev/mapper/') && fsPath.includes(deviceName)) {
    return true
  }

  return false
}

export function determineFileType(filename: string): 'image' | 'pdf' | 'text' | 'docx' | 'epub' | 'zim' | 'unknown' {
  const ext = path.extname(filename).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)) {
    return 'image'
  } else if (ext === '.pdf') {
    return 'pdf'
  } else if (ext === '.docx') {
    return 'docx'
  } else if (['.txt', '.md', '.rtf'].includes(ext)) {
    return 'text'
  } else if (ext === '.epub') {
    return 'epub'
  } else if (ext === '.zim') {
    return 'zim'
  } else {
    return 'unknown'
  }
}

/**
 * Sanitize a filename by removing potentially dangerous characters.
 * @param filename The original filename
 * @returns The sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
}