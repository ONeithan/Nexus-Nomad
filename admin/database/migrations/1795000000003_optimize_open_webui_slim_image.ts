import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.defer(async (db) => {
      const row = await db.from(this.tableName).where('service_name', 'nomad_open_webui').first()
      if (!row) return

      let cfg: any = {}
      try {
        cfg = typeof row.container_config === 'string' ? JSON.parse(row.container_config) : row.container_config || {}
      } catch {
        cfg = {}
      }

      const existingEnv: string[] = Array.isArray(cfg.Env) ? cfg.Env : []
      const ensureEnv = (key: string, val: string) => {
        if (!existingEnv.some((e) => e.startsWith(`${key}=`))) {
          existingEnv.push(`${key}=${val}`)
        }
      }
      ensureEnv('UVICORN_WORKERS', '1')
      ensureEnv('WEBUI_SECRET_KEY', 'nomad_open_webui_secret_key_2026')
      ensureEnv('ANONYMIZED_TELEMETRY', 'false')
      ensureEnv('DO_NOT_TRACK', 'true')
      ensureEnv('SCARF_NO_ANALYTICS', 'true')
      ensureEnv('ENABLE_COMMUNITY_SHARING', 'false')
      cfg.Env = existingEnv

      const updates: Record<string, any> = {
        container_image: 'ghcr.io/open-webui/open-webui:main-slim',
        container_config: JSON.stringify(cfg),
      }
      if (row.installation_status === 'error' || row.installation_status === 'installing') {
        updates.installation_status = 'idle'
      }

      await db.from(this.tableName).where('service_name', 'nomad_open_webui').update(updates)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('service_name', 'nomad_open_webui')
        .update({ container_image: 'ghcr.io/open-webui/open-webui:main' })
    })
  }
}
