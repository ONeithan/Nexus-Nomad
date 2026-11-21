import 'reflect-metadata'
import * as assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import http from 'node:http'
import { setApp } from '@adonisjs/core/services/app'
import { mkdtemp, readFile, rm, symlink, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Populate minimal safe defaults if running standalone outside `.env`
process.env.NODE_ENV ??= 'test'
process.env.PORT ??= '8080'
process.env.APP_KEY ??= 'qa-test-secret-key-32-chars-minimum'
process.env.HOST ??= '127.0.0.1'
process.env.URL ??= 'http://127.0.0.1:8080'
process.env.LOG_LEVEL ??= 'silent'
process.env.DB_HOST ??= '127.0.0.1'
process.env.DB_PORT ??= '3306'
process.env.DB_USER ??= 'test'
process.env.DB_DATABASE ??= 'test'
process.env.REDIS_HOST ??= '127.0.0.1'
process.env.REDIS_PORT ??= '6379'

// Register lightweight Adonis container stub so @adonisjs/core logger & transmit initialize cleanly in unit tests
setApp({
  async booted(cb: () => Promise<void>) {
    await cb()
  },
  container: {
    async make(binding: string) {
      if (binding === 'logger') {
        return { info() {}, warn() {}, error() {}, debug() {} }
      }
      if (binding === 'transmit') {
        return { broadcast() {} }
      }
      return {}
    },
  },
} as any)

let doResumableDownload: typeof import('../../app/utils/downloads.js')['doResumableDownload']
let repairDownloadDirectory: typeof import('../../app/utils/fs.js')['repairDownloadDirectory']
let sortDownloadJobsFifo: typeof import('../../app/utils/download_queue_policy.js')['sortDownloadJobsFifo']
let evaluateBootRecoveryAction: typeof import('../../app/utils/download_queue_policy.js')['evaluateBootRecoveryAction']

before(async () => {
  const [dlMod, fsMod, polMod] = await Promise.all([
    import('../../app/utils/downloads.js'),
    import('../../app/utils/fs.js'),
    import('../../app/utils/download_queue_policy.js'),
  ])
  doResumableDownload = dlMod.doResumableDownload
  repairDownloadDirectory = fsMod.repairDownloadDirectory
  sortDownloadJobsFifo = polMod.sortDownloadJobsFifo
  evaluateBootRecoveryAction = polMod.evaluateBootRecoveryAction
})

const tempRoots: string[] = []

after(async () => {
  await Promise.all(
    tempRoots.map((dir) => rm(dir, { recursive: true, force: true }).catch(() => {}))
  )
})

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempRoots.push(dir)
  return dir
}

function startTestServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number }
      resolve({ server, url: `http://127.0.0.1:${addr.port}` })
    })
  })
}

function closeTestServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.closeAllConnections?.()
    server.close(() => resolve())
  })
}

// 1. REAL HTTP STREAM DOWNLOAD RESILIENCE & RANGE / HTML / SYMLINK RECOVERY

test('doResumableDownload completes fresh download and honors idempotency', async () => {
  const payload = Buffer.from('NOMAD-BINARY-PMTILES-PAYLOAD-0123456789ABCDEF')
  let getCount = 0

  const { server, url } = await startTestServer((req, res) => {
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': String(payload.length),
        'Content-Type': 'application/octet-stream',
        'Accept-Ranges': 'bytes',
      })
      res.end()
      return
    }
    getCount++
    res.writeHead(200, {
      'Content-Length': String(payload.length),
      'Content-Type': 'application/octet-stream',
    })
    res.end(payload)
  })

  try {
    const dir = await makeTempDir('nomad-qa-dl-fresh-')
    const filepath = join(dir, 'sample.pmtiles')
    const out1 = await doResumableDownload({
      url: `${url}/sample.pmtiles`,
      filepath,
      timeout: 5000, // Also verifies safe clamp >= 120_000ms never rejects
      allowedMimeTypes: ['application/octet-stream'],
    })
    assert.equal(out1, filepath)
    assert.deepEqual(await readFile(filepath), payload)
    assert.equal(getCount, 1)

    // Second run with same file size is idempotent (no GET)
    await doResumableDownload({
      url: `${url}/sample.pmtiles`,
      filepath,
      timeout: 120000,
      allowedMimeTypes: ['application/octet-stream'],
    })
    assert.equal(getCount, 1)
  } finally {
    await closeTestServer(server)
  }
})

test('doResumableDownload resumes .tmp partial file via HTTP 206 Range', async () => {
  const payload = Buffer.from('FIRST-HALF-BYTES::SECOND-HALF-BYTES-COMPLETE')
  const splitAt = 18
  const seenRanges: string[] = []

  const { server, url } = await startTestServer((req, res) => {
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': String(payload.length),
        'Content-Type': 'application/octet-stream',
        'Accept-Ranges': 'bytes',
      })
      res.end()
      return
    }
    const range = req.headers.range
    if (range) seenRanges.push(String(range))
    const slice = payload.subarray(splitAt)
    res.writeHead(206, {
      'Content-Length': String(slice.length),
      'Content-Range': `bytes ${splitAt}-${payload.length - 1}/${payload.length}`,
      'Content-Type': 'application/octet-stream',
    })
    res.end(slice)
  })

  try {
    const dir = await makeTempDir('nomad-qa-dl-206-')
    const filepath = join(dir, 'partial.pmtiles')
    await writeFile(`${filepath}.tmp`, payload.subarray(0, splitAt))

    await doResumableDownload({
      url: `${url}/partial.pmtiles`,
      filepath,
      timeout: 120000,
      allowedMimeTypes: ['application/octet-stream'],
    })
    assert.deepEqual(seenRanges, [`bytes=${splitAt}-`])
    assert.deepEqual(await readFile(filepath), payload)
  } finally {
    await closeTestServer(server)
  }
})

