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
    'nomad-split-wing-left',
    'nomad-split-wing-right',
    'nomad-split-pre-exit',
    'nomad-merge-pre-left',
    'nomad-merge-pre-right',
    'nomad-merge-lock',
    'nomad-progress-shimmer',
    'nomad-stagger-grid',
    'nomad-interactive-card',
    'nomad-status-online-text',
  ]) {
    assert.ok(css.includes(`.${cls}`), `Expected .${cls} class definition in app.css`)
  }

  // 4) Avoid double nomad-page-enter animation inside home.tsx (already provided by AppLayout.tsx)
  assert.match(appLayout, /nomad-page-enter/)
  assert.doesNotMatch(home, /nomad-page-enter/)

  // 5) Reduced-motion accessibility includes split & merge choreography
  const reducedMotion = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] || ''
  for (const cls of [
    '.nomad-split-wing-left',
    '.nomad-split-wing-right',
    '.nomad-split-pre-exit',
    '.nomad-merge-pre-left',
    '.nomad-merge-pre-right',
    '.nomad-merge-lock',
  ]) {
    assert.ok(reducedMotion.includes(cls), `reduced-motion rule missing ${cls}`)
  }

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

  // 8) Triple version sync to v1.0.37 across workflow and boot gate
  assert.match(workflow, /# Build release trigger: v1\.0\.37/)
  assert.match(workflow, /default: '1\.0\.37-nexus'/)
  assert.match(workflow, /inputs\.version \|\| '1\.0\.37-nexus'/)
  assert.match(bootGate, /:\s*'v1\.0\.37'/)
})
