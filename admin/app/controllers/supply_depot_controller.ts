import { SystemService } from '#services/system_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class SupplyDepotController {
  constructor(private systemService: SystemService) {}

  async index({ inertia }: HttpContext) {
    const [services, portainer] = await Promise.all([
      this.systemService.getServices({ installedOnly: false }),
      this.systemService.getPortainerStatus(),
    ])
    return inertia.render('supply-depot', {
      system: { services },
      portainer,
    })
  }
}