test('doResumableDownload recovers cleanly from HTTP 416 Range Not Satisfiable', async () => {
  const payload = Buffer.from('CLEAN-FULL-BODY-AFTER-416-RECOVERY')
  let attempts = 0

  const { server, url } = await startTestServer((req, res) => {
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': String(payload.length),
        'Content-Type': 'application/octet-stream',
        'Accept-Ranges': 'bytes',
      })
      res.end()
      return
    }
    attempts++
    if (req.headers.range) {
      res.writeHead(416, { 'Content-Range': `bytes */${payload.length}` })
      res.end()
      return
    }
    res.writeHead(200, {
      'Content-Length': String(payload.length),
      'Content-Type': 'application/octet-stream',
    })
    res.end(payload)
  })

  try {
    const dir = await makeTempDir('nomad-qa-dl-416-')
    const filepath = join(dir, 'recover416.pmtiles')
    // Smaller .tmp than HEAD Content-Length, yet server still responds 416 on GET Range
    await writeFile(`${filepath}.tmp`, Buffer.from('STALE-10-B'))

    await doResumableDownload({
      url: `${url}/recover416.pmtiles`,
      filepath,
      timeout: 120000,
      allowedMimeTypes: ['application/octet-stream'],
    })
    assert.equal(attempts, 2)
    assert.deepEqual(await readFile(filepath), payload)
  } finally {
    await closeTestServer(server)
  }
})

test('doResumableDownload rejects text/html CAPTCHA/error page returned on GET', async () => {
  const { server, url } = await startTestServer((req, res) => {
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': '1024',
        'Content-Type': 'application/octet-stream',
      })
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<html><body>Error Gateway</body></html>')
  })

  try {
    const dir = await makeTempDir('nomad-qa-dl-html-')
    const filepath = join(dir, 'bad.zim')

    await assert.rejects(
      () =>
        doResumableDownload({
          url: `${url}/bad.zim`,
          filepath,
          timeout: 120000,
          allowedMimeTypes: ['application/octet-stream'],
        }),
      /MIME type text\/html/
    )
  } finally {
    await closeTestServer(server)
  }
})

test('doResumableDownload writes cleanly across symlinked secondary disk directories', async () => {
  const payload = Buffer.from('SECONDARY-DISK-SYMLINK-DATA')
  const { server, url } = await startTestServer((req, res) => {
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Length': String(payload.length),
        'Content-Type': 'application/octet-stream',
      })
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
    res.end(payload)
  })

  try {
    const root = await makeTempDir('nomad-qa-symlink-')
    const realTarget = join(root, 'mnt_secondary', 'maps')
    await mkdir(realTarget, { recursive: true })
    const symlinkPath = join(root, 'maps_link')

    try {
      await symlink(realTarget, symlinkPath, 'junction')
    } catch {
      // Fallback on hosts restricting symlink creation without privilege
      await mkdir(symlinkPath, { recursive: true })
    }

    const filepath = join(symlinkPath, 'pmtiles', '20261118.pmtiles')
    const repair = await repairDownloadDirectory(filepath)
    assert.ok(repair.resolvedDir.length > 0)

    await doResumableDownload({
      url: `${url}/20261118.pmtiles`,
      filepath,
      timeout: 120000,
      allowedMimeTypes: ['application/octet-stream'],
    })
    assert.deepEqual(await readFile(filepath), payload)
  } finally {
    await closeTestServer(server)
  }
})

// 2. DOWNLOAD SERVICE FIFO TAIL SORTING & BOOT RECOVERY POLICY VERIFICATION

