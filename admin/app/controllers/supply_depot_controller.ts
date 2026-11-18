import { SystemService } from '#services/system_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class SupplyDepotController {
  constructor(private systemService: SystemService) {}

  async index({ inertia }: HttpContext) {
    const KVStore = (await import('#models/kv_store')).default
    const [services, portainer, savedTarget, autoUseDefault] = await Promise.all([
      this.systemService.getServices({ installedOnly: false }),
      this.systemService.getPortainerStatus(),
      KVStore.getValue('portainer.deployTarget').catch(() => null),
      KVStore.getValue('portainer.autoUseDefaultTarget').catch(() => false),
    ])
    const deployTarget: 'local' | 'portainer' =
      savedTarget === 'portainer' && portainer?.enabled ? 'portainer' : 'local'
    return inertia.render('supply-depot', {
      system: { services },
      portainer: portainer
        ? {
            ...portainer,
            deployTarget,
            autoUseDefaultTarget: Boolean(autoUseDefault),
          }
        : undefined,
    })
  }
}
