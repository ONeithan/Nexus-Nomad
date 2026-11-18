import { lstat, mkdir, open, readdir, readFile, readlink, realpath, rm, stat, unlink } from 'fs/promises'
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
    await stat(targetPath)
    return
  } catch (error: any) {
    if (error.code !== 'ENOENT' && error.code !== 'ELOOP') {
      throw error
    }
  }

  // Handle dangling symlinks (lstat succeeds while stat fails with ENOENT)
  const lst = await lstat(targetPath).catch(() => null)
  if (lst?.isSymbolicLink()) {
    try {
      const linkTarget = await readlink(targetPath)
      const resolvedTarget = path.resolve(path.dirname(targetPath), linkTarget)
      await mkdir(resolvedTarget, { recursive: true })
      await stat(targetPath)
      return
    } catch {
      await rm(targetPath, { force: true }).catch(() => {})
    }
  }

  try {
    await mkdir(targetPath, { recursive: true })
  } catch (mkdirErr: any) {
    if (mkdirErr?.code !== 'EEXIST') {
      throw mkdirErr
    }
  }
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