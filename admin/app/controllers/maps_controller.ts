import { MapService } from '#services/map_service'
import MapMarker from '#models/map_marker'
import {
  assertNotPrivateUrl,
  downloadCollectionValidator,
  filenameParamValidator,
  mapExtractPreflightValidator,
  mapExtractValidator,
  optionalTargetDiskValidator,
  remoteDownloadValidator,
  remoteDownloadValidatorOptional,
} from '#validators/common'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

@inject()
export default class MapsController {
  constructor(private mapService: MapService) {}

  async index({ inertia }: HttpContext) {
    const baseAssetsCheck = await this.mapService.ensureBaseAssets()
    const [regionFiles, worldBasemapExists] = await Promise.all([
      this.mapService.listRegions(),
      this.mapService.checkWorldBasemapExists(),
    ])
    return inertia.render('maps', {
      maps: {
        baseAssetsExist: baseAssetsCheck,
        worldBasemapExists,
        regionFiles: regionFiles.files,
        storage: regionFiles.storage,
      },
    })
  }

  async downloadBaseAssets({ request, response }: HttpContext) {
    const payload = await request.validateUsing(remoteDownloadValidatorOptional)
    if (payload.url) assertNotPrivateUrl(payload.url)
    try {
      await this.mapService.downloadBaseAssets(payload.url, payload.targetDisk)
      return { success: true }
    } catch (error: any) {
      return response.badRequest({ message: error?.message || 'Erro ao baixar recursos básicos do mapa.' })
    }
  }

  async setupWorldBasemap({ request, response }: HttpContext) {
    try {
      const { targetDisk } = await request.validateUsing(optionalTargetDiskValidator)
      const ready = await this.mapService.provisionWorldBasemap(targetDisk)
      if (!ready) {
        return response.status(500).send({
          message:
            'Could not download the base map. Please connect this NOMAD to the internet and try again.',
        })
      }
      return { success: true }
    } catch (error: any) {
      const msg = error?.message || ''
      if (msg.includes('Limite de espaço') || msg.includes('Espaço livre insuficiente')) {
        return response.badRequest({ message: msg })
      }
      return response.status(500).send({
        message:
          'Could not download the base map. Please connect this NOMAD to the internet and try again.',
      })
    }
  }

  async downloadRemote({ request, response }: HttpContext) {
    const payload = await request.validateUsing(remoteDownloadValidator)
    assertNotPrivateUrl(payload.url)
    try {
      const filename = await this.mapService.downloadRemote(payload.url, payload.targetDisk)
      return {
        message: 'Download started successfully',
        filename,
        url: payload.url,
      }
    } catch (error: any) {
      return response.badRequest({ message: error?.message || 'Erro ao iniciar download do mapa.' })
    }
  }

  async downloadCollection({ request, response }: HttpContext) {
    const payload = await request.validateUsing(downloadCollectionValidator)
    try {
      const resources = await this.mapService.downloadCollection(payload.slug, payload.targetDisk)
      return {
        message: 'Collection download started successfully',
        slug: payload.slug,
        resources,
      }
    } catch (error: any) {
      return response.badRequest({ message: error?.message || 'Erro ao iniciar download da coleção.' })
    }
  }

  // For providing a "preflight" check in the UI before actually starting a background download
  async downloadRemotePreflight({ request }: HttpContext) {
    const payload = await request.validateUsing(remoteDownloadValidator)
    assertNotPrivateUrl(payload.url)
    const info = await this.mapService.downloadRemotePreflight(payload.url)
    return info
  }

  async fetchLatestCollections({}: HttpContext) {
    const success = await this.mapService.fetchLatestCollections()
    return { success }
  }

  async listCuratedCollections({}: HttpContext) {
    return await this.mapService.listCuratedCollections()
  }

  async listRegions({}: HttpContext) {
    return await this.mapService.listRegions()
  }

  async globalMapInfo({}: HttpContext) {
    return await this.mapService.getGlobalMapInfo()
  }

  async downloadGlobalMap({ request, response }: HttpContext) {
    try {
      const { targetDisk } = await request.validateUsing(optionalTargetDiskValidator)
      const result = await this.mapService.downloadGlobalMap(targetDisk)
      return {
        message: 'Download started successfully',
        ...result,
      }
    } catch (error: any) {
      return response.badRequest({ message: error?.message || 'Erro ao iniciar download do mapa global.' })
    }
  }

  async listCountries({}: HttpContext) {
    return { countries: await this.mapService.listCountries() }
  }

  async listCountryGroups({}: HttpContext) {
    return { groups: await this.mapService.listCountryGroups() }
  }

  async extractPreflight({ request }: HttpContext) {
    const payload = await request.validateUsing(mapExtractPreflightValidator)
    return await this.mapService.extractPreflight(payload)
  }

