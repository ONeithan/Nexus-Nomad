import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'

export default class CatalogController {
  async index({ inertia, request }: HttpContext) {
    const services = await Service.query().select('service_name', 'installed')
    const installedServiceNames = services.filter((s) => s.installed).map((s) => s.service_name)
    const initialAppId = request.input('app', null)
    const initialCategory = request.input('category', 'all')

    return inertia.render('catalog', {
      installedServiceNames,
      initialAppId,
      initialCategory,
    })
  }
}
