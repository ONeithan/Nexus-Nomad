import hash from '@adonisjs/core/services/hash'
import type { HttpContext } from '@adonisjs/core/http'
import NomadOperator from '#models/nomad_operator'
import NomadOperatorSession from '#models/nomad_operator_session'
import { OperatorAuthService, serializeOperator } from '#services/operator_auth_service'
import { ROLE_LEVEL_DEFINITIONS, type RoleLevel } from '../../types/auth.js'

function parseRoleLevel(val: unknown): RoleLevel | null {
  const num = Number(val)
  if (num === 1 || num === 2 || num === 3 || num === 4 || num === 5) return num
  return null
}

export default class AuthController {
  async status(ctx: HttpContext) {
    const state = await OperatorAuthService.getAuthStatus(ctx)
    return ctx.response.send({
      ...state,
      roleDefinitions: ROLE_LEVEL_DEFINITIONS,
    })
  }

  async setup(ctx: HttpContext) {
    const body = ctx.request.body() || {}
    const username = String(body.username || '')
    const password = String(body.password || '')

    const res = await OperatorAuthService.performInitialSetup(ctx, username, password)
    if (!res.success) {
      return ctx.response.status(400).send(res)
    }
    return ctx.response.send({
      success: true,
      operator: res.operator,
    })
  }

  async login(ctx: HttpContext) {
    const body = ctx.request.body() || {}
    const username = String(body.username || '')
    const password = String(body.password || '')
    const remember = body.remember !== false

    const res = await OperatorAuthService.login(ctx, username, password, remember)
    if (!res.success) {
      return ctx.response.status(401).send(res)
    }
    return ctx.response.send({
      success: true,
      operator: res.operator,
    })
  }

  async lock(ctx: HttpContext) {
    const res = await OperatorAuthService.lockSession(ctx)
    if (!res.success) {
      return ctx.response.status(400).send(res)
    }
    return ctx.response.send(res)
  }

  async unlock(ctx: HttpContext) {
    const body = ctx.request.body() || {}
    const password = String(body.password || '')

    const res = await OperatorAuthService.unlockSession(ctx, password)
    if (!res.success) {
      return ctx.response.status(401).send(res)
    }
    return ctx.response.send({
      success: true,
      operator: res.operator,
    })
  }

  async logout(ctx: HttpContext) {
    await OperatorAuthService.logout(ctx)
    return ctx.response.send({ success: true })
  }

  async changePassword(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({
        success: false,
        message: 'Sessão não autenticada. Faça login novamente.',
      })
    }

    const body = ctx.request.body() || {}
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')

    if (newPassword.length < 4 || newPassword.length > 128) {
      return ctx.response.status(400).send({
        success: false,
        message: 'A nova senha deve ter entre 4 e 128 caracteres.',
      })
    }

    const op = await NomadOperator.find(status.operator.id)
    if (!op) {
      return ctx.response.status(404).send({
        success: false,
        message: 'Operador não encontrado no banco de dados.',
      })
    }

    const valid = await hash.verify(op.password_hash, currentPassword).catch(() => false)
    if (!valid) {
      return ctx.response.status(401).send({
        success: false,
        message: 'A senha atual informada está incorreta.',
      })
    }

    op.password_hash = await hash.make(newPassword)
    await op.save()

