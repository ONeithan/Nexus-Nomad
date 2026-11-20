import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, rmSync, symlinkSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ensureDirectoryExists, repairDownloadDirectory } from '../../app/utils/fs.js'

test('ensureDirectoryExists resolves dangling directory symlinks without throwing ENOTDIR', async () => {
  const root = mkdtempSync(join(tmpdir(), 'nomad-dir-repair-'))
  try {
    const missingDiskTarget = join(root, 'secondary-disk', 'maps')
    const symlinkMaps = join(root, 'maps')
    try {
      symlinkSync(missingDiskTarget, symlinkMaps, 'junction')
    } catch {
      // On systems where symlink creation without elevation requires dir type or fails, skip gracefully
      return
    }

    const nestedPmtiles = join(symlinkMaps, 'pmtiles')
    await ensureDirectoryExists(nestedPmtiles)

    assert.equal(existsSync(missingDiskTarget), true)
    assert.equal(statSync(join(missingDiskTarget, 'pmtiles')).isDirectory(), true)

    const repair = await repairDownloadDirectory(join(nestedPmtiles, '20261118.pmtiles'))
    assert.equal(existsSync(repair.resolvedDir), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('ensureDirectoryExists heals 0-byte blocking files on directory path', async () => {
  const root = mkdtempSync(join(tmpdir(), 'nomad-file-heal-'))
  try {
    const blockingFile = join(root, 'maps')
    writeFileSync(blockingFile, '') // 0-byte blocking file would trigger ENOTDIR

    await ensureDirectoryExists(join(blockingFile, 'pmtiles'))
    assert.equal(statSync(join(blockingFile, 'pmtiles')).isDirectory(), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
