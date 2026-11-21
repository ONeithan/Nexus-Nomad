import logger from '@adonisjs/core/services/logger'
import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Automatically stabilizes and repairs broken/restarting remote NOMAD containers
 * managed by Portainer right after startup or a NOMAD version upgrade.
 *
 * Step 1 (immediate): disables restart policy and stops any runaway crash-looping
 * `nomad-nomad_*` containers so they cannot exhaust host CPU/RAM.
 * Step 2 (sequential): redeploys broken/stale containers using the latest catalog
 * configs and Stack Blueprints with a cooldown pause between services.
 */
export default class PortainerRemediationProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    if (this.app.getEnvironment() !== 'web') return

    setImmediate(() => {
      setTimeout(async () => {
        try {
          const { PortainerService } = await import('#services/portainer_service')
          const portainerService = new PortainerService()
          await portainerService.reconcileRemoteContainersOnStartup()
        } catch (err: any) {
          logger.warn(
            `[PortainerRemediationProvider] Auto-remediation skipped: ${err?.message ?? err}`
          )
        }
      }, 6000)
    })
  }
}
