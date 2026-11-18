import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import NomadOperator from '#models/nomad_operator'
import NomadOperatorSession from '#models/nomad_operator_session'
import KVStore from '#models/kv_store'
import {
  getRoleDefinition,
  type AuthSessionSummary,
  type AuthStatusPayload,
  type OperatorPublic,
  type RoleLevel,
} from '../../types/auth.js'

const SESSION_COOKIE_NAME = 'nomad_session'
const REONBOARDING_KV_KEY = 'auth.v1029ReonboardingDone'

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function clampRoleLevel(level: unknown): RoleLevel {
  const n = Number(level)
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n
  return 2
}

export function serializeOperator(op: NomadOperator): OperatorPublic {
  const level = clampRoleLevel(op.role_level)
  const def = getRoleDefinition(level)
  return {
    id: op.id,
    username: op.username,
    roleLevel: level,
    shortLabel: def.shortLabel,
    badgeLabel: def.badgeLabel,
    isActive: Boolean(op.is_active),
    createdBy: op.created_by ?? null,
    lastLoginAt: op.last_login_at ? op.last_login_at.toISO() : null,
    createdAt: op.created_at ? op.created_at.toISO() || '' : '',
  }
}

export class OperatorAuthService {
  static extractSessionToken(ctx: HttpContext): string | null {
    try {
      const fromPlain = ctx.request.plainCookie(SESSION_COOKIE_NAME, { encoded: false })
      if (typeof fromPlain === 'string' && fromPlain.length >= 32) {
        return fromPlain
      }
    } catch {}

    const rawHeader = ctx.request.header('cookie') || ''
    if (!rawHeader) return null
    for (const part of rawHeader.split(';')) {
      const idx = part.indexOf('=')
      if (idx === -1) continue
      const k = part.slice(0, idx).trim()
      if (k === SESSION_COOKIE_NAME) {
        const v = decodeURIComponent(part.slice(idx + 1).trim())
        if (v.length >= 32) return v
      }
    }
    return null
  }

