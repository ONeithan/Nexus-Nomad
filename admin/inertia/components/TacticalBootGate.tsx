import React, { useState, useEffect, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'
import type { AuthStatusPayload } from '../../types/auth'

const LEGACY_STORAGE_KEYS = [
  'nomad_tactical_auth_v4',
  'nomad_auth_db_v3',
  'nomad_auth_db_v2',
  'nomad_session_unlocked_v4',
]
const PENDING_APP_ACTION_KEY = 'nomad:pending_app_action'

export interface PendingAppAction {
  action: 'install' | 'uninstall' | 'reinstall'
  appName: string
  target: 'local' | 'portainer'
}

export function setPendingAppAction(payload: PendingAppAction) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(PENDING_APP_ACTION_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

function consumePendingAppAction(): PendingAppAction | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_APP_ACTION_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_APP_ACTION_KEY)
    const parsed = JSON.parse(raw)
    if (parsed && parsed.appName && parsed.action) {
      return parsed as PendingAppAction
    }
  } catch {
    // ignore
  }
  return null
}

// Flag em memória do documento: evita repetir o boot rápido durante navegação SPA interna.
let hasBootedInCurrentDocument = false
let latestAuthStatusCache: AuthStatusPayload | null = null

function clearLegacyClientAuthStorage() {
  if (typeof window === 'undefined') return
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {}
  }
}

function updateCachedAuthStatus(next: AuthStatusPayload | null) {
  latestAuthStatusCache = next
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nomad:operator-updated'))
  }
}

export function getActiveOperator(
  authInput?: AuthStatusPayload | string | null
): { username: string; level: string; roleLevel: number; shortLabel: string } {
  const payload =
    authInput && typeof authInput === 'object' ? authInput : latestAuthStatusCache
  const op = payload?.operator
  if (op) {
    return {
      username: op.username,
      level: op.badgeLabel,
      roleLevel: op.roleLevel,
      shortLabel: op.shortLabel,
    }
  }
  if (payload?.locked && payload.lockedUsername) {
    return {
      username: payload.lockedUsername,
      level: payload.lockedRoleLabel || 'TERMINAL BLOQUEADO',
      roleLevel: 0,
      shortLabel: 'Bloqueado',
    }
  }
  return {
    username: 'Operador',
    level: 'NÍVEL 05 // ADMIN TOTAL',
    roleLevel: 5,
    shortLabel: 'Admin Total',
  }
}

export async function lockTacticalConsole() {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/auth/lock', { method: 'POST', credentials: 'same-origin' })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      updateCachedAuthStatus({
        needsOnboarding: false,
        hasOperators: true,
        authenticated: false,
        locked: true,
        lockedUsername: data.lockedUsername || latestAuthStatusCache?.operator?.username || null,
        lockedRoleLabel: latestAuthStatusCache?.operator?.badgeLabel || null,
        operator: null,
      })
      window.dispatchEvent(
        new CustomEvent('nomad:lock-console', {
          detail: { lockedUsername: data.lockedUsername || '' },
        })
      )
      return
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('nomad:lock-console'))
}

export async function logoutTacticalConsole() {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  } catch {}
  updateCachedAuthStatus({
    needsOnboarding: false,
    hasOperators: true,
    authenticated: false,
    locked: false,
    lockedUsername: null,
    lockedRoleLabel: null,
    operator: null,
  })
  window.dispatchEvent(new CustomEvent('nomad:logout-console'))
}

export function rebootNomadSystem() {
  if (typeof window === 'undefined') return
  hasBootedInCurrentDocument = false
  window.dispatchEvent(new CustomEvent('nomad:system-reboot'))
}

type BootStage =
  | 'UNLOCKED'
  | 'CRT_POWERON'
  | 'COLD_BOOT_OS'
  | 'RECOVERY_TERMINAL'
  | 'CLEAN_BOOT_OS'
  | 'LOGIN_SCREEN'
  | 'FINALIZING'

type RecoverySubStep =
  | 'AWAIT_HELP'
  | 'AWAIT_LOGIN'
  | 'CREATING_USER'
  | 'AWAIT_INICIAR'
  | 'STABILIZING'

const BOOT_SCOPED_CSS = `
  #nomad-boot-gate-root,
  #nomad-boot-gate-root * {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #nomad-boot-gate-root {
    background-color: #080b09 !important;
    color: #e5ece6 !important;
    font-family: 'Chakra Petch', 'Barlow', sans-serif !important;
  }

  #nomad-boot-gate-root .font-stencil {
    font-family: 'Black Ops One', 'Chakra Petch', sans-serif !important;
    letter-spacing: 0.05em;
  }

  #nomad-boot-gate-root .font-mono-mil {
    font-family: 'JetBrains Mono', 'Share Tech Mono', Consolas, monospace !important;
  }

  #nomad-boot-gate-root .crt-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99990;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%),
                linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
    background-size: 100% 4px, 6px 100%;
  }

  #nomad-boot-gate-root .crt-beam-roll {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 140px;
    background: linear-gradient(to bottom, transparent, rgba(74, 222, 128, 0.04), transparent);
    pointer-events: none;
    z-index: 99991;
    animation: nomad-crt-roll 6s linear infinite;
  }

  @keyframes nomad-crt-roll {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(105vh); }
  }

  @keyframes nomad-crt-poweron-beam {
    0% {
      transform: scaleX(0) scaleY(1);
      opacity: 0;
    }
    15% {
      transform: scaleX(0.08) scaleY(1);
      opacity: 0.9;
    }
    40% {
      transform: scaleX(1) scaleY(1.5);
      opacity: 1;
      box-shadow: 0 0 30px 6px #4ade80, 0 0 60px 14px #ffffff;
    }
    75% {
      transform: scaleX(1) scaleY(180);
      opacity: 0.65;
      background: #86efac;
    }
    100% {
      transform: scaleX(1) scaleY(500);
      opacity: 0;
    }
  }

  #nomad-boot-gate-root .crt-beam-flash {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    margin-top: -1px;
    background: #ffffff;
    box-shadow: 0 0 20px 4px #4ade80, 0 0 40px 8px #ffffff;
    animation: nomad-crt-poweron-beam 1.75s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }

  @keyframes nomad-mil-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  #nomad-boot-gate-root .mil-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #27352a;
    border-top-color: #c2a677;
    border-radius: 50%;
    animation: nomad-mil-spin 0.9s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  #nomad-boot-gate-root.crt-glitching {
    animation: nomad-crt-glitch-cycle 0.18s ease-in-out;
  }

  @keyframes nomad-crt-glitch-cycle {
    0% {
      transform: translate(0, 0) skewX(0deg);
      filter: brightness(1) contrast(1);
    }
    20% {
      transform: translate(-2.5px, 1px) skewX(-0.5deg);
      filter: brightness(1.3) contrast(1.2);
    }
    40% {
      transform: translate(2px, -1.5px) skewX(0.4deg);
      filter: brightness(0.85);
    }
    60% {
      transform: translate(-1.5px, 1.5px) skewX(-0.3deg);
      filter: brightness(1.2);
    }
    80% {
      transform: translate(1.5px, -0.5px);
      filter: brightness(1.05);
    }
    100% {
      transform: translate(0, 0) skewX(0deg);
      filter: brightness(1) contrast(1);
    }
  }

  #nomad-boot-gate-root.crt-glitching .terminal-container,
  #nomad-boot-gate-root.crt-glitching .boot-box-panel {
    text-shadow: 2px 0 rgba(239, 68, 68, 0.75), -2px 0 rgba(56, 189, 248, 0.75);
  }

  #nomad-boot-gate-root .boot-chamfer {
    clip-path: polygon(
      12px 0, calc(100% - 12px) 0,
      100% 12px, 100% calc(100% - 12px),
      calc(100% - 12px) 100%, 12px 100%,
      0 calc(100% - 12px), 0 12px
    );
  }

  #nomad-boot-gate-root .terminal-container {
    width: 100%;
    max-width: 860px;
    margin: 0 auto;
    background: #0c120e !important;
    border: 2px solid #3d4d40 !important;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.9) !important;
  }

  #nomad-boot-gate-root .terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    background: #141b16 !important;
    border-bottom: 1px solid #27352a !important;
    font-size: 11px;
  }

  #nomad-boot-gate-root .terminal-body {
    padding: 18px 20px;
    font-family: 'JetBrains Mono', 'Share Tech Mono', Consolas, monospace !important;
    font-size: 12.5px;
    line-height: 1.6;
    color: #c2d6c6 !important;
    min-height: 360px;
    max-height: 62vh;
    overflow-y: auto;
  }

  #nomad-boot-gate-root .terminal-input-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    background: #090e0b !important;
    border-top: 1px solid #27352a !important;
    font-family: 'JetBrains Mono', 'Share Tech Mono', Consolas, monospace !important;
    font-size: 13px;
  }

  #nomad-boot-gate-root .terminal-input-bar input {
    flex: 1;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    color: #ffffff !important;
    font-family: inherit !important;
    font-size: inherit !important;
  }

  #nomad-boot-gate-root .terminal-cursor {
    display: inline-block;
    width: 8px;
    height: 1.15em;
    background-color: #c2a677;
    vertical-align: middle;
    animation: nomad-blink-cur 0.75s step-start infinite;
  }

  @keyframes nomad-blink-cur {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  #nomad-boot-gate-root .mil-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    flex-shrink: 0;
    background: linear-gradient(180deg, #1d2720 0%, #111813 100%) !important;
    border: 1px solid #4d6050 !important;
    color: #c2a677 !important;
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'JetBrains Mono', 'Share Tech Mono', Consolas, monospace !important;
  }

  #nomad-boot-gate-root .mil-btn:hover {
    background: linear-gradient(180deg, #2a382e 0%, #17221b 100%) !important;
    border-color: #4ade80 !important;
    color: #ffffff !important;
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.25) !important;
  }

  #nomad-boot-gate-root .mil-input {
    width: 100%;
    height: 36px;
    background: #080d09 !important;
    border: 1px solid #3e4f41 !important;
    border-radius: 4px;
    padding: 0 12px;
    color: #ffffff !important;
    font-family: 'JetBrains Mono', 'Share Tech Mono', Consolas, monospace !important;
    font-size: 12px;
    outline: none;
  }

  #nomad-boot-gate-root .mil-input:focus {
    border-color: #c2a677 !important;
    box-shadow: 0 0 8px rgba(194, 166, 119, 0.3) !important;
  }

  #nomad-boot-gate-root .mil-input::placeholder {
    color: #475569 !important;
  }

  #nomad-boot-gate-root .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 600px) {
    #nomad-boot-gate-root .form-grid-2 {
      grid-template-columns: 1fr;
    }
  }
`