    return ctx.response.send({
      success: true,
      message: 'Senha atualizada com sucesso no banco de dados.',
    })
  }

  async listOperators(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({ success: false, message: 'Não autenticado.' })
    }

    if (status.operator.roleLevel < 5) {
      return ctx.response.send({
        success: true,
        currentOperator: status.operator,
        operators: [status.operator],
        sessions: [],
        roleDefinitions: ROLE_LEVEL_DEFINITIONS,
        canManageOperators: false,
      })
    }

    const { operators, sessions } = await OperatorAuthService.listOperators()
    return ctx.response.send({
      success: true,
      currentOperator: status.operator,
      operators,
      sessions,
      roleDefinitions: ROLE_LEVEL_DEFINITIONS,
      canManageOperators: true,
    })
  }

  async createOperator(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({ success: false, message: 'Não autenticado.' })
    }
    if (status.operator.roleLevel < 5) {
      return ctx.response.status(403).send({
        success: false,
        message: 'Somente administradores Nível 5 podem cadastrar novos operadores.',
      })
    }

    const body = ctx.request.body() || {}
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    const roleLevel = parseRoleLevel(body.roleLevel)

    if (username.length < 2 || username.length > 60) {
      return ctx.response.status(400).send({
        success: false,
        message: 'O nome do operador deve ter entre 2 e 60 caracteres.',
      })
    }
    if (password.length < 4 || password.length > 128) {
      return ctx.response.status(400).send({
        success: false,
        message: 'A senha deve ter entre 4 e 128 caracteres.',
      })
    }
    if (!roleLevel) {
      return ctx.response.status(400).send({
        success: false,
        message: 'Selecione um nível de permissão válido (1 a 5).',
      })
    }

    const existing = await NomadOperator.query()
      .where('username_lower', username.toLowerCase())
      .first()
    if (existing) {
      return ctx.response.status(409).send({
        success: false,
        message: `Já existe um operador cadastrado com o nome "${existing.username}".`,
      })
    }

    const op = await NomadOperator.create({
      username,
      username_lower: username.toLowerCase(),
      password_hash: await hash.make(password),
      role_level: roleLevel,
      is_active: true,
      created_by: status.operator.username,
    })

    return ctx.response.status(201).send({
      success: true,
      operator: serializeOperator(op),
      message: `Operador "${op.username}" cadastrado no banco de dados.`,
    })
  }

  async updateOperator(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({ success: false, message: 'Não autenticado.' })
    }
    if (status.operator.roleLevel < 5) {
      return ctx.response.status(403).send({
        success: false,
        message: 'Somente administradores Nível 5 podem editar outros operadores.',
      })
    }

    const id = Number(ctx.params.id)
    const target = await NomadOperator.find(id)
    if (!target) {
      return ctx.response.status(404).send({
        success: false,
        message: 'Operador não encontrado.',
      })
    }

    const body = ctx.request.body() || {}
    const nextRole =
      body.roleLevel !== undefined ? parseRoleLevel(body.roleLevel) : (target.role_level as RoleLevel)
    if (!nextRole) {
      return ctx.response.status(400).send({
        success: false,
        message: 'Nível de permissão inválido (use valores de 1 a 5).',
      })
    }

    const nextActive =
      typeof body.isActive === 'boolean' ? body.isActive : Boolean(target.is_active)

    // Ensure at least one active Level 5 administrator always remains in DB
    const isDemotingOrDeactivatingAdmin =
      target.role_level === 5 && target.is_active && (nextRole < 5 || !nextActive)

    if (isDemotingOrDeactivatingAdmin) {
      const otherAdmins = await NomadOperator.query()
        .where('role_level', 5)
        .where('is_active', true)
        .whereNot('id', target.id)
      if (otherAdmins.length === 0) {
        return ctx.response.status(400).send({
          success: false,
          message: 'Deve existir pelo menos um administrador Nível 5 ativo no sistema.',
        })
      }
    }

    if (body.username !== undefined) {
      const cleanName = String(body.username || '').trim()
      if (cleanName.length < 2 || cleanName.length > 60) {
        return ctx.response.status(400).send({
          success: false,
          message: 'O nome de operador deve ter entre 2 e 60 caracteres.',
        })
      }
      const conflict = await NomadOperator.query()
        .where('username_lower', cleanName.toLowerCase())
        .whereNot('id', target.id)
        .first()
      if (conflict) {
        return ctx.response.status(409).send({
          success: false,
          message: `Nome de usuário "${cleanName}" já está em uso.`,
        })
      }
      target.username = cleanName
      target.username_lower = cleanName.toLowerCase()
    }

    if (body.newPassword && String(body.newPassword).length > 0) {
      const np = String(body.newPassword)
      if (np.length < 4 || np.length > 128) {
        return ctx.response.status(400).send({
          success: false,
          message: 'A nova senha deve ter entre 4 e 128 caracteres.',
        })
      }
      target.password_hash = await hash.make(np)
    }

    target.role_level = nextRole
    target.is_active = nextActive
    await target.save()

    if (!nextActive) {
      await NomadOperatorSession.query().where('operator_id', target.id).delete().catch(() => {})
    }

    return ctx.response.send({
      success: true,
      operator: serializeOperator(target),
      message: `Operador "${target.username}" atualizado.`,
    })
  }

  async deleteOperator(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({ success: false, message: 'Não autenticado.' })
    }
    if (status.operator.roleLevel < 5) {
      return ctx.response.status(403).send({
        success: false,
        message: 'Somente administradores Nível 5 podem excluir operadores.',
      })
    }

    const id = Number(ctx.params.id)
    if (id === status.operator.id) {
      return ctx.response.status(400).send({
        success: false,
        message: 'Você não pode excluir sua própria conta enquanto estiver conectado nela.',
      })
    }

    const target = await NomadOperator.find(id)
    if (!target) {
      return ctx.response.status(404).send({
        success: false,
        message: 'Operador não encontrado.',
      })
    }

    if (target.role_level === 5 && target.is_active) {
      const otherAdmins = await NomadOperator.query()
        .where('role_level', 5)
        .where('is_active', true)
        .whereNot('id', target.id)
      if (otherAdmins.length === 0) {
        return ctx.response.status(400).send({
          success: false,
          message: 'Não é possível excluir o único administrador Nível 5 ativo.',
        })
      }
    }

    await NomadOperatorSession.query().where('operator_id', target.id).delete().catch(() => {})
    await target.delete()

    return ctx.response.send({
      success: true,
      message: `Operador "${target.username}" removido com sucesso.`,
    })
  }

  async revokeSession(ctx: HttpContext) {
    const status = await OperatorAuthService.getAuthStatus(ctx)
    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({ success: false, message: 'Não autenticado.' })
    }
    if (status.operator.roleLevel < 5) {
      return ctx.response.status(403).send({
        success: false,
        message: 'Somente administradores Nível 5 podem encerrar sessões de outros dispositivos.',
      })
    }

    const id = Number(ctx.params.id)
    const session = await NomadOperatorSession.find(id)
    if (!session) {
      return ctx.response.status(404).send({ success: false, message: 'Sessão não encontrada.' })
    }

    await session.delete()
    return ctx.response.send({ success: true, message: 'Sessão desconectada com sucesso.' })
  }
}