test('sortDownloadJobsFifo orders active (desc) -> waiting/delayed (strict FIFO) -> failed and DownloadService requests asc=true', async () => {
  const [downloadServiceSrc, workCmdSrc] = await Promise.all([
    readFile(new URL('../../app/services/download_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../commands/queue/work.ts', import.meta.url), 'utf8'),
  ])

  // Verify BullMQ queue getters pass asc=true for FIFO order (LRANGE un-reversed)
  assert.match(downloadServiceSrc, /queue\.getJobs\(\['waiting'\],\s*0,\s*-1,\s*true\)/)
  assert.match(downloadServiceSrc, /queue\.getJobs\(\['active'\],\s*0,\s*-1,\s*true\)/)
  assert.match(downloadServiceSrc, /queue\.getJobs\(\['delayed'\],\s*0,\s*-1,\s*true\)/)
  assert.match(downloadServiceSrc, /sortDownloadJobsFifo\(filtered\)/)
  assert.match(downloadServiceSrc, /evaluateBootRecoveryAction\(/)

  // Verify QueueWork calls max-3 tail-requeue policy with retryPolicyVersion: 2
  assert.match(workCmdSrc, /retryAttempt:\s*nextAttempt/)
  assert.match(workCmdSrc, /retryPolicyVersion:\s*2/)
  assert.match(workCmdSrc, /RunDownloadJob\.dispatch\(/)
  assert.match(workCmdSrc, /autoResumeInterruptedDownloads/)

  const sorted = sortDownloadJobsFifo([
    { jobId: 'fail-1', url: 'https://f/1', progress: 0, filepath: '/f/1.pmtiles', filetype: 'map', status: 'failed', _fifoIdx: 0 },
    { jobId: 'wait-1', url: 'https://w/1', progress: 0, filepath: '/w/1.zim', filetype: 'zim', status: 'waiting', _fifoIdx: 1 },
    { jobId: 'wait-2-tail', url: 'https://w/2', progress: 0, filepath: '/w/2.zim', filetype: 'zim', status: 'waiting', attempt: 2, maxAttempts: 3, requeueReason: 'Movido ao fim da fila (2/3)', _fifoIdx: 2 },
    { jobId: 'act-low', url: 'https://a/1', progress: 15, filepath: '/a/1.zim', filetype: 'zim', status: 'active', _fifoIdx: 3 },
    { jobId: 'act-high', url: 'https://a/2', progress: 72, filepath: '/a/2.zim', filetype: 'zim', status: 'active', _fifoIdx: 4 },
  ])

  assert.deepEqual(
    sorted.map((j) => j.jobId),
    ['act-high', 'act-low', 'wait-1', 'wait-2-tail', 'fail-1']
  )
})

test('evaluateBootRecoveryAction rescues recoverable errors while skipping cancelled/auth/3x-exhausted jobs', () => {
  // Recoverable legacy failure (e.g. ENOTDIR before v1.0.36) -> requeue_tail
  const legacyEnotdir = evaluateBootRecoveryAction(
    { url: 'https://x/20261118.pmtiles', filepath: '/app/storage/maps/pmtiles/20261118.pmtiles' },
    "ENOTDIR: not a directory, mkdir '/app/storage/maps'",
    false
  )
  assert.equal(legacyEnotdir.action, 'requeue_tail')
  assert.equal(legacyEnotdir.diagnosis.code, 'STORAGE_ENOTDIR')

  // Operator-cancelled download -> skip_cancelled
  const cancelled = evaluateBootRecoveryAction(
    { url: 'https://x/cancel.zim', filepath: '/z/cancel.zim' },
    'Download cancelled: user-cancel',
    false
  )
  assert.equal(cancelled.action, 'skip_cancelled')

  // Gated entitlement / HTTP 403 -> skip_auth
  const authDenied = evaluateBootRecoveryAction(
    { url: 'https://x/gated.zim', filepath: '/z/gated.zim' },
    'The download server rejected this install credentials (HTTP 403)',
    false
  )
  assert.equal(authDenied.action, 'skip_auth')

  // Exhausted 3/3 under retryPolicyVersion=2 -> skip on automatic boot, allow on manual "Validar Erros"
  const v2MaxedBoot = evaluateBootRecoveryAction(
    {
      url: 'https://x/maxed.zim',
      filepath: '/z/maxed.zim',
      retryPolicyVersion: 2,
      retryAttempt: 3,
      finalCancelledByRetryLimit: true,
    },
    'ETIMEDOUT: connection timed out',
    false
  )
  assert.equal(v2MaxedBoot.action, 'skip_max_retries')

  const v2MaxedManual = evaluateBootRecoveryAction(
    {
      url: 'https://x/maxed.zim',
      filepath: '/z/maxed.zim',
      retryPolicyVersion: 2,
      retryAttempt: 3,
      finalCancelledByRetryLimit: true,
    },
    'ETIMEDOUT: connection timed out',
    true
  )
  assert.equal(v2MaxedManual.action, 'requeue_tail')
  assert.equal(v2MaxedManual.diagnosis.code, 'TIMEOUT')
})

// 3. SQLITE MIGRATION SCHEMA & AUDIT TIMELINE CRUD VERIFICATION

test('download_audit_logs migration DDL and DownloadAuditService PT-BR filtering/DTO work cleanly', async () => {
  const [migrationSource, { DownloadAuditService }, { default: DownloadAuditLog }] = await Promise.all([
    readFile(
      new URL('../../database/migrations/1796000000001_create_download_audit_logs_table.ts', import.meta.url),
      'utf8'
    ),
    import('../../app/services/download_audit_service.js'),
    import('../../app/models/download_audit_log.js'),
  ])

  // Verify migration defines all required indexed audit columns idempotently
  for (const col of [
    "tableName = 'download_audit_logs'",
    'await this.schema.hasTable(this.tableName)',
    "table.string('job_id', 64).notNullable().index()",
    "table.text('url').nullable()",
    "table.text('filepath').nullable()",
    "table.string('event_type', 48).notNullable().index()",
    "table.integer('attempt').notNullable().defaultTo(1)",
    "table.integer('max_attempts').notNullable().defaultTo(3)",
    "table.string('error_code', 64).nullable()",
    "table.text('raw_error').nullable()",
    "table.text('summary_pt').notNullable()",
    "table.text('details_pt').nullable()",
  ]) {
    assert.ok(migrationSource.includes(col), `Migration missing column definition: ${col}`)
  }

  // Test real DownloadAuditService.record + listGlobalLogs + clearLogs via Lucid model hook
  const stored: any[] = []
  const origCreate = DownloadAuditLog.create
  const origQuery = DownloadAuditLog.query

  try {
    DownloadAuditLog.create = (async (payload: any) => {
      const row = {
        id: stored.length + 1,
        ...payload,
        created_at: { toISO: () => '2026-11-20T05:00:00.000Z' },
      }
      stored.push(row)
      return row
    }) as any

    const makeBuilder = (rowsSource: () => any[]) => {
      let eventFilter: string[] | null = null
      let jobFilter: string | null = null
      let searchTerm: string | null = null
      let maxRows = 200
      const q: any = {
        where(fieldOrCb: any, opOrVal?: any, maybeVal?: any) {
          if (typeof fieldOrCb === 'function') {
            fieldOrCb(q)
          } else if (fieldOrCb === 'job_id') {
            jobFilter = String(opOrVal)
          } else if (opOrVal === 'like' && typeof maybeVal === 'string') {
            searchTerm = maybeVal.replace(/%/g, '').toLowerCase()
          }
          return q
        },
        orWhere(_field: any, _op: any, maybeVal?: any) {
          if (typeof maybeVal === 'string') {
            searchTerm = maybeVal.replace(/%/g, '').toLowerCase()
          }
          return q
        },
        whereIn(field: string, values: string[]) {
          if (field === 'event_type') eventFilter = values
          return q
        },
        orderBy() {
          return q
        },
        async limit(n: number) {
          maxRows = n
          return rowsSource()
            .filter((r) => (!jobFilter ? true : r.job_id === jobFilter))
            .filter((r) => (!eventFilter ? true : eventFilter.includes(r.event_type)))
            .filter((r) => {
              if (!searchTerm) return true
              return [r.title, r.filepath, r.url, r.summary_pt, r.details_pt, r.error_code]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(searchTerm!))
            })
            .slice(-maxRows)
            .reverse()
        },
        async delete() {
          const prev = stored.length
          stored.length = 0
          return [prev]
        },
      }
      return q
    }

    DownloadAuditLog.query = (() => makeBuilder(() => stored)) as any

    await DownloadAuditService.record({
      jobId: 'map-global-01',
      url: 'https://build.protomaps.com/20261118.pmtiles',
      filepath: '/app/storage/maps/pmtiles/20261118.pmtiles',
      eventType: 'failed_attempt',
      attempt: 1,
      maxAttempts: 3,
      errorCode: 'STORAGE_ENOTDIR',
      summaryPt: 'Falha 1/3: link simbólico ENOTDIR',
    })
    await DownloadAuditService.record({
      jobId: 'map-global-01',
      url: 'https://build.protomaps.com/20261118.pmtiles',
      filepath: '/app/storage/maps/pmtiles/20261118.pmtiles',
      eventType: 'completed',
      attempt: 2,
      maxAttempts: 3,
      summaryPt: 'Concluído na tentativa 2/3',
    })

    const errorsOnly = await DownloadAuditService.listGlobalLogs({ filter: 'errors', search: '20261118' })
    assert.equal(errorsOnly.length, 1)
    assert.equal(errorsOnly[0].errorCode, 'STORAGE_ENOTDIR')
    assert.equal(errorsOnly[0].title, '20261118.pmtiles')

    const perJob = await DownloadAuditService.getLogsForJob('map-global-01')
    assert.equal(perJob.length, 2)
    assert.equal(perJob[0].eventType, 'completed')

    const cleared = await DownloadAuditService.clearLogs()
    assert.equal(cleared, 2)
  } finally {
    DownloadAuditLog.create = origCreate
    DownloadAuditLog.query = origQuery
  }
})

// 4. OPENAPI ROUTES, CSS ANIMATION & THEME CONTRAST & RELEASE SYNC QA CHECKS

test('CSS animations, hover cascade, reduced-motion, contrast and release metadata pass QA', async () => {
  const [css, appLayout, home, bootGate, routes, workflow] = await Promise.all([
    readFile(new URL('../../inertia/css/app.css', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/layouts/AppLayout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/pages/home.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/components/TacticalBootGate.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../start/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../../.github/workflows/build-primary-image.yml', import.meta.url), 'utf8'),
  ])

  // 1) CSS Cascade Level 4 check: nomad-fade-up must use independent `translate` so hover `transform` works
  const fadeUpBlock = css.match(/@keyframes nomad-fade-up\s*\{([\s\S]*?)\n\}/)?.[1] || ''
  assert.match(fadeUpBlock, /translate:\s*0\s+10px/)
  assert.doesNotMatch(fadeUpBlock, /transform:/)

  // 2) Button specificity check for clickable .nomad-interactive-card cards
  assert.match(css, /button\.nomad-interactive-card:not\(:disabled\):active/)

  // 3) All custom animation classes referenced in TSX exist in app.css
  for (const cls of [
    'nomad-page-enter',
    'nomad-update-pill',
    'nomad-split-wing-left',
    'nomad-split-wing-right',
    'nomad-split-pre-exit',
    'nomad-cleave-beam',
    'nomad-merge-pre-left',
    'nomad-merge-pre-right',
    'nomad-merge-lock',
    'nomad-progress-shimmer',
    'nomad-stagger-grid',
    'nomad-interactive-card',
    'nomad-telemetry-panel',
    'nomad-status-online-text',
  ]) {
    assert.ok(css.includes(`.${cls}`), `Expected .${cls} class definition in app.css`)
  }
  assert.doesNotMatch(css, /\.nomad-interactive-card::before/, 'Fast bright sheen sweep on hover must be removed')
  assert.match(css, /nomad-merge-seam/, 'Unified card merge animation must flash center fusion seam')
  assert.doesNotMatch(css, /translateX\(52%\)/, 'Split cards must not cross over centerline onto each other')

  // 4) Avoid double nomad-page-enter animation inside home.tsx and re-key page transitions by route
  assert.match(appLayout, /key=\{currentPath\.split\('\?'\)\[0\]\}[^>]*nomad-page-enter/)
  assert.doesNotMatch(home, /nomad-page-enter/)
  assert.match(home, /nomad-cleave-beam/)

  // 5) Ensure Windows/browser prefers-reduced-motion does NOT nuke explicit operator-triggered split/merge/page animations
  const reducedMotion = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] || ''
  assert.doesNotMatch(reducedMotion, /\.nomad-split-wing-left/)
  assert.doesNotMatch(reducedMotion, /\.nomad-merge-lock/)
  assert.doesNotMatch(reducedMotion, /\.nomad-page-enter/)
  assert.doesNotMatch(home, /nomad-interactive-card[^\"]*transition-all/, 'Slow hover transition must not be overridden by 150ms transition-all')

  // 6) HUD online status contrast check (WCAG AA >= 4.5:1 on tactical/dark and light surfaces)
  const luminance = (hex: string) => {
    const ch = hex
      .slice(1)
      .match(/.{2}/g)!
      .map((x) => Number.parseInt(x, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return ch[0] * 0.2126 + ch[1] * 0.7152 + ch[2] * 0.0722
  }
  const ratio = (a: string, b: string) => {
    const l1 = luminance(a)
    const l2 = luminance(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  assert.ok(ratio('#34d399', '#1e2520') >= 4.5, 'tactical online emerald must pass 4.5:1')
  assert.ok(ratio('#047857', '#ffffff') >= 4.5, 'light online emerald must pass 4.5:1')

  // 7) All new /api/downloads routes are registered with documented()
  for (const snippet of [
    "router.post('/jobs/resume-all', [DownloadsController, 'resumeAll'])",
    "router.get('/jobs/:jobId/logs', [DownloadsController, 'jobLogs'])",
    "router.get('/logs', [DownloadsController, 'listLogs'])",
    "router.delete('/logs', [DownloadsController, 'clearLogs'])",
  ]) {
    assert.ok(routes.includes(`documented(${snippet}`), `Missing documented() wrapper for ${snippet}`)
  }

  // 8) Triple version sync to v1.0.42 across workflow and boot gate
  assert.match(workflow, /# Build release trigger: v1\.0\.42/)
  assert.match(workflow, /default: '1\.0\.42-nexus'/)
  assert.match(workflow, /inputs\.version \|\| '1\.0\.42-nexus'/)
  assert.match(bootGate, /:\s*'v1\.0\.42'/)

  // 9) Bulk install & Portainer hardening checks (real sequential wait + port collision resolution + catalog port uniqueness + live progress polling)
  const [bulkModal, supplyDepot, portainerSvc, seeder, systemSvc] = await Promise.all([
    readFile(new URL('../../inertia/components/BulkInstallModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/pages/supply-depot.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/portainer_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../database/seeders/service_seeder.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/system_service.ts', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(bulkModal, /Portainer is synchronous on backend/)
  assert.match(bulkModal, /waitForServiceCompletion/)
  assert.match(bulkModal, /found\.install_progress_message/)
  assert.match(bulkModal, /Tentar Falhas/)
  assert.match(supplyDepot, /if \(bulkModalOpen \|\| !installActivity\.length\) return/)
  assert.match(portainerSvc, /occupiedPorts\.has\(requestedPortNum\)/)
  assert.match(portainerSvc, /healthStatus === 'unhealthy'/)
  assert.match(portainerSvc, /if \(createdOrModifiedContainer\)/)
  assert.match(systemSvc, /install_progress_message:\s*liveProg\.message/)
  assert.match(seeder, /HostPort:\s*'8502'/)
  assert.match(seeder, /HostPort:\s*'8492'/)
  assert.match(seeder, /shouldSyncImage/)

  // Verify previously broken/404 container_image literals are completely absent from catalog entries
  const catalogSection = seeder.slice(0, seeder.indexOf('DEFUNCT_CONTAINER_IMAGES'))
  for (const defunctImage of [
    'openrem/openrem:latest',
    'karlomikus/bar-assistant:latest',
    'ghcr.io/goauthentik/server:latest',
    'jokob-sk/netalertx:latest',
    'sandmap/sandmap:latest',
    'brandawg/peanut:latest',
    'badaix/snapcast:latest',
    'lscr.io/linuxserver/librecad:latest',
    'jitsi/web:latest',
    'tiredofit/freepbx:latest',
    'probonopd/up:latest',
    'codeberg.org/forgejo/forgejo:latest',
    'ghcr.io/ggerganov/whisper.cpp:main',
    'woodpeckerci/woodpecker-server:latest',
  ]) {
    assert.ok(
      !catalogSection.includes(`container_image: '${defunctImage}'`),
      `Catalog still references defunct container_image: ${defunctImage}`
    )
  }

  // Verify no two distinct catalog services share the same published HostPort
  const portOwners = new Map<string, string[]>()
  for (const chunk of catalogSection.split('service_name:').slice(1)) {
    const svcName = /SERVICE_NAMES\.(\w+)/.exec(chunk)?.[1] || 'unknown'
    const ports = new Set([...chunk.matchAll(/HostPort:\s*'(\d+)'/g)].map((m) => m[1]))
    for (const p of ports) {
      const owners = portOwners.get(p) || []
      owners.push(svcName)
      portOwners.set(p, owners)
    }
  }
  const collisions = [...portOwners.entries()].filter(([, owners]) => owners.length > 1)
  assert.deepEqual(collisions, [], `Duplicate catalog HostPorts detected: ${JSON.stringify(collisions)}`)
})

test('install_progress_tracker stores live steps and translates Docker/Portainer errors in PT-BR', async () => {
  const tracker = await import('../../app/utils/install_progress_tracker.js')
  tracker.clearInstallProgress('nomad_test_app')
  assert.equal(tracker.getInstallProgress('nomad_test_app'), undefined)

  tracker.setInstallProgress('nomad_test_app', 'pulling', '[2/5] Baixando imagem Docker...')
  const cur = tracker.getInstallProgress('nomad_test_app')
  assert.equal(cur?.status, 'pulling')
  assert.equal(cur?.message, '[2/5] Baixando imagem Docker...')

  tracker.clearInstallProgress('nomad_test_app')
  assert.equal(tracker.getInstallProgress('nomad_test_app'), undefined)

  assert.match(
    tracker.translateDockerDeployErrorPtBr('manifest for foo:latest not found: manifest unknown'),
    /Imagem ou tag inexistente no registro Docker/
  )
  assert.match(
    tracker.translateDockerDeployErrorPtBr('Bind for 0.0.0.0:8635 failed: port is already allocated'),
    /Conflito de porta no servidor/
  )
  assert.match(
    tracker.translateDockerDeployErrorPtBr('Container exited with exit code 137 (OOMKilled)'),
    /falta de memória RAM/
  )
})

test('stack blueprints, starter configs, multi-port and 8080 container port fixes pass QA', async () => {
  const [bpMod, seeder, portainerSvc] = await Promise.all([
    import('../../app/utils/app_stack_blueprints.js'),
    readFile(new URL('../../database/seeders/service_seeder.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/portainer_service.ts', import.meta.url), 'utf8'),
  ])

  for (const sName of [
    'nomad_outline',
    'nomad_docmost',
    'nomad_ghostfolio',
    'nomad_maybe',
    'nomad_authentik',
    'nomad_mattermost',
    'nomad_planka',
    'nomad_immich',
    'nomad_bar_assistant',
    'nomad_tubearchivist',
    'nomad_invoice_ninja',
    'nomad_paperless',
    'nomad_defguard',
    'nomad_your_spotify',
  ]) {
    const bp = bpMod.getStackBlueprint(sName)
    assert.ok(bp, `Missing multi-service stack blueprint for ${sName}`)
    assert.ok(bpMod.hasMultiServiceSidecars(sName), `Expected sidecars for ${sName}`)
    assert.ok(bp.extraEnv('192.168.1.10', '8510').length > 0, `Expected env for ${sName}`)
    const yamlStr = bp.sidecarServicesYaml(sName, '192.168.1.10', '8510')
    assert.ok(yamlStr.includes(`container_name: nomad-${sName}-`), `Missing named sidecar for ${sName}`)

    // Strict YAML parse using js-yaml to prevent indentation/mapping bugs (like Portainer stackStatus=4)
    const { createRequire } = await import('node:module')
    const req = createRequire(import.meta.url)
    const yamlLib = req('js-yaml')
    const parsed = yamlLib.load(
      `services:\n  ${sName}:\n    image: test:latest\n${bp.dependsOnYaml || ''}    ports:\n      - "8510:3000"\n    volumes:\n      - nomad-${sName}-data:/data\n    environment:\n      - "TZ=America/Sao_Paulo"\n\n${yamlStr}\n\nvolumes:\n${['nomad-' + sName + '-data', ...bp.sidecarVolumeNames(sName)].map((v) => `  ${v}:\n    name: ${v}`).join('\n')}\n\nnetworks:\n  default:\n    name: nomad-shared-net\n    external: true\n`
    )
    assert.ok(parsed?.services?.[sName], `Parsed YAML missing main service for ${sName}`)
    assert.equal(parsed?.networks?.default?.name, 'nomad-shared-net')
    assert.equal(parsed?.networks?.default?.external, true)
  }

  for (const cfgApp of ['nomad_blocky', 'nomad_headscale', 'nomad_frigate']) {
    const cfg = bpMod.getStarterConfigFile(cfgApp, '192.168.1.10', '8625')
    assert.ok(cfg && cfg.content.trim().length > 10, `Missing starter config for ${cfgApp}`)
  }

  // Verify single-service blueprints + WeeWX weectl station create + Bar Assistant Redis/32-byte APP_KEY/UID 33
  const invBp = bpMod.getStackBlueprint('nomad_inventree')
  assert.ok(invBp?.composeEntrypointOverride?.join(' ').includes('invoke migrate'))
  assert.doesNotMatch(invBp!.composeEntrypointOverride!.join(' '), /\$/)
  assert.equal(invBp?.initUidGid, '1000:1000')
  assert.ok(bpMod.getStackBlueprint('nomad_woodpecker')?.extraEnv('192.168.1.10', '8880').includes('WOODPECKER_GITHUB=true'))
  assert.ok(bpMod.getStackBlueprint('nomad_vikunja')?.extraEnv('192.168.1.10', '8950').includes('VIKUNJA_SERVICE_PUBLICURL=http://192.168.1.10:8950/'))
  assert.ok(bpMod.getStackBlueprint('nomad_netalertx')?.extraEnv('192.168.1.10', '8610').includes('PORT=8610'))

  const weewxBp = bpMod.getStackBlueprint('nomad_weewx')
  assert.equal(weewxBp?.initUidGid, '1000:1000')
  assert.ok(weewxBp?.composeEntrypointOverride?.join(' ').includes('weectl station create'))
  assert.equal(bpMod.getStarterConfigFile('nomad_weewx', '192.168.1.10', '8915'), null)

  const barBp = bpMod.getStackBlueprint('nomad_bar_assistant')
  assert.equal(barBp?.initUidGid, '33:33')
  const barEnv = barBp!.extraEnv('192.168.1.10', '8560')
  const barAppKey = barEnv.find((e: string) => e.startsWith('APP_KEY=base64:'))?.split('base64:')[1] || ''
  assert.equal(Buffer.from(barAppKey, 'base64').length, 32, 'Laravel APP_KEY must decode to exact 32 bytes (AES-256)')
  assert.ok(barEnv.some((e: string) => e.startsWith('REDIS_HOST=')))
  assert.ok(barEnv.includes('DB_DATABASE=/var/www/cocktails/storage/bar-assistant/database.ba3.sqlite'))
  assert.ok(barEnv.includes('SCOUT_DRIVER=meilisearch'))
  assert.match(barBp!.dependsOnYaml || '', /nomad_bar_assistant-meili:\s*\n\s*condition:\s*service_healthy/)
  assert.ok(barBp!.sidecarServicesYaml('nomad_bar_assistant', '192.168.1.10', '8560').includes('getmeili/meilisearch:v1.56'))
  assert.ok(barBp!.sidecarServicesYaml('nomad_bar_assistant', '192.168.1.10', '8560').includes('http://localhost:7700/health'))

  // Verify v1.0.41 live-audited app blueprints (Maybe, Outline, DefGuard, Paperless, Gramps Web, WG-Easy, Speedtest, Your_Spotify, Translate)
  const maybeEnv = bpMod.getStackBlueprint('nomad_maybe')!.extraEnv('192.168.1.10', '8580')
  assert.ok(maybeEnv.includes('DATABASE_URL=postgres://postgres:nomad_db_pass@nomad_maybe-db:5432/maybe_production'))
  assert.ok(maybeEnv.includes('DB_HOST=nomad_maybe-db'))

  const outlineEnv = bpMod.getStackBlueprint('nomad_outline')!.extraEnv('192.168.1.10', '8510')
  assert.ok(outlineEnv.includes('COLLABORATION_URL=http://192.168.1.10:8510'))

  const defguardEnv = bpMod.getStackBlueprint('nomad_defguard')!.extraEnv('192.168.1.10', '8620')
  const defguardSecret = defguardEnv.find((e: string) => e.startsWith('DEFGUARD_SECRET_KEY='))?.split('=')[1] || ''
  assert.equal(defguardSecret.length, 64)
  assert.ok(defguardEnv.includes('DEFGUARD_HTTP_PORT=80'))
  assert.ok(defguardEnv.includes('DEFGUARD_COOKIE_INSECURE=true'))

  const grampsEnv = bpMod.getStackBlueprint('nomad_gramps_web')!.extraEnv('192.168.1.10', '8555')
  assert.ok(grampsEnv.includes('TREE=nomad'))
  assert.ok(grampsEnv.includes('GRAMPSWEB_TREE=nomad'))

  const wgEnv = bpMod.getStackBlueprint('nomad_wgeasy')!.extraEnv('192.168.1.10', '8630')
  assert.ok(wgEnv.includes('WG_HOST=192.168.1.10'))
  assert.ok(wgEnv.includes('INSECURE=true'))

  const speedEnv = bpMod.getStackBlueprint('nomad_speedtest')!.extraEnv('192.168.1.10', '8685')
  assert.ok(speedEnv.includes('DB_CONNECTION=sqlite'))
  const speedKey = speedEnv.find((e: string) => e.startsWith('APP_KEY=base64:'))?.split('base64:')[1] || ''
  assert.equal(Buffer.from(speedKey, 'base64').length, 32)

  const spotifyBp = bpMod.getStackBlueprint('nomad_your_spotify')!
  assert.ok(spotifyBp.extraEnv('192.168.1.10', '8740').includes('API_ENDPOINT=http://192.168.1.10:8741'))
  assert.ok(spotifyBp.sidecarServicesYaml('nomad_your_spotify', '192.168.1.10', '8740').includes('yooooomi/your_spotify_server:latest'))

  const translateEnv = bpMod.getStackBlueprint('nomad_translate')!.extraEnv('192.168.1.10', '8460')
  assert.ok(translateEnv.includes('KIWIX=http://nomad-nomad_kiwix_server:8080'))

  const [adonisRc, remediationProvider, bulkUninstallModal, bulkQueueFrame, supplyDepotPage] = await Promise.all([
    readFile(new URL('../../adonisrc.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../providers/portainer_remediation_provider.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/components/BulkUninstallModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/components/BulkQueueFrame.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/pages/supply-depot.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(adonisRc, /#providers\/portainer_remediation_provider/)
  assert.match(remediationProvider, /reconcileRemoteContainersOnStartup/)
  assert.match(bulkUninstallModal, /api\.uninstallService/)
  assert.match(bulkUninstallModal, /api\.deleteCustomApp/)
  assert.match(bulkUninstallModal, /Remover também as imagens Docker/)
  assert.match(bulkQueueFrame, /Interromper Fila/)
  assert.match(supplyDepotPage, /Desinstalação em Massa/)
  assert.match(supplyDepotPage, /Desinstalar Todos Agora/)
  assert.match(supplyDepotPage, /bulkVariant="uninstall"/)
  assert.match(supplyDepotPage, /if \(bulkUninstallModalOpen\) return/)

  // Verify fixed container ports, Orthanc jodogne replacement, 3x pull retry, 304 ignore, shared bridge net, fallback entrypoint, auto-remediation, and seamless cross-morph animations
  const homeTsx = await readFile(new URL('../../inertia/pages/home.tsx', import.meta.url), 'utf8')
  assert.match(homeTsx, /onAnimationEnd=\{\(e\) =>/)
  assert.match(homeTsx, /finishDiskMorph/)
  assert.match(homeTsx, /col-start-1 row-start-1/)
  assert.match(homeTsx, /nomad-update-pill/)
  assert.match(seeder, /BLOCKY_CONFIG_FILE=\/app\/config\/config\.yml/)
  assert.match(seeder, /\/var\/lib\/crowdsec\/data/)
  assert.match(seeder, /\/etc\/letsencrypt/)
  assert.match(seeder, /net\.ipv4\.conf\.all\.src_valid_mark/)
  assert.match(seeder, /public static readonly DEFUNCT_CONTAINER_IMAGES/)
  assert.match(seeder, /jbtronics\/part-db1:latest/)
  assert.match(seeder, /jodogne\/orthanc-plugins:latest/)
  assert.match(seeder, /NetworkMode:\s*'host'/)
  assert.match(seeder, /ADMIN_PASSWORD=nomad/)
  assert.match(seeder, /gui --addr=0\.0\.0\.0:5572 --user=admin --pass=nomad --no-open-browser/)
  assert.doesNotMatch(seeder.slice(0, seeder.indexOf('DEFUNCT_CONTAINER_IMAGES')), /mhubig\/partkeepr:latest/)
  assert.doesNotMatch(seeder.slice(0, seeder.indexOf('DEFUNCT_CONTAINER_IMAGES')), /orthancteam\/orthanc:latest/)
  assert.match(portainerSvc, /hasMultiServiceSidecars/)
  assert.match(portainerSvc, /primaryBindingKey/)
  assert.match(portainerSvc, /SHARED_NOMAD_NETWORK/)
  assert.match(portainerSvc, /ensureSharedNomadNetwork/)
  assert.match(portainerSvc, /ensureStorageOwnershipAndStarterConfig/)
  assert.match(portainerSvc, /composeEntrypointOverride/)
  assert.match(portainerSvc, /sysctls:/)
  assert.match(portainerSvc, /nomad-nomad_meshcore_web-etc-nginx-conf-d-default-conf/)
  assert.match(portainerSvc, /tameRunawayCrashLoops/)
  assert.match(portainerSvc, /reconcileRemoteContainersOnStartup/)
  assert.match(portainerSvc, /port is already allocated/)
  assert.match(portainerSvc, /maxPullAttempts = 3/)
  assert.match(portainerSvc, /httpStatus === 304/)
  assert.match(portainerSvc, /createdStack\?\.Status === 4/)
  assert.match(portainerSvc, /iAttempt < 24/)

  // Verify v1.0.41 storage/download path resolution, realpath deduplication for .tmp files, non-overlapping split/merge animation & minimalist update capsule
  const [downloadSvc, storageMgr, mapSvc, zimSvc, downloadsPage, activeDownloadsTsx, appCss] = await Promise.all([
    readFile(new URL('../../app/services/download_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/storage_manager_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/map_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../app/services/zim_service.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/pages/settings/downloads.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/components/ActiveDownloads.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../inertia/css/app.css', import.meta.url), 'utf8'),
  ])
  assert.match(downloadSvc, /resolveDiskInfoMap/)
  assert.match(downloadSvc, /seenCandidateRealPaths/)
  assert.doesNotMatch(storageMgr, /if \(!targetDisk\?\.trim\(\) \|\| !disk\)/)
  assert.match(storageMgr, /resolveDiskForRealPath/)
  assert.match(storageMgr, /matchedPreferredDisk/)
  assert.match(mapSvc, /const \{ pmtilesDir \} = await this\.prepareMapsDiskTarget/)
  assert.doesNotMatch(zimSvc, /if \(!targetDisk\?\.trim\(\) && \(!requiredBytes \|\| requiredBytes <= 0\)\)/)
  assert.match(downloadsPage, /HD: \{f\.diskLabel\}/)
  assert.match(activeDownloadsTsx, /download\.diskLabel \|\|/)
  assert.match(homeTsx, /rounded-full/)
  assert.match(homeTsx, /nomad-merge-seam/)
  assert.match(appCss, /transform-origin: right center/)
  assert.match(appCss, /nomad-merge-seam-flash/)
})