export default function TacticalBootGate({ children }: { children: React.ReactNode }) {
  const { authUser, appVersion } = usePage<{
    authUser?: AuthStatusPayload | null
    appVersion?: string
  }>().props
  const displayVersion =
    appVersion && appVersion !== '0.0.0' && appVersion !== 'dev'
      ? `v${appVersion.replace(/^v/i, '').replace(/-nexus$/i, '')}`
      : 'v1.0.37'

  const [authState, setAuthState] = useState<AuthStatusPayload | null>(() => {
    if (authUser) {
      latestAuthStatusCache = authUser
      return authUser
    }
    return latestAuthStatusCache
  })

  useEffect(() => {
    if (authUser) {
      latestAuthStatusCache = authUser
      setAuthState(authUser)
    }
  }, [authUser])

  const [stage, setStage] = useState<BootStage>(() => {
    const initial = authUser ?? latestAuthStatusCache
    if (initial?.needsOnboarding) {
      return 'CRT_POWERON'
    }
    if (initial?.locked || (!initial?.authenticated && initial?.hasOperators)) {
      return 'LOGIN_SCREEN'
    }
    if (!hasBootedInCurrentDocument && initial?.authenticated) {
      return 'CLEAN_BOOT_OS'
    }
    return 'UNLOCKED'
  })
  const [recoveryStep, setRecoveryStep] = useState<RecoverySubStep>('AWAIT_HELP')
  const [bootPct, setBootPct] = useState(0)
  const [bootStatus, setBootStatus] = useState('INICIALIZANDO NEXUS N.O.M.A.D. OS...')
  const [bootLogs, setBootLogs] = useState<Array<{ msg: string; color: string }>>([])
  const [introLines, setIntroLines] = useState<string[]>([])
  const [recoveryLogs, setRecoveryLogs] = useState<string[]>([])
  const [recoveryHint, setRecoveryHint] = useState<string>('')
  const [cmdInput, setCmdInput] = useState('')
  const [glitching, setGlitching] = useState(false)

  // Master Operator Registration states
  const [regUser, setRegUser] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [showRegPass1, setShowRegPass1] = useState(false)
  const [showRegPass2, setShowRegPass2] = useState(false)
  const [regError, setRegError] = useState('')
  const [tpmProgressVisible, setTpmProgressVisible] = useState(false)
  const [tpmPct, setTpmPct] = useState(0)
  const [tpmStatus, setTpmStatus] = useState('CRIPTOGRAFANDO CREDENCIAIS NO BANCO LOCAL...')
  const [regSubmitting, setRegSubmitting] = useState(false)

  // Login / Unlock states
  const [loginUser, setLoginUser] = useState(() => authUser?.lockedUsername || '')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [rememberSession, setRememberSession] = useState(true)
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  // Finalizing stage states
  const [finPct] = useState(0)
  const [finStatus] = useState('Sincronizando subsistemas táticos e módulos offline...')

  const terminalBodyRef = useRef<HTMLDivElement>(null)
  const bootLogRef = useRef<HTMLDivElement>(null)
  const recoveryInputRef = useRef<HTMLInputElement>(null)
  const initialBootStartedRef = useRef(false)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>>>([])

  const registerTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const registerInterval = (fn: () => void, ms: number) => {
    const id = setInterval(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const clearAllTimers = () => {
    for (const id of timersRef.current) {
      clearTimeout(id)
      clearInterval(id)
    }
    timersRef.current = []
  }

  const triggerGlitch = (duration = 180) => {
    setGlitching(true)
    registerTimeout(() => setGlitching(false), duration)
  }

  useEffect(() => {
    let mounted = true
    const bootStartedThisMount = hasBootedInCurrentDocument

    async function initGate() {
      let currentStatus: AuthStatusPayload | null = authUser ?? null
      try {
        const res = await fetch('/api/auth/status', {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data && typeof data === 'object' && typeof data.needsOnboarding === 'boolean') {
            currentStatus = data as AuthStatusPayload
          }
        }
      } catch {
        // Fallback to Inertia prop when network hiccups
      }

      if (!mounted) return

      if (currentStatus) {
        updateCachedAuthStatus(currentStatus)
        setAuthState(currentStatus)
      }

      if (currentStatus?.needsOnboarding) {
        clearLegacyClientAuthStorage()
        if (!bootStartedThisMount && !initialBootStartedRef.current) {
          initialBootStartedRef.current = true
          hasBootedInCurrentDocument = true
          startColdBootSequence()
        } else {
          hasBootedInCurrentDocument = true
          startFirstBootRecovery()
        }
        return
      }

      if (currentStatus?.locked) {
        hasBootedInCurrentDocument = true
        setLoginUser(currentStatus.lockedUsername || '')
        setLoginPass('')
        setLoginError('')
        setStage('LOGIN_SCREEN')
        return
      }

      if (currentStatus && !currentStatus.authenticated && currentStatus.hasOperators) {
        hasBootedInCurrentDocument = true
        setLoginUser('')
        setLoginPass('')
        setLoginError('')
        setStage('LOGIN_SCREEN')
        return
      }

      if (!bootStartedThisMount && !initialBootStartedRef.current) {
        initialBootStartedRef.current = true
        hasBootedInCurrentDocument = true
        runCleanStabilizedOSBoot('UNLOCKED', 280, false)
      } else {
        hasBootedInCurrentDocument = true
        setStage('UNLOCKED')
      }
    }

    initGate()

    const handleLock = (ev: Event) => {
      const detail = (ev as CustomEvent<{ lockedUsername?: string }>)?.detail
      const targetUser =
        detail?.lockedUsername ||
        latestAuthStatusCache?.lockedUsername ||
        latestAuthStatusCache?.operator?.username ||
        ''
      setAuthState((prev) => ({
        needsOnboarding: false,
        hasOperators: true,
        authenticated: false,
        locked: true,
        lockedUsername: targetUser || null,
        lockedRoleLabel: prev?.operator?.badgeLabel || prev?.lockedRoleLabel || null,
        operator: null,
      }))
      setLoginUser(targetUser)
      setLoginPass('')
      setLoginError('')
      setStage('LOGIN_SCREEN')
    }

    const handleLogout = () => {
      setAuthState({
        needsOnboarding: false,
        hasOperators: true,
        authenticated: false,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: null,
      })
      setLoginUser('')
      setLoginPass('')
      setLoginError('')
      setStage('LOGIN_SCREEN')
    }

    const handleLockNoOp = () => {
      startFirstBootRecovery()
      setRecoveryStep('CREATING_USER')
      setRecoveryHint('FORM')
    }

    const handleReboot = () => {
      clearAllTimers()
      setLoginPass('')
      setLoginError('')

      // Dispara o restart do contêiner em paralelo e já exibe a animação imediatamente
      fetch('/api/system/restart-nomad', { method: 'POST', credentials: 'same-origin' }).catch(() => null)

      hasBootedInCurrentDocument = true
      runCleanStabilizedOSBoot('UNLOCKED', 420, true)
    }

    window.addEventListener('nomad:lock-console', handleLock)
    window.addEventListener('nomad:logout-console', handleLogout)
    window.addEventListener('nomad:lock-no-operator', handleLockNoOp)
    window.addEventListener('nomad:system-reboot', handleReboot)
    return () => {
      mounted = false
      clearAllTimers()
      window.removeEventListener('nomad:lock-console', handleLock)
      window.removeEventListener('nomad:logout-console', handleLogout)
      window.removeEventListener('nomad:lock-no-operator', handleLockNoOp)
      window.removeEventListener('nomad:system-reboot', handleReboot)
    }
  }, [])

  // Auto-scroll recovery terminal
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [introLines, recoveryLogs, recoveryStep, tpmProgressVisible])

  // Auto-scroll boot log
  useEffect(() => {
    if (bootLogRef.current) {
      bootLogRef.current.scrollTop = bootLogRef.current.scrollHeight
    }
  }, [bootLogs])

  // Periodic subtle glitch only during RECOVERY_TERMINAL
  useEffect(() => {
    if (stage !== 'RECOVERY_TERMINAL') return
    const timer = setInterval(() => {
      triggerGlitch(160)
    }, 5200)
    return () => clearInterval(timer)
  }, [stage])

  function startColdBootSequence() {
    setStage('CRT_POWERON')
    setBootPct(0)
    setBootLogs([])
    setIntroLines([])
    setRecoveryLogs([])
    setRecoveryHint('')

    setTimeout(() => {
      setStage('COLD_BOOT_OS')
      const bootSteps = [
        {
          pct: 12,
          status: 'CARREGANDO BIOS MIL-STD-810H...',
          msg: '[ 0.0012 ] BIOS CHECKSUM OK // HARDWARE RUGGEDIZADO NEXUS-01',
          color: '#4ade80',
        },
        {
          pct: 28,
          status: 'INICIALIZANDO KERNEL N.O.M.A.D...',
          msg: '[ 0.0410 ] CARREGANDO IMAGEM DO KERNEL /boot/vmlinuz-nomad-mil...',
          color: '#a1b8a6',
        },
        {
          pct: 46,
          status: 'MONTANDO MATRIZ NVME CRIPTOGRAFADA...',
          msg: '[ 0.1184 ] /dev/nvme0n1 DETECTADO // VERIFICANDO PARTIÇÕES...',
          color: '#a1b8a6',
        },
        {
          pct: 64,
          status: 'CARREGANDO BANCO DE AUTENTICAÇÃO...',
          msg: '[ 0.2091 ] PROCURANDO TABELA DE OPERADORES (MySQL // nomad_operators)...',
          color: '#eab308',
        },
        {
          pct: 79,
          status: 'ALERTA: FALHA DE INTEGRIDADE DETECTADA!',
          msg: '[ ERRO 0x7B ] BANCO DE CREDENCIAIS VAZIO OU CORROMPIDO!',
          color: '#ef4444',
        },
        {
          pct: 84,
          status: 'ABORTANDO BOOT NORMAL // ENTRANDO EM RECOVERY...',
          msg: '[ FATAL ] KERNEL PANIC: NENHUM OPERADOR MESTRE REGISTRADO. REDIRECIONANDO PARA TTY1...',
          color: '#ef4444',
        },
      ]

      let idx = 0
      const runNext = () => {
        if (idx < bootSteps.length) {
          const item = bootSteps[idx]
          setBootPct(item.pct)
          setBootStatus(item.status)
          setBootLogs((prev) => [...prev, { msg: item.msg, color: item.color }])
          if (item.pct >= 79) triggerGlitch(140)
          idx++
          setTimeout(runNext, 850)
        } else {
          setTimeout(() => {
            triggerGlitch(280)
            startFirstBootRecovery()
          }, 950)
        }
      }
      setTimeout(runNext, 450)
    }, 1750)
  }

  function startFirstBootRecovery() {
    setStage('RECOVERY_TERMINAL')
    setRecoveryStep('AWAIT_HELP')
    setIntroLines([])
    setRecoveryLogs([])
    setRecoveryHint('')

    const staticLines = [
      '<div style="color: #eab308; font-weight: bold;">[ ▲ ALERTA DE ENERGIA CRÍTICA // BATERIA 14% // ALIMENTAÇÃO AUXILIAR INSTÁVEL ]</div>',
      '<div style="color: #8fa692;">[ DETECTADO HARDWARE MILITAR RUGGEDIZADO NEXUS-01 // MODO OFF-GRID ]</div>',
      '<div style="color: #ef4444; font-weight: bold;">[ KERNEL TRAP 0x0000007B // INFORMAÇÕES DE REGISTRO CORROMPIDAS ]</div>',
      '<div style="color: #4e6353; font-size: 11px;">01100011 01101111 01101100 01100001 01110000 01110011 01101111 [COLAPSO DETECTADO]</div>',
      `<div style="border-top: 1px solid #2d382e; border-bottom: 1px solid #2d382e; padding: 10px 0; margin: 8px 0; font-size: 12px; color: #9bb3a0; line-height: 1.6;">
        <div style="color: #fde047; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
          AVISO DO SUBSISTEMA DE CONTINGÊNCIA N.O.M.A.D. (OFF-GRID RECOVERY):
        </div>
        <div>• BANCO DE DADOS LOCAL: <span style="color: #ef4444; font-weight: bold;">INACESSÍVEL / NÃO LOCALIZADO</span></div>
        <div>• TABELA DE PERMISSÕES &amp; OPERADORES: <span style="color: #ef4444; font-weight: bold;">CORROMPIDA</span></div>
        <div>• STATUS DOS DISCOS NVME: <span style="color: #eab308;">MONTADO SOMENTE-LEITURA</span> (/dev/nvme0n1)</div>
        <div>• REDE EXTERNA: <span style="color: #728376;">SILÊNCIO TOTAL (OFF-GRID)</span></div>
        <div>• SITUAÇÃO: <span style="color: #eab308;">MÚLTIPLOS ERROS REGISTRADOS NOS SUBSISTEMAS</span></div>
      </div>`,
    ]

    let i = 0
    const printNextIntro = () => {
      if (i < staticLines.length) {
        const line = staticLines[i]
        setIntroLines((prev) => [...prev, line])
        i++
        setTimeout(printNextIntro, 360)
      } else {
        setRecoveryHint('HELP')
        setTimeout(() => recoveryInputRef.current?.focus(), 80)
      }
    }
    printNextIntro()
  }

  function appendDynLog(html: string) {
    setRecoveryLogs((prev) => [...prev, html])
  }

  function executeRecoveryCommand(rawCmd: string) {
    const clean = rawCmd
      .toLowerCase()
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!clean) return
    triggerGlitch(180)

    const escaped = rawCmd.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    appendDynLog(
      `<div style="color: #ffffff; font-weight: bold; margin-top: 6px;"><span class="font-mono-mil" style="color: #eab308;">RECOVERY:~$</span> ${escaped}</div>`
    )

    if (recoveryStep === 'AWAIT_HELP') {
      if (clean === 'help' || clean === 'ajuda') {
        appendDynLog(
          '<div style="color: #8fa692;">[EXECUTANDO: /bin/help --verbose --emergency-mode...]</div>'
        )
        setTimeout(() => {
          triggerGlitch(160)
          appendDynLog(`
            <div style="color: #ef4444; font-weight: bold;">[ERRO CRÍTICO] Falha ao localizar /bin/help ou manual de diretrizes (/usr/share/nomad/manual.db).</div>
            <div style="color: #fca5a5;">• Setor de comandos corrompido: get_command_table() retornou NULL (0x00000000).</div>
            <div style="color: #fca5a5;">• Código de falha: 0xFF00AA (SETOR_ILEGÍVEL // ASSINATURA_AUSENTE).</div>
            <div style="color: #eab308; font-size: 11.5px;">• Partições detectadas: /dev/nvme0n1p1 [SOMENTE-LEITURA] | /dev/nvme0n1p2 [BLOQUEADA].</div>
            <div style="color: #8fa692; font-size: 11.5px;">• Estado de Segurança: AUTH_REQUIRED (Nenhum operador mestre autenticado na tabela local).</div>
            <div style="color: #8fa692; font-size: 11.5px; margin-top: 4px;">Não foi possível carregar o índice de comandos do operador. Para desbloquear a tabela de recuperação e registrar uma credencial de comando, autentique-se primeiro.</div>
          `)
          setRecoveryStep('AWAIT_LOGIN')
          setRecoveryHint('LOGIN')
          recoveryInputRef.current?.focus()
        }, 650)
      } else {
        appendDynLog(
          `<div style="color: #ef4444; font-size: 11.5px;">Comando '${escaped}' desconhecido no modo de emergência. Digite <strong style="color: #fde047;">help</strong>.</div>`
        )
      }
      return
    }

    if (recoveryStep === 'AWAIT_LOGIN') {
      if (clean === 'login' || clean === 'entrar') {
        setRecoveryStep('CREATING_USER')
        setRecoveryHint('')
        appendDynLog(
          '<div style="color: #4ade80;">[INICIANDO ROTINA DE AUTENTICAÇÃO MIL-STD-810H // MÓDULO TPM 2.0...]</div>'
        )
        const codes = [
          '0x7FFF0010: SCANNING /srv/data/auth/nomad_auth.db ...... [FALHA: ARQUIVO INACESSÍVEL]',
          '0x7FFF002C: VERIFICANDO REGISTRADORES PCR[0..7] DO TPM .. [INTEGRIDADE COMPROMETIDA]',
          '0x7FFF0048: CHECANDO CHAVE MESTRE DE COMANDO ........... [CORROMPIDA: 0x00000000]',
          '0x7FFF0074: TESTANDO ASSINATURA DE BINÁRIOS DO KERNEL ... [ASSINATURA AUSENTE]',
          '0x7FFF009C: CONSULTANDO TABELA DE OPERADORES ATIVOS ..... [0 REGISTROS ENCONTRADOS]',
          '01100110 01100001 01101100 01101000 01100001 -> FALHA DE BANCO CRIPTOGRAFADO!',
          '[FALHA] Banco de autenticação vazio ou danificado. Nenhum operador registrado no dispositivo.',
          '[PROTOCOLO DE CONTINGÊNCIA] Liberando módulo de criação emergencial de Operador Mestre:',
        ]
        let i = 0
        const showNextCode = () => {
          if (i < codes.length) {
            appendDynLog(
              `<div class="font-mono-mil" style="color: #728376; font-size: 11px;">${codes[i]}</div>`
            )
            i++
            setTimeout(showNextCode, 280)
          } else {
            setRecoveryHint('FORM')
          }
        }
        setTimeout(showNextCode, 300)
      } else {
        appendDynLog(
          `<div style="color: #ef4444; font-size: 11.5px;">Acesso restrito. Digite <strong style="color: #fde047;">login</strong> para prosseguir.</div>`
        )
      }
      return
    }

    if (recoveryStep === 'CREATING_USER') {
      appendDynLog(
        `<div style="color: #fde047; font-size: 11.5px;">Por favor, preencha o formulário de Operador Mestre acima.</div>`
      )
      return
    }

    if (recoveryStep === 'AWAIT_INICIAR') {
      if (clean === 'iniciar sistema' || clean === 'iniciar' || clean === 'start') {
        setRecoveryStep('STABILIZING')
        setRecoveryHint('')
        runSystemStabilizationAndBoot()
      } else {
        appendDynLog(
          `<div style="color: #fde047; font-size: 11.5px;">Comando pendente: Digite <strong style="color: #4ade80;">iniciar sistema</strong> no console.</div>`
        )
      }
    }
  }

  async function handleMasterRegister(e: React.FormEvent) {
    e.preventDefault()
    const user = regUser.trim()
    if (!user || !regPass) {
      setRegError('Informe usuário e senha.')
      return
    }
    if (regPass !== regPassConfirm) {
      setRegError('As senhas não coincidem. Confirme a senha corretamente.')
      return
    }

    setRegError('')
    setRegSubmitting(true)
    setTpmProgressVisible(true)
    setTpmPct(20)
    setTpmStatus('GERANDO HASH SCRYPT CRIPTOGRÁFICO DE CREDENCIAIS...')

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: user, password: regPass }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success || !data?.operator) {
        setTpmProgressVisible(false)
        setRegSubmitting(false)
        setRegError(data?.message || 'Não foi possível salvar o operador no banco de dados.')
        triggerGlitch(180)
        return
      }

      clearLegacyClientAuthStorage()
      updateCachedAuthStatus({
        needsOnboarding: false,
        hasOperators: true,
        authenticated: true,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: data.operator,
      })
      setAuthState(latestAuthStatusCache)

      setTpmPct(70)
      setTpmStatus('GRAVANDO OPERADOR MESTRE NO BANCO MYSQL (nomad_operators)...')

      setTimeout(() => {
        setTpmPct(100)
        setTpmStatus('OPERADOR MESTRE GRAVADO NO BANCO COM SUCESSO!')
      }, 450)

      setTimeout(() => {
        triggerGlitch(220)
        setTpmProgressVisible(false)
        setRegSubmitting(false)
        setRecoveryStep('AWAIT_INICIAR')
        const safeUser = data.operator.username.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        appendDynLog(`
        <div style="color: #4ade80; font-weight: bold; margin-top: 6px;">[SUCESSO] Banco de Autenticação inicializado e Operador Mestre salvo no MySQL!</div>
        <div style="color: #ffffff; font-size: 12px;">[CREDENCIAL ATIVA] Usuário: <strong style="color: #c2a677;">${safeUser}</strong> | Nível: 05 ADMIN TOTAL | Status: <strong style="color: #4ade80;">AUTORIZADO</strong></div>
        <div style="margin: 8px 0; border-top: 1px solid #3d4d40; border-bottom: 1px solid #3d4d40; padding: 8px 0; font-size: 11.5px;">
          <div style="color: #eab308; font-weight: bold; margin-bottom: 4px;">=== HISTÓRICO DE TENTATIVAS ANTERIORES NO TERMINAL ===</div>
          <div style="color: #ef4444;">[FALHA] 'iniciar sistema' -&gt; BLOQUEADO (Banco de operadores ausente)</div>
          <div style="color: #728376; font-size: 11px; margin-top: 4px;">Agora que existe um Administrador Nível 5 gravado, execute o comando final abaixo.</div>
        </div>
        <div style="color: #86efac; font-size: 11.5px;">[AVISO] Sessão autenticada criada com cookie seguro no banco de dados.</div>
      `)
        setRecoveryHint('INICIAR')
        setTimeout(() => recoveryInputRef.current?.focus(), 80)
      }, 900)
    } catch {
      setTpmProgressVisible(false)
      setRegSubmitting(false)
      setRegError('Erro de comunicação com o servidor ao registrar operador.')
    }
  }

  function runSystemStabilizationAndBoot() {
    const asciiLogo = `
<pre class="font-mono-mil" style="color: #c2a677; font-size: 10px; line-height: 1; font-weight: bold; margin: 8px 0; user-select: none;">
  _   _ _______  ___   _ ____    _   _     ___     __  __     _     ____  
 | \\ | | ____\\ \\/ / | | / ___|  | \\ | |   / _ \\   |  \\/  |   / \\   |  _ \\ 
 |  \\| |  _|  \\  /| | | \\___ \\  |  \\| |  | | | |  | |\\/| |  / _ \\  | | | |
 | |\\  | |___ /  \\| |_| |___) | | |\\  |  | |_| |  | |  | | / ___ \\ | |_| |
 |_| \\_|_____/_/\\_\\\\___/|____/  |_| \\_|   \\___/   |_|  |_|/_/   \\_\\|____/ 
</pre>
<div style="color: #4ade80; font-weight: bold; margin-bottom: 4px; font-size: 12px;">SISTEMA OPERACIONAL TÁTICO MILITAR MIL-STD-810H // INICIALIZANDO REPAROS DE KERNEL:</div>
<div style="color: #8fa692; font-size: 11px; margin-bottom: 8px;">Autorização de Comando Supremo validada. Executando sequência de recuperação dos setores críticos e desbloqueio de partições...</div>
    `
    appendDynLog(asciiLogo)

    const repairs = [
      { bin: '01100010 01101111', txt: 'REPARANDO SETOR DE BOOT & TABELA MBR/GPT MIL-STD-810H' },
      { bin: '01110011 01110011', txt: 'RECONSTRUINDO TABELA DE VOLUMES NVMe (/dev/nvme0n1p1)' },
      { bin: '01101110 01100101', txt: 'RESTAURANDO BARRAMENTO DE REDE LOCAL MESH & GATEWAY' },
      { bin: '01110000 01101111', txt: 'DESCRIPTOGRAFANDO MÓDULOS DE CONHECIMENTO & REPOSITÓRIOS' },
      { bin: '01110011 01100001', txt: 'MONTANDO PARTIÇÕES TÁTICAS EM MODO LEITURA/ESCRITA' },
      { bin: '01101001 01100111', txt: 'INICIALIZANDO NÚCLEO N.O.M.A.D. & COFRE AES-256' },
      { bin: '01101101 01100001', txt: 'VERIFICANDO INDEXAÇÃO CARTOGRÁFICA & TELEMETRIA OFFLINE' },
      { bin: '01101011 01100101', txt: 'VALIDANDO CHECKSUM SHA-256 DO KERNEL & ESTABILIZANDO VÍDEO' },
    ]

    let idx = 0
    const nextRepair = () => {
      if (idx < repairs.length) {
        const r = repairs[idx]
        appendDynLog(`
          <div style="font-size: 11.5px; margin: 3px 0; display: flex; justify-content: space-between; color: #a1b8a6;">
            <span><span class="font-mono-mil" style="color: #f59e0b;">${r.bin}</span> -&gt; ${r.txt}...</span>
            <span style="color: #4ade80; font-weight: bold; margin-left: 8px;">[CORRIGIDO ✓]</span>
          </div>
        `)
        idx++
        setTimeout(nextRepair, 600)
      } else {
        appendDynLog(`
          <div style="margin: 10px 0; padding: 10px; background: rgba(5, 46, 22, 0.85); border: 1px solid #16a34a; border-radius: 4px; text-align: center;">
            <strong style="color: #86efac; font-size: 13px;">✓ REPAROS DE KERNEL CONCLUÍDOS!</strong><br>
            <span style="font-size: 11px; color: #8fa692;">Inicializando Centro de Comando com sessão autenticada...</span>
          </div>
        `)
        setTimeout(() => {
          hasBootedInCurrentDocument = true
          runCleanStabilizedOSBoot('UNLOCKED', 420)
          router.reload({ only: ['authUser'] })
        }, 1100)
      }
    }
    setTimeout(nextRepair, 450)
  }

  function runCleanStabilizedOSBoot(
    targetAfterBoot: 'LOGIN_SCREEN' | 'UNLOCKED' = 'UNLOCKED',
    stepIntervalMs = 480,
    isContainerRestart = false
  ) {
    clearAllTimers()
    const pendingApp = consumePendingAppAction()
    setStage('CLEAN_BOOT_OS')
    setBootPct(0)
    setBootLogs([])

    const targetLabel = pendingApp?.target === 'portainer' ? 'SERVIDOR PORTAINER' : 'NOMAD LOCAL'
    const appUpper = pendingApp?.appName ? pendingApp.appName.toUpperCase() : ''

    if (pendingApp) {
      const actionTitle =
        pendingApp.action === 'install'
          ? `FINALIZANDO INSTALAÇÃO DE ${appUpper} (${targetLabel})...`
          : pendingApp.action === 'uninstall'
            ? `FINALIZANDO DESINSTALAÇÃO DE ${appUpper} (${targetLabel})...`
            : `FINALIZANDO REINSTALAÇÃO DE ${appUpper} (${targetLabel})...`
      setBootStatus(actionTitle)
    } else {
      setBootStatus('INICIALIZANDO NEXUS N.O.M.A.D. OS...')
    }

    const cleanSteps = pendingApp
      ? pendingApp.action === 'install'
        ? [
            {
              pct: 22,
              status: `CONCLUINDO CONFIGURAÇÃO DE ${appUpper} NO ${targetLabel}...`,
              msg: `[ OK ] APLICAÇÃO ${appUpper} PROVISIONADA NO ${targetLabel}`,
            },
            {
              pct: 48,
              status: `APLICANDO AJUSTES FINAIS DE REDE E VOLUMES (${targetLabel})...`,
              msg: `[ OK ] PORTAS, VOLUMES E VARIÁVEIS DE AMBIENTE SINCRONIZADOS`,
            },
            {
              pct: 76,
              status: `REGISTRANDO ${appUpper} NO CENTRO DE COMANDO N.O.M.A.D...`,
              msg: `[ OK ] SERVIÇO ${appUpper} INTEGRADO AO PAINEL PRINCIPAL`,
            },
            {
              pct: 94,
              status: `VERIFICANDO INTEGRIDADE DO SERVIÇO (${targetLabel})...`,
              msg: `[ OK ] HEALTHCHECK NOMINAL PARA ${appUpper}`,
            },
            {
              pct: 100,
              status: `${appUpper} INSTALADO COM SUCESSO // ABRINDO PAINEL...`,
              msg: `[ 100% ] INSTALAÇÃO DE ${appUpper} FINALIZADA NO ${targetLabel}`,
            },
          ]
        : pendingApp.action === 'uninstall'
          ? [
              {
                pct: 24,
                status: `ENCERRANDO INSTÂNCIA DE ${appUpper} NO ${targetLabel}...`,
                msg: `[ OK ] CONTÊINER DE ${appUpper} PARADO E DESACOPLADO (${targetLabel})`,
              },
              {
                pct: 52,
                status: `APAGANDO REGISTROS E STACKS RESIDUAIS DE ${appUpper}...`,
                msg: `[ OK ] REGISTROS LOCAIS E ARQUIVOS DE COMPOSIÇÃO REMOVIDOS`,
              },
              {
                pct: 80,
                status: `ATUALIZANDO INVENTÁRIO DE APLICATIVOS (${targetLabel})...`,
                msg: `[ OK ] CATÁLOGO SINCRONIZADO SEM ${appUpper}`,
              },
              {
                pct: 100,
                status: `DESINSTALAÇÃO DE ${appUpper} CONCLUÍDA // ABRINDO PAINEL...`,
                msg: `[ 100% ] ${appUpper} REMOVIDO PERMANENTEMENTE DO ${targetLabel}`,
              },
            ]
          : [
              {
                pct: 22,
                status: `REINICIALIZANDO MÓDULOS DE ${appUpper} NO ${targetLabel}...`,
                msg: `[ OK ] ANTIGA INSTÂNCIA DE ${appUpper} SUBSTITUÍDA (${targetLabel})`,
              },
              {
                pct: 50,
                status: `RECONFIGURANDO VOLUMES E PARÂMETROS DE ${appUpper}...`,
                msg: `[ OK ] AJUSTES FINAIS DE REINSTALAÇÃO APLICADOS`,
              },
              {
                pct: 78,
                status: `VALIDANDO CONECTIVIDADE DE ${appUpper} NO ${targetLabel}...`,
                msg: `[ OK ] SERVIÇO ${appUpper} RESPONDENDO CORRETAMENTE`,
              },
              {
                pct: 100,
                status: `${appUpper} REINSTALADO E PRONTO // ABRINDO PAINEL...`,
                msg: `[ 100% ] REINSTALAÇÃO DE ${appUpper} CONCLUÍDA NO ${targetLabel}`,
              },
            ]
      : [
          {
            pct: 20,
            status: 'SINCRONIZANDO KERNEL ESTABILIZADO...',
            msg: '[ OK ] KERNEL MIL-STD-810H INICIADO SEM ERROS',
          },
          {
            pct: 45,
            status: 'MONTANDO VOLUMES DE LEITURA/ESCRITA...',
            msg: '[ OK ] /dev/nvme0n1 MONTADO EM MODO READ/WRITE',
          },
          {
            pct: 70,
            status: 'CONECTANDO BANCO DE AUTENTICAÇÃO...',
            msg: '[ OK ] BANCO DE OPERADORES (MySQL // nomad_operators) CARREGADO',
          },
          {
            pct: 90,
            status:
              targetAfterBoot === 'UNLOCKED'
                ? 'RESTAURANDO SESSÃO DO OPERADOR DE COMANDO...'
                : 'INICIALIZANDO INTERFACE DE LOGIN...',
            msg:
              targetAfterBoot === 'UNLOCKED'
                ? '[ OK ] CREDENCIAL DE COMANDO VALIDADA NO BANCO LOCAL'
                : '[ OK ] SUBSISTEMA DE AUTENTICAÇÃO PRONTO',
          },
          {
            pct: 100,
            status:
              targetAfterBoot === 'UNLOCKED'
                ? 'SISTEMA PRONTO // ABRINDO CENTRO DE COMANDO...'
                : 'SISTEMA PRONTO // ABRINDO LOGIN...',
            msg: '[ 100% ] BEM-VINDO AO NEXUS N.O.M.A.D. OS',
          },
        ]

    let idx = 0
    const restartTriggeredAt = Date.now()
    const nextStep = () => {
      if (idx < cleanSteps.length) {
        const s = cleanSteps[idx]
        setBootPct(s.pct)
        setBootStatus(s.status)
        setBootLogs((prev) => [...prev, { msg: s.msg, color: '#4ade80' }])
        idx++
        registerTimeout(nextStep, stepIntervalMs)
      } else if (isContainerRestart && targetAfterBoot === 'UNLOCKED') {
        // Reinicialização real do contêiner Docker: mantém a tela do Nexus e faz polling até o novo contêiner responder em /api/health
        setBootPct(92)
        setBootStatus('AGUARDANDO CONTÊINER DOCKER ESTABILIZAR...')
        setBootLogs((prev) => [
          ...prev,
          { msg: '[ AGUARDANDO ] TESTANDO COMUNICAÇÃO COM O SERVIDOR NOMAD...', color: '#f59e0b' },
        ])

        let attempts = 0
        const pollTimer = registerInterval(async () => {
          attempts++
          // Aguarda pelo menos 2.5s desde o sinal de restart para não acertar o contêiner antigo antes do process.exit(0)
          if (Date.now() - restartTriggeredAt < 2500) {
            return
          }
          try {
            const controller = new AbortController()
            const abortId = registerTimeout(() => controller.abort(), 1500)
            const res = await fetch('/api/health', { cache: 'no-store', signal: controller.signal })
            clearTimeout(abortId)
            const contentType = res.headers.get('content-type') || ''
            if (res.ok && contentType.includes('application/json')) {
              const data = await res.json().catch(() => null)
              if (data && typeof data === 'object') {
                clearInterval(pollTimer)
                setBootPct(100)
                setBootStatus('SERVIDOR ONLINE // ABRINDO CENTRO DE COMANDO...')
                setBootLogs((prev) => [
                  ...prev,
                  { msg: '[ 100% ] SUBSISTEMA RECONECTADO // REDIRECIONANDO...', color: '#4ade80' },
                ])
                registerTimeout(() => {
                  window.location.href = '/home'
                }, 500)
              }
            }
          } catch {
            if (attempts % 3 === 0) {
              setBootLogs((prev) => [
                ...prev,
                { msg: `[ TENTATIVA ${attempts} ] CONTÊINER INICIALIZANDO PROCESSOS...`, color: '#a1b8a6' },
              ])
            }
            if (attempts >= 35) {
              clearInterval(pollTimer)
              window.location.href = '/home'
            }
          }
        }, 1200)
      } else {
        // Boot visual normal na abertura/F5: libera a interface atual diretamente sem reload em loop
        registerTimeout(() => {
          if (targetAfterBoot === 'UNLOCKED') {
            setStage('UNLOCKED')
          } else {
            setLoginUser('')
            setLoginPass('')
            setStage('LOGIN_SCREEN')
          }
        }, 350)
      }
    }
    registerTimeout(nextStep, 180)
  }

  const isLockedMode = Boolean(authState?.locked && authState?.lockedUsername)

  async function handleMainLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loginSubmitting) return

    setLoginError('')
    setLoginSubmitting(true)

    try {
      const endpoint = isLockedMode ? '/api/auth/unlock' : '/api/auth/login'
      const bodyPayload = isLockedMode
        ? { password: loginPass }
        : {
            username: loginUser.trim(),
            password: loginPass,
            remember: rememberSession,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(bodyPayload),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success || !data?.operator) {
        setLoginError(
          data?.message ||
            'ACESSO NEGADO: Usuário ou senha inválidos no banco de dados MySQL.'
        )
        triggerGlitch(180)
        setLoginSubmitting(false)
        return
      }

      const nextStatus: AuthStatusPayload = {
        needsOnboarding: false,
        hasOperators: true,
        authenticated: true,
        locked: false,
        lockedUsername: null,
        lockedRoleLabel: null,
        operator: data.operator,
      }
      updateCachedAuthStatus(nextStatus)
      setAuthState(nextStatus)
      setLoginPass('')
      setLoginError('')
      setLoginSubmitting(false)
      hasBootedInCurrentDocument = true
      setStage('UNLOCKED')
      router.reload({ only: ['authUser'] })
    } catch {
      setLoginError('Erro de comunicação com o servidor ao validar credenciais.')
      triggerGlitch(180)
      setLoginSubmitting(false)
    }
  }

  function resetFullBootSimulation() {
    if (typeof window === 'undefined') return
    clearLegacyClientAuthStorage()
    startColdBootSequence()
  }

  if (stage === 'UNLOCKED') {
    return <>{children}</>
  }

  const hostIp =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : '192.168.1.248'

  return (
    <div
      id="nomad-boot-gate-root"
      className={glitching ? 'crt-glitching' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#050806',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: BOOT_SCOPED_CSS }} />

      {/* Efeitos CRT Globais idênticos ao military_tactical_home.html */}
      <div className="crt-scanlines" />
      <div className="crt-beam-roll" />

      {/* ========================================================================= */}
      {/* FASE 0: MONITOR CRT LIGANDO DO ZERO (FLASH DE TUBO DE RAIOS CATÓDICOS)    */}
      {/* ========================================================================= */}
      {stage === 'CRT_POWERON' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: '#020302',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="crt-beam-flash" />
          <div
            className="font-mono-mil"
            style={{
              fontSize: '11px',
              color: '#4d6050',
              letterSpacing: '2px',
              position: 'absolute',
              bottom: '28px',
            }}
          >
            ENERGIZANDO TUBO CRT // MIL-STD-810H...
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FASE 1 & REINICIALIZAÇÃO LIMPA: TELA DE BOOT DO OS ("NEXUS" SPLASH)       */}
      {/* ========================================================================= */}
      {(stage === 'COLD_BOOT_OS' || stage === 'CLEAN_BOOT_OS') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#050806',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="boot-chamfer boot-box-panel"
            style={{
              width: '100%',
              maxWidth: 'min(92vw, 1080px)',
              background: '#0c120e',
              border: '2px solid #3d4d40',
              boxShadow: '0 0 60px rgba(0,0,0,0.95)',
              padding: '28px',
            }}
          >
            {/* Topo do BIOS */}
            <div
              className="font-mono-mil"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #27352a',
                paddingBottom: '10px',
                marginBottom: '22px',
                fontSize: '11px',
              }}
            >
              <span style={{ color: '#8fa692' }}>NEXUS-01 // BIOS REV 4.2-MIL</span>
              <span style={{ color: stage === 'CLEAN_BOOT_OS' ? '#4ade80' : '#eab308' }}>
                {stage === 'CLEAN_BOOT_OS'
                  ? 'ESTABILIDADE DE VÍDEO: 100% NOMINAL'
                  : 'ALIMENTAÇÃO: BATERIA AUXILIAR (14%)'}
              </span>
            </div>

            {/* Marca NEXUS Centralizada */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                className="font-mono-mil"
                style={{
                  fontSize: '10px',
                  color: '#728376',
                  letterSpacing: '4px',
                  marginBottom: '6px',
                }}
              >
                SISTEMA OPERACIONAL TÁTICO DE CAMPO
              </div>
              <div
                className="font-stencil"
                style={{
                  fontSize: '46px',
                  lineHeight: 1,
                  color: '#c2a677',
                  letterSpacing: '12px',
                  textShadow: '0 0 24px rgba(194, 166, 119, 0.35)',
                }}
              >
                NEXUS
              </div>
              <div
                className="font-mono-mil"
                style={{
                  fontSize: '12px',
                  color: '#4ade80',
                  letterSpacing: '3px',
                  marginTop: '8px',
                  fontWeight: 'bold',
                }}
              >
                PROJETO N.O.M.A.D. OS {displayVersion}
              </div>
            </div>

            {/* Spinner + Status do OS */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <span className="mil-spinner" />
              <span
                className="font-mono-mil"
                style={{ fontSize: '12px', color: '#e5ece6', fontWeight: 'bold' }}
              >
                {bootStatus}
              </span>
            </div>

            {/* Barra de Progresso do OS */}
            <div
              style={{
                width: '100%',
                background: '#080d09',
                border: '1px solid #3d4d40',
                height: '16px',
                borderRadius: '3px',
                padding: '2px',
                marginBottom: '16px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${bootPct}%`,
                  background: 'linear-gradient(90deg, #15803d, #4ade80)',
                  borderRadius: '2px',
                  transition: 'width 0.6s ease-out',
                }}
              />
            </div>

            {/* Logs do Sistema Operacional Carregando */}
            <div
              ref={bootLogRef}
              className="font-mono-mil"
              style={{
                background: '#080d09',
                border: '1px solid #222c24',
                borderRadius: '4px',
                padding: '12px',
                height: '165px',
                overflowY: 'auto',
                fontSize: '11.5px',
                lineHeight: 1.65,
                color: '#a1b8a6',
              }}
            >
              {bootLogs.map((log, i) => (
                <div key={i} style={{ color: log.color }}>
                  {log.msg}
                </div>
              ))}
            </div>

            {/* Rodapé do Boot */}
            <div
              className="font-mono-mil"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                fontSize: '11px',
                color: '#647466',
              }}
            >
              <span>MIL-STD-810H // OFF-GRID</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{bootPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TELA DE RECUPERAÇÃO / FIRST BOOT (TERMINAL LIMPO MILITAR)              */}
      {/* ========================================================================= */}
      {stage === 'RECOVERY_TERMINAL' && (
        <div
          className="boot-chamfer terminal-container"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Topo do Terminal */}
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span
                className="animate-pulse"
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#eab308',
                  flexShrink: 0,
                }}
              />
              <span
                className="font-mono-mil"
                style={{ fontWeight: 'bold', color: '#eab308', letterSpacing: '0.5px' }}
              >
                N.O.M.A.D. RECOVERY // KERNEL MIL-STD-810H (MODO DE EMERGÊNCIA CRÍTICO)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={resetFullBootSimulation}
                className="mil-btn"
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                <span>🔄</span>
                <span>REINICIAR TESTE</span>
              </button>
              <span
                className="font-mono-mil"
                style={{ color: '#647466', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                TTY1 // {hostIp}
              </span>
            </div>
          </div>

          {/* Conteúdo do Terminal */}
          <div
            ref={terminalBodyRef}
            className="terminal-body"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {introLines.map((html, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recoveryLogs.map((html, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>

            {recoveryHint === 'HELP' && (
              <div style={{ color: '#c2a677', fontWeight: 'bold', marginTop: '8px' }}>
                &gt;&gt;&gt; DIGITE &apos;
                <span
                  onClick={() => executeRecoveryCommand('help')}
                  style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  help
                </span>
                &apos; NO CONSOLE PARA TENTAR CARREGAR O MANUAL DE RECUPERAÇÃO...
              </div>
            )}

            {recoveryHint === 'LOGIN' && (
              <div style={{ color: '#c2a677', fontWeight: 'bold', marginTop: '8px' }}>
                &gt;&gt;&gt; É NECESSÁRIO FAZER LOGIN. Por favor, digite &apos;
                <span
                  onClick={() => executeRecoveryCommand('login')}
                  style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  login
                </span>
                &apos;
              </div>
            )}

            {recoveryHint === 'FORM' && (
              <div style={{ color: '#c2a677', fontWeight: 'bold', marginTop: '8px' }}>
                &gt;&gt;&gt; Preencha o formulário acima para registrar seu Operador Mestre.
              </div>
            )}

            {recoveryHint === 'INICIAR' && (
              <div style={{ color: '#c2a677', fontWeight: 'bold', marginTop: '8px' }}>
                &gt;&gt;&gt; DIGITE &apos;
                <span
                  onClick={() => executeRecoveryCommand('iniciar sistema')}
                  style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  iniciar sistema
                </span>
                &apos; NO CONSOLE PARA ROMPER O BLOQUEIO E INICIALIZAR O N.O.M.A.D...
              </div>
            )}

            {/* FORMULÁRIO DE CRIAÇÃO DE OPERADOR MESTRE (GRID 2x2 SIMÉTRICO) */}
            {recoveryStep === 'CREATING_USER' && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '16px',
                  borderTop: '2px solid #c2a677',
                  background: '#121914',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #2d382e',
                    paddingBottom: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    className="font-stencil"
                    style={{
                      fontWeight: 'bold',
                      color: '#ffffff',
                      letterSpacing: '1px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    ■ CRIAÇÃO DE ACESSO MESTRE // NÍVEL SUPREMO (COMANDO-GERAL)
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      background: '#451a03',
                      color: '#fde047',
                      border: '1px solid #b45309',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    PRIMEIRO ACESSO
                  </span>
                </div>

                <p style={{ color: '#8fa692', fontSize: '11px', marginBottom: '14px' }}>
                  Como este é o primeiro acesso pós-colapso, este operador será gravado no banco de
                  autenticação com{' '}
                  <strong style={{ color: '#c2a677' }}>Nível 05 Supremo (Acesso Irrestrito)</strong>
                  .
                </p>

                <form
                  onSubmit={handleMasterRegister}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div className="form-grid-2">
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#728376',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '5px',
                        }}
                      >
                        IDENTIFICAÇÃO / USUÁRIO:
                      </label>
                      <input
                        type="text"
                        required
                        value={regUser}
                        onChange={(e) => setRegUser(e.target.value)}
                        placeholder="Ex: Operador-01"
                        className="mil-input"
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#728376',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '5px',
                        }}
                      >
                        NÍVEL DE AUTORIZAÇÃO:
                      </label>
                      <div
                        className="font-mono-mil"
                        style={{
                          height: '36px',
                          background: '#080d09',
                          border: '1px solid rgba(194, 166, 119, 0.6)',
                          borderRadius: '4px',
                          padding: '0 12px',
                          color: '#c2a677',
                          fontWeight: 'bold',
                          fontSize: '11.5px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>★ NÍVEL 05 // SUPREMO</span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#4ade80',
                            background: '#052e16',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            border: '1px solid #166534',
                          }}
                        >
                          TOTAL
                        </span>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '5px',
                        }}
                      >
                        <label
                          style={{
                            fontSize: '11px',
                            color: '#728376',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          SENHA DE CAMPO:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowRegPass1((v) => !v)}
                          style={{
                            fontSize: '10px',
                            color: '#c2a677',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {showRegPass1 ? '🙈 OCULTAR' : '👁️ MOSTRAR'}
                        </button>
                      </div>
                      <input
                        type={showRegPass1 ? 'text' : 'password'}
                        required
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="Digite a senha..."
                        className="mil-input"
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '5px',
                        }}
                      >
                        <label
                          style={{
                            fontSize: '11px',
                            color: '#728376',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          CONFIRMAR SENHA:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowRegPass2((v) => !v)}
                          style={{
                            fontSize: '10px',
                            color: '#c2a677',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {showRegPass2 ? '🙈 OCULTAR' : '👁️ MOSTRAR'}
                        </button>
                      </div>
                      <input
                        type={showRegPass2 ? 'text' : 'password'}
                        required
                        value={regPassConfirm}
                        onChange={(e) => setRegPassConfirm(e.target.value)}
                        placeholder="Repita a senha..."
                        className="mil-input"
                      />
                    </div>
                  </div>

                  {/* Animação de Gravação no Banco & Chip TPM */}
                  {tpmProgressVisible && (
                    <div
                      style={{
                        background: '#080d09',
                        border: '1px solid #2e3d30',
                        borderRadius: '4px',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        className="font-mono-mil"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                          fontSize: '11px',
                          color: '#4ade80',
                        }}
                      >
                        <span className="mil-spinner" style={{ width: '12px', height: '12px' }} />
                        <span>{tpmStatus}</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          background: '#141b16',
                          height: '8px',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${tpmPct}%`,
                            background: '#4ade80',
                            transition: 'width 0.35s ease-out',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {regError && (
                    <div
                      style={{
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: 'rgba(69, 10, 10, 0.7)',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #991b1b',
                      }}
                    >
                      {regError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="mil-btn"
                      style={{ color: '#4ade80', padding: '9px 18px', fontSize: '12px' }}
                    >
                      ⚡ REGISTRAR OPERADOR NO BANCO &amp; TPM ➔
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Barra de Input de Comando */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const val = cmdInput
              setCmdInput('')
              executeRecoveryCommand(val)
            }}
            className="terminal-input-bar"
          >
            <span
              className="font-mono-mil"
              style={{ color: '#eab308', fontWeight: 'bold', userSelect: 'none' }}
            >
              RECOVERY:~$
            </span>
            <input
              ref={recoveryInputRef}
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              placeholder="Digite os comandos de recuperação (ex: help, login, iniciar sistema)..."
            />
            <span className="terminal-cursor" />
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TELA DE LOGIN MILITAR // AUTENTICAÇÃO DE OPERADOR                      */}
      {/* ========================================================================= */}
      {stage === 'LOGIN_SCREEN' && (
        <div
          className="boot-chamfer terminal-container"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid #2d382e',
              paddingBottom: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="animate-pulse"
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-stencil"
                  style={{
                    fontSize: '14px',
                    color: '#ffffff',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  N.O.M.A.D. BOOT KERNEL // POSTO DE COMANDO TÁTICO
                </span>
              </div>
              <p
                className="font-mono-mil"
                style={{ fontSize: '11px', color: '#728376', marginTop: '4px', marginBottom: 0 }}
              >
                SISTEMA OPERACIONAL TÁTICO MILITAR DE CAMPO &amp; SOBREVIVÊNCIA OFFLINE
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span
                className="font-mono-mil"
                style={{
                  fontSize: '11px',
                  color: '#8fa692',
                  padding: '4px 8px',
                  background: '#141b16',
                  border: '1px solid #2d382e',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                }}
              >
                {hostIp}
              </span>
            </div>
          </div>

          {/* Log de Inicialização */}
          <div
            className="font-mono-mil"
            style={{
              padding: '10px 14px',
              background: '#080d09',
              border: '1px solid #222c24',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#8fa692',
              lineHeight: 1.6,
            }}
          >
            <div>
              [ 0.001024 ] BIOS MIL-STD-810H LOADED: HARDWARE SECURE...{' '}
              <strong style={{ color: '#4ade80' }}>OK</strong>
            </div>
            <div>
              [ 0.014290 ] INITIALIZING NVME ENCRYPTED MATRIX (/dev/nvme0n1)...{' '}
              <strong style={{ color: '#4ade80' }}>OK</strong>
            </div>
            <div>
              [ 0.038102 ] MOUNTING 1.284.102 ZIM SURVIVAL CORPUS...{' '}
              <strong style={{ color: '#4ade80' }}>OK</strong>
            </div>
            <div>
              [ 0.051940 ] NETWORK STATUS: RADIO SILENCE / LOCAL LAN ENFORCED...{' '}
              <strong style={{ color: '#4ade80' }}>OK</strong>
            </div>
            <div>
              [ 0.078210 ] AUTH DATABASE:{' '}
              <strong style={{ color: '#4ade80' }}>ONLINE (MySQL // nomad_operators)</strong>
            </div>
          </div>

          {/* Formulário de Login / Desbloqueio */}
          <form
            onSubmit={handleMainLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              className="font-mono-mil"
              style={{
                color: isLockedMode ? '#eab308' : '#c2a677',
                fontWeight: 'bold',
                fontSize: '12px',
                borderLeft: `2px solid ${isLockedMode ? '#eab308' : '#c2a677'}`,
                paddingLeft: '8px',
                textTransform: 'uppercase',
              }}
            >
              {isLockedMode
                ? `■ TERMINAL BLOQUEADO // ÚLTIMO OPERADOR ATIVO: ${authState?.lockedUsername || loginUser}`
                : '■ LOGIN DE OPERADOR // AUTENTICAÇÃO VIA BANCO DE DADOS'}
            </div>

            {isLockedMode && (
              <div
                className="font-mono-mil"
                style={{
                  fontSize: '11.5px',
                  color: '#fde047',
                  background: 'rgba(66, 32, 6, 0.5)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                }}
              >
                Sessão bloqueada por segurança. Somente o último operador conectado (
                <strong>{authState?.lockedUsername || loginUser}</strong>) pode desbloquear com a
                senha. Para acessar outra conta, clique em{' '}
                <strong>Deslogar / Trocar Usuário</strong> abaixo.
              </div>
            )}

            <div className="form-grid-2">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#728376',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  IDENTIFICAÇÃO / USUÁRIO:
                </label>
                {isLockedMode ? (
                  <div
                    className="mil-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#0d140f',
                      borderColor: '#eab308',
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                  >
                    <span>{authState?.lockedUsername || loginUser}</span>
                    <span style={{ fontSize: '10px', color: '#eab308' }}>🔒 BLOQUEADO</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    autoFocus
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Digite seu usuário..."
                    className="mil-input"
                  />
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#728376',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  NÍVEL DE AUTORIZAÇÃO:
                </label>
                <div
                  className="font-mono-mil"
                  style={{
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#080d09',
                    border: '1px solid #3e4f41',
                    borderRadius: '4px',
                    padding: '0 12px',
                    color: '#c2a677',
                    fontWeight: 'bold',
                    fontSize: '11.5px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isLockedMode
                    ? authState?.lockedRoleLabel || 'OPERADOR BLOQUEADO'
                    : 'VALIDADO PELO BANCO (NÍVEL 01–05)'}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      color: '#728376',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isLockedMode ? 'SENHA PARA DESBLOQUEAR:' : 'SENHA DE ACESSO:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    style={{
                      fontSize: '10px',
                      color: '#c2a677',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 'bold',
                    }}
                  >
                    {showLoginPass ? '🙈 OCULTAR SENHA' : '👁️ MOSTRAR SENHA'}
                  </button>
                </div>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  autoFocus={isLockedMode}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder={isLockedMode ? 'Digite sua senha para desbloquear...' : 'Digite sua senha...'}
                  className="mil-input"
                />
              </div>
            </div>

            {!isLockedMode && (
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#8fa692',
                    fontSize: '12px',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                  />
                  <span>
                    Manter conectado neste navegador (sessão salva por 30 dias via cookie seguro)
                  </span>
                </label>
              </div>
            )}

            {loginError && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: 'rgba(69, 10, 10, 0.7)',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #991b1b',
                }}
              >
                {loginError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: isLockedMode ? 'space-between' : 'flex-end',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #222c24',
                flexWrap: 'wrap',
              }}
            >
              {isLockedMode && (
                <button
                  type="button"
                  onClick={() => void logoutTacticalConsole()}
                  className="mil-btn"
                  style={{ color: '#eab308' }}
                >
                  ⎋ DESLOGAR / TROCAR USUÁRIO
                </button>
              )}

              <button
                type="submit"
                disabled={loginSubmitting}
                className="mil-btn"
                style={{ color: '#4ade80', padding: '10px 20px', fontSize: '12px' }}
              >
                {loginSubmitting
                  ? 'VERIFICANDO...'
                  : isLockedMode
                    ? 'DESBLOQUEAR TERMINAL ➔'
                    : 'ENTRAR NO SISTEMA ➔'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TELA DE FINALIZAÇÃO (SÓ NO PRIMEIRO LOGIN)                             */}
      {/* ========================================================================= */}
      {stage === 'FINALIZING' && (
        <div
          className="boot-chamfer terminal-container"
          style={{
            padding: '28px',
            textAlign: 'center',
            width: '100%',
            maxWidth: 'min(92vw, 860px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            className="font-stencil"
            style={{
              color: '#4ade80',
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            NEXUS N.O.M.A.D. // FINALIZANDO SUBSISTEMAS OPERACIONAIS
          </div>
          <p className="font-mono-mil" style={{ fontSize: '12px', color: '#8fa692', margin: 0 }}>
            Autenticação confirmada. Carregando os módulos táticos de sobrevivência...
          </p>

          <div
            style={{
              width: '100%',
              background: '#080d09',
              border: '1px solid #2e3d30',
              height: '16px',
              borderRadius: '3px',
              overflow: 'hidden',
              padding: '2px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${finPct}%`,
                background: '#22c55e',
                borderRadius: '2px',
                transition: 'width 0.6s ease-out',
              }}
            />
          </div>

          <div
            className="font-mono-mil"
            style={{ fontSize: '12px', color: '#c2a677', fontWeight: 'bold' }}
          >
            {finStatus}
          </div>
        </div>
      )}
    </div>
  )
}