  async extractRegion({ request, response }: HttpContext) {
    const payload = await request.validateUsing(mapExtractValidator)
    try {
      const result = await this.mapService.extractRegion(payload)
      return {
        message: 'Extract started successfully',
        ...result,
      }
    } catch (error: any) {
      return response.badRequest({ message: error?.message || 'Erro ao iniciar extração da região.' })
    }
  }

  async styles({ request, response }: HttpContext) {
    // Automatically ensure base assets are present before generating styles
    const baseAssetsExist = await this.mapService.ensureBaseAssets()
    if (!baseAssetsExist) {
      return response.status(500).send({
        message:
          'Base map assets are missing and could not be downloaded. Please check your connection and try again.',
      })
    }

    const forwardedProto = request.headers()['x-forwarded-proto'];

    const protocol: string = forwardedProto
      ? (typeof forwardedProto === 'string' ? forwardedProto : request.protocol())
      : request.protocol();

    const styles = await this.mapService.generateStylesJSON(request.host(), protocol)
    return response.json(styles)
  }

  async delete({ request, response }: HttpContext) {
    const payload = await request.validateUsing(filenameParamValidator)

    try {
      await this.mapService.delete(payload.params.filename)
    } catch (error) {
      if (error.message === 'not_found') {
        return response.status(404).send({
          message: `Map file with key ${payload.params.filename} not found`,
        })
      }
      throw error // Re-throw any other errors and let the global error handler catch
    }

    return {
      message: 'Map file deleted successfully',
    }
  }

  // --- Map Markers ---

  async listMarkers({}: HttpContext) {
    return await MapMarker.query().orderBy('created_at', 'asc')
  }

  async createMarker({ request }: HttpContext) {
    const payload = await request.validateUsing(
      vine.compile(
        vine.object({
          name: vine.string().trim().minLength(1).maxLength(255),
          longitude: vine.number().min(-180).max(180),
          latitude: vine.number().min(-90).max(90),
          color: vine.string().trim().maxLength(20).optional(),
          custom_color: vine.string().trim().maxLength(7).nullable().optional(),
          icon: vine.string().trim().maxLength(50).nullable().optional(),
          icon_color: vine.string().trim().maxLength(7).nullable().optional(),
          visible: vine.boolean().optional(),
          notes: vine.string().trim().maxLength(500).nullable().optional(),
          marker_type: vine.string().trim().maxLength(20).optional(),
        })
      )
    )

    const marker = await MapMarker.create({
      name: payload.name,
      longitude: payload.longitude,
      latitude: payload.latitude,
      color: payload.color ?? 'orange',
      custom_color: payload.custom_color ?? null,
      icon: payload.icon ?? null,
      icon_color: payload.icon_color ?? null,
      visible: payload.visible ?? true,
      notes: payload.notes ?? null,
      marker_type: payload.marker_type ?? 'pin',
    })

    return marker
  }

  async updateMarker({ request, response }: HttpContext) {
    const { id } = request.params()
    const marker = await MapMarker.find(id)

    if (!marker) {
      return response.status(404).send({ message: 'Marker not found' })
    }

    const payload = await request.validateUsing(
      vine.compile(
        vine.object({
          name: vine.string().trim().minLength(1).maxLength(255).optional(),
          color: vine.string().trim().maxLength(20).optional(),
          custom_color: vine.string().trim().maxLength(7).nullable().optional(),
          icon: vine.string().trim().maxLength(50).nullable().optional(),
          icon_color: vine.string().trim().maxLength(7).nullable().optional(),
          visible: vine.boolean().optional(),
          longitude: vine.number().min(-180).max(180).optional(),
          latitude: vine.number().min(-90).max(90).optional(),
          notes: vine.string().trim().maxLength(500).nullable().optional(),
          marker_type: vine.string().trim().maxLength(20).optional(),
        })
      )
    )

    if (payload.name !== undefined) marker.name = payload.name
    if (payload.color !== undefined) marker.color = payload.color
    if (payload.custom_color !== undefined) marker.custom_color = payload.custom_color
    if (payload.icon !== undefined) marker.icon = payload.icon
    if (payload.icon_color !== undefined) marker.icon_color = payload.icon_color
    if (payload.visible !== undefined) marker.visible = payload.visible
    if (payload.longitude !== undefined) marker.longitude = payload.longitude
    if (payload.latitude !== undefined) marker.latitude = payload.latitude
    if (payload.notes !== undefined) marker.notes = payload.notes
    if (payload.marker_type !== undefined) marker.marker_type = payload.marker_type

    await marker.save()
    return marker
  }

  async deleteMarker({ request, response }: HttpContext) {
    const { id } = request.params()
    const marker = await MapMarker.find(id)
    if (!marker) {
      return response.status(404).send({ message: 'Marker not found' })
    }
    await marker.delete()
    return { message: 'Marker deleted' }
  }
}