  static attachSessionCookie(ctx: HttpContext, rawToken: string, remember: boolean): void {
    ctx.response.plainCookie(SESSION_COOKIE_NAME, rawToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      encode: false,
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
    })
  }

  static clearSessionCookie(ctx: HttpContext): void {
    ctx.response.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
  }

  static async createSession(
    ctx: HttpContext,
    operator: NomadOperator,
    remember = true
  ): Promise<string> {
    const rawToken = randomBytes(36).toString('hex')
    const now = DateTime.now()
    const expiresAt = remember ? now.plus({ days: 30 }) : now.plus({ hours: 12 })

    await NomadOperatorSession.create({
      token_hash: sha256(rawToken),
      operator_id: operator.id,
      ip_address: ctx.request.ip() || null,
      user_agent: String(ctx.request.header('user-agent') || '').slice(0, 250) || null,
      is_locked: false,
      remember,
      expires_at: expiresAt,
      last_seen_at: now,
    })

    operator.last_login_at = now
    await operator.save()

    this.attachSessionCookie(ctx, rawToken, remember)
    return rawToken
  }

  static async getAuthStatus(ctx: HttpContext): Promise<AuthStatusPayload> {
    const currentIp = ctx.request.ip() || null
    let reonboardingDone = false
    let operatorCount = 0

    try {
      reonboardingDone = (await KVStore.getValue(REONBOARDING_KV_KEY)) === true
    } catch {
      reonboardingDone = false
    }

    try {
      const countRow = await NomadOperator.query().count('* as total').first()
      operatorCount = Number(countRow?.$extras?.total ?? 0)
    } catch {
      operatorCount = 0
    }

    const hasOperators = operatorCount > 0
    const needsOnboarding = !reonboardingDone || !hasOperators

    if (needsOnboarding) {
      return {
        needsOnboarding: true,
        hasOperators,
        authenticated: false,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: null,
        currentIp,
      }
    }

    const rawToken = this.extractSessionToken(ctx)
    if (!rawToken) {
      return {
        needsOnboarding: false,
        hasOperators: true,
        authenticated: false,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: null,
        currentIp,
      }
    }

    try {
      const session = await NomadOperatorSession.query()
        .where('token_hash', sha256(rawToken))
        .preload('operator')
        .first()

      if (!session || !session.operator || !session.operator.is_active) {
        if (session) await session.delete().catch(() => {})
        this.clearSessionCookie(ctx)
        return {
          needsOnboarding: false,
          hasOperators: true,
          authenticated: false,
          locked: false,
          lockedUsername: null,
          lockedRoleLabel: null,
          operator: null,
          currentIp,
        }
      }

      if (session.expires_at < DateTime.now()) {
        await session.delete().catch(() => {})
        this.clearSessionCookie(ctx)
        return {
          needsOnboarding: false,
          hasOperators: true,
          authenticated: false,
          locked: false,
          lockedUsername: null,
          lockedRoleLabel: null,
          operator: null,
          currentIp,
        }
      }

      // Update last_seen_at gently (max once every 60s)
      const now = DateTime.now()
      if (!session.last_seen_at || now.diff(session.last_seen_at, 'seconds').seconds > 60) {
        session.last_seen_at = now
        session.ip_address = currentIp
        await session.save().catch(() => {})
      }

      const publicOp = serializeOperator(session.operator)
      if (session.is_locked) {
        return {
          needsOnboarding: false,
          hasOperators: true,
          authenticated: false,
          locked: true,
          lockedUsername: publicOp.username,
          lockedRoleLabel: publicOp.badgeLabel,
          operator: null,
          currentIp,
        }
      }

      return {
        needsOnboarding: false,
        hasOperators: true,
        authenticated: true,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: publicOp,
        currentIp,
      }
    } catch (err: any) {
      logger.error(`[OperatorAuthService] getAuthStatus failed: ${err?.message}`)
      return {
        needsOnboarding: false,
        hasOperators: true,
        authenticated: false,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: null,
        currentIp,
      }
    }
  }

  static async performInitialSetup(
    ctx: HttpContext,
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; operator?: OperatorPublic; message?: string }> {
    const username = usernameInput.trim()
    if (username.length < 2 || username.length > 60) {
      return { success: false, message: 'O nome de operador deve ter entre 2 e 60 caracteres.' }
    }
    if (!passwordInput || passwordInput.length < 4 || passwordInput.length > 128) {
      return { success: false, message: 'A senha deve ter entre 4 e 128 caracteres.' }
    }

    const status = await this.getAuthStatus(ctx)
    if (!status.needsOnboarding) {
      return {
        success: false,
        message: 'A configuração inicial já foi concluída. Faça login com seu usuário existente.',
      }
    }

    // One-time v1.0.29 re-onboarding cleanup so prior broken client auth records never block creation
    await NomadOperatorSession.query().delete().catch(() => {})
    await NomadOperator.query().delete().catch(() => {})
    await KVStore.clearValue('auth.operators').catch(() => {})

    const passwordHash = await hash.make(passwordInput)
    const op = await NomadOperator.create({
      username,
      username_lower: username.toLowerCase(),
      password_hash: passwordHash,
      role_level: 5,
      is_active: true,
      created_by: username,
    })

    await KVStore.setValue(REONBOARDING_KV_KEY, true)
    await this.createSession(ctx, op, true)

    return {
      success: true,
      operator: serializeOperator(op),
    }
  }

  static async login(
    ctx: HttpContext,
    usernameInput: string,
    passwordInput: string,
    remember = true
  ): Promise<{ success: boolean; operator?: OperatorPublic; message?: string }> {
    const cleanUser = usernameInput.trim()
    if (!cleanUser || !passwordInput) {
      return { success: false, message: 'Informe o nome do operador e a senha de acesso.' }
    }

    const op = await NomadOperator.query().where('username_lower', cleanUser.toLowerCase()).first()
    if (!op) {
      return { success: false, message: 'Usuário ou senha incorretos.' }
    }
    if (!op.is_active) {
      return {
        success: false,
        message: 'Esta conta de operador está desativada pelo Administrador.',
      }
    }

    const valid = await hash.verify(op.password_hash, passwordInput).catch(() => false)
    if (!valid) {
      return { success: false, message: 'Usuário ou senha incorretos.' }
    }

    // Remove previous cookie session if replacing cleanly
    const prevToken = this.extractSessionToken(ctx)
    if (prevToken) {
      await NomadOperatorSession.query().where('token_hash', sha256(prevToken)).delete().catch(() => {})
    }

    await this.createSession(ctx, op, remember)
    return {
      success: true,
      operator: serializeOperator(op),
    }
  }

  static async lockSession(
    ctx: HttpContext
  ): Promise<{ success: boolean; lockedUsername?: string; message?: string }> {
    const rawToken = this.extractSessionToken(ctx)
    if (!rawToken) {
      return { success: false, message: 'Nenhuma sessão ativa para bloquear.' }
    }

    const session = await NomadOperatorSession.query()
      .where('token_hash', sha256(rawToken))
      .preload('operator')
      .first()

    if (!session || !session.operator) {
      this.clearSessionCookie(ctx)
      return { success: false, message: 'Sessão inválida ou expirada.' }
    }

    session.is_locked = true
    await session.save()

    return {
      success: true,
      lockedUsername: session.operator.username,
    }
  }

  static async unlockSession(
    ctx: HttpContext,
    passwordInput: string
  ): Promise<{ success: boolean; operator?: OperatorPublic; message?: string }> {
    if (!passwordInput) {
      return { success: false, message: 'Digite sua senha para desbloquear o terminal.' }
    }

    const rawToken = this.extractSessionToken(ctx)
    if (!rawToken) {
      return {
        success: false,
        message: 'Sessão de bloqueio não encontrada neste navegador. Clique em Deslogar / Trocar Usuário.',
      }
    }

    const session = await NomadOperatorSession.query()
      .where('token_hash', sha256(rawToken))
      .preload('operator')
      .first()

    if (!session || !session.operator || !session.operator.is_active) {
      if (session) await session.delete().catch(() => {})
      this.clearSessionCookie(ctx)
      return { success: false, message: 'Sessão expirada ou operador desativado.' }
    }

    const valid = await hash.verify(session.operator.password_hash, passwordInput).catch(() => false)
    if (!valid) {
      return {
        success: false,
        message: `Senha incorreta para o operador ${session.operator.username}.`,
      }
    }

    const now = DateTime.now()
    session.is_locked = false
    session.last_seen_at = now
    session.expires_at = session.remember ? now.plus({ days: 30 }) : now.plus({ hours: 12 })
    await session.save()

    this.attachSessionCookie(ctx, rawToken, session.remember)

    return {
      success: true,
      operator: serializeOperator(session.operator),
    }
  }

  static async logout(ctx: HttpContext): Promise<void> {
    const rawToken = this.extractSessionToken(ctx)
    if (rawToken) {
      await NomadOperatorSession.query().where('token_hash', sha256(rawToken)).delete().catch(() => {})
    }
    this.clearSessionCookie(ctx)
  }

  static async listOperators(): Promise<{
    operators: OperatorPublic[]
    sessions: AuthSessionSummary[]
  }> {
    const [operators, sessions] = await Promise.all([
      NomadOperator.query().orderBy('role_level', 'desc').orderBy('id', 'asc'),
      NomadOperatorSession.query()
        .where('expires_at', '>', DateTime.now().toSQL()!)
        .preload('operator')
        .orderBy('last_seen_at', 'desc'),
    ])

    return {
      operators: operators.map(serializeOperator),
      sessions: sessions
        .filter((s) => Boolean(s.operator))
        .map((s) => ({
          id: s.id,
          operatorId: s.operator_id,
          username: s.operator.username,
          roleLevel: clampRoleLevel(s.operator.role_level),
          ipAddress: s.ip_address,
          userAgent: s.user_agent,
          isLocked: Boolean(s.is_locked),
          lastSeenAt: s.last_seen_at ? s.last_seen_at.toISO() : null,
          expiresAt: s.expires_at ? s.expires_at.toISO() || '' : '',
        })),
    }
  }
}
