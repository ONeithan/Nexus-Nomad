import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { diagnoseDownloadError } from '../../app/utils/download_diagnostics.js'

test('diagnoses ENOTDIR storage symlink error in PT-BR as auto-reparable & retryable', () => {
  const err = Object.assign(new Error("ENOTDIR: not a directory, mkdir '/app/storage/maps'"), {
    code: 'ENOTDIR',
  })
  const d = diagnoseDownloadError(err, '/app/storage/maps/pmtiles/20261118.pmtiles')
  assert.equal(d.code, 'STORAGE_ENOTDIR')
  assert.equal(d.retryable, true)
  assert.equal(d.autoReparable, true)
  assert.match(d.summaryPt, /ENOTDIR|link simbólico/i)
})

test('diagnoses 30000ms axios timeout in PT-BR and preserves retryability', () => {
  const d = diagnoseDownloadError(new Error('timeout of 30000ms exceeded'))
  assert.equal(d.code, 'TIMEOUT')
  assert.equal(d.retryable, true)
  assert.match(d.summaryPt, /Tempo limite/i)
  assert.match(d.actionHintPt, /final da fila/i)
})

test('diagnoses ENOTFOUND DNS failure in PT-BR as retryable', () => {
  const err = Object.assign(new Error('getaddrinfo ENOTFOUND lb.download.kiwix.org'), {
    code: 'ENOTFOUND',
  })
  const d = diagnoseDownloadError(err)
  assert.equal(d.code, 'ENOTFOUND')
  assert.equal(d.retryable, true)
  assert.match(d.summaryPt, /DNS/i)
})

test('marks user cancel and ENOSPC as non-retryable with clear PT-BR explanation', () => {
  const cancelled = diagnoseDownloadError(new Error('Download cancelled: user-cancel'))
  assert.equal(cancelled.code, 'USER_CANCELLED')
  assert.equal(cancelled.retryable, false)

  const enospc = diagnoseDownloadError(Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' }))
  assert.equal(enospc.code, 'DISK_ENOSPC')
  assert.equal(enospc.retryable, false)
  assert.match(enospc.summaryPt, /Espaço em disco/i)
})
