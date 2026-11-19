import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.defer(async (db) => {
      const row = await db.from(this.tableName).where('service_name', 'nomad_filebrowser').first()
      if (!row) return

      let cfg: any = {}
      try {
        cfg =
          typeof row.container_config === 'string'
            ? JSON.parse(row.container_config)
            : row.container_config || {}
      } catch {
        cfg = {}
      }

      if (!cfg.HostConfig) cfg.HostConfig = {}
      const existingBinds: string[] = Array.isArray(cfg.HostConfig.Binds) ? [...cfg.HostConfig.Binds] : []

      // Infer storage root from existing filebrowser/files or zim bind
      const firstBind = existingBinds.find((b) => b.includes('/filebrowser/')) || existingBinds[0] || ''
      const detectedRoot =
        firstBind.includes('/filebrowser/')
          ? firstBind.slice(0, firstBind.indexOf('/filebrowser/'))
          : '/opt/project-nomad/storage'

      const extraBinds = [
        `${detectedRoot}/downloads:/srv/downloads`,
        '/mnt:/mnt',
        '/media:/media',
        '/mnt:/srv/discos-mnt',
        '/media:/srv/discos-media',
      ]

      const existingDests = new Set(
        existingBinds.map((b) => {
          const parts = b.split(':')
          return parts[1] || ''
        })
      )

      for (const bind of extraBinds) {
        const dest = bind.split(':')[1] || ''
        if (dest && !existingDests.has(dest)) {
          existingBinds.push(bind)
          existingDests.add(dest)
        }
      }

      cfg.HostConfig.Binds = existingBinds

      await db
        .from(this.tableName)
        .where('service_name', 'nomad_filebrowser')
        .update({ container_config: JSON.stringify(cfg) })
    })
  }

  async down() {
    // Non-destructive
  }
}
