import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { StorageManagerService } from '#services/storage_manager_service'
import KVStore from '#models/kv_store'

@inject()
export default class StorageController {
  constructor(private storageManager: StorageManagerService) {}

  async overview({ response }: HttpContext) {
    const data = await this.storageManager.getStorageOverview()
    return response.ok(data)
  }

  async browse({ request, response }: HttpContext) {
    try {
      const path = request.input('path') as string | undefined
      const data = await this.storageManager.browsePath(path)
      return response.ok(data)
    } catch (error: any) {
      return response.badRequest({ error: error.message || 'Erro ao listar diretório.' })
    }
  }

  async move({ request, response }: HttpContext) {
    try {
      const { sourcePath, destDir, createSymlink = true } = request.only([
        'sourcePath',
        'destDir',
        'createSymlink',
      ])
      if (!sourcePath || !destDir) {
        return response.badRequest({ error: 'Informe origem e destino.' })
      }
      const result = await this.storageManager.moveContent(
        sourcePath,
        destDir,
        Boolean(createSymlink)
      )
      return response.ok(result)
    } catch (error: any) {
      return response.badRequest({ error: error.message || 'Erro ao mover arquivo.' })
    }
  }

  async delete({ request, response }: HttpContext) {
    try {
      const { path } = request.only(['path'])
      if (!path) return response.badRequest({ error: 'Caminho não informado.' })
      const result = await this.storageManager.deleteContent(path)
      return response.ok(result)
    } catch (error: any) {
      return response.badRequest({ error: error.message || 'Erro ao excluir.' })
    }
  }

  async mkdir({ request, response }: HttpContext) {
    try {
      const { parentDir, name } = request.only(['parentDir', 'name'])
      if (!parentDir || !name) {
        return response.badRequest({ error: 'Informe diretório pai e nome da pasta.' })
      }
      const result = await this.storageManager.createDirectory(parentDir, name)
      return response.ok(result)
    } catch (error: any) {
      return response.badRequest({ error: error.message || 'Erro ao criar pasta.' })
    }
  }

  async setPreferredDisk({ request, response }: HttpContext) {
    const { path } = request.only(['path'])
    await KVStore.setValue('storage.preferredDownloadDisk', path || '')
    return response.ok({ success: true, preferredDownloadDisk: path || '' })
  }

  async sambaStatus({ response }: HttpContext) {
    const status = await this.storageManager.getSambaStatus()
    return response.ok(status)
  }

  async configureSamba({ request, response }: HttpContext) {
    const { enabled, shareName, username, password, hostPath } = request.only([
      'enabled',
      'shareName',
      'username',
      'password',
      'hostPath',
    ])
    const result = await this.storageManager.configureSamba({
      enabled: Boolean(enabled),
      shareName: shareName || 'nomad-biblioteca',
      username: username || 'nomad',
      password: password || 'nomad123',
      hostPath: hostPath || '',
    })
    return response.ok(result)
  }
}

