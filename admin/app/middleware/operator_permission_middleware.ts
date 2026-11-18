import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { OperatorAuthService } from '#services/operator_auth_service'
import { getRoleDefinition, type RoleLevel } from '../../types/auth.js'

export interface OperatorPermissionOptions {
  minLevel?: RoleLevel
}

export default class OperatorPermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: OperatorPermissionOptions = {}
  ) {
    if (process.env.NODE_ENV === 'test') {
      return next()
    }

    const minLevel: RoleLevel = options.minLevel ?? 1
    const status = await OperatorAuthService.getAuthStatus(ctx)

    // Before first-time setup completes (or if no DB operators exist yet), allow onboarding endpoints flow
    if (status.needsOnboarding || !status.hasOperators) {
      return next()
    }

    if (!status.authenticated || !status.operator) {
      return ctx.response.status(401).send({
        success: false,
        code: status.locked ? 'TERMINAL_LOCKED' : 'UNAUTHENTICATED',
        message: status.locked
          ? `Terminal bloqueado por ${status.lockedUsername || 'operador'}. Digite a senha para desbloquear.`
          : 'Sessão não autenticada. Faça login para continuar.',
      })
    }

    if (status.operator.roleLevel < minLevel) {
      const requiredDef = getRoleDefinition(minLevel)
      return ctx.response.status(403).send({
        success: false,
        code: 'INSUFFICIENT_PERMISSION',
        message: `Acesso negado: sua conta (${status.operator.shortLabel}) não possui permissão para esta ação. Exigido: ${requiredDef.title}.`,
      })
    }

    return next()
  }
}
