import React, { useState, useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'

export interface TacticalOperator {
  username: string
  passwordHash: string
  level: string
  isMaster?: boolean
  createdAt: string
}

interface NomadAuthDBState {
  setupCompleted: boolean
  operators: TacticalOperator[]
  activeSession: {
    username: string
    level: string
    remember: boolean
  } | null
  lockedExplicitly?: boolean
}

const AUTH_STORAGE_KEY = 'nomad_tactical_auth_v4'
const LEGACY_STORAGE_KEYS = ['nomad_tactical_auth_v4', 'nomad_auth_db_v3', 'nomad_auth_db_v2']
const SESSION_UNLOCKED_KEY = 'nomad_session_unlocked_v4'

// Flag em memória do documento: é false ao abrir o site ou dar F5 (reload),
// e passa a true após exibir a tela rápida "INICIALIZANDO NEXUS N.O.M.A.D. OS..."
// para que a navegação interna entre páginas não repita o boot.
let hasBootedInCurrentDocument = false

function parseAuthState(raw: string | null | undefined): NomadAuthDBState | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const operators = Array.isArray(parsed.operators) ? parsed.operators : []
    return {
      setupCompleted: Boolean(parsed.setupCompleted) || operators.length > 0,
      operators,
      activeSession: parsed.activeSession || null,
      lockedExplicitly: Boolean(parsed.lockedExplicitly),
    }
  } catch {
    return null
  }
}

function loadAuthDB(serverRaw?: string | null): NomadAuthDBState {
  const mergedOps: TacticalOperator[] = []
  let setupCompleted = false
  let activeSession: NomadAuthDBState['activeSession'] = null
  let lockedExplicitly = false

  const mergeFrom = (state: NomadAuthDBState | null) => {
    if (!state) return
    if (state.setupCompleted) setupCompleted = true
    if (state.lockedExplicitly) lockedExplicitly = true
    if (state.activeSession && !activeSession) {
      activeSession = state.activeSession
    }
    for (const op of state.operators) {
      if (
        op &&
        op.username &&
        !mergedOps.some((existing) => existing.username.toLowerCase() === op.username.toLowerCase())
      ) {
        mergedOps.push(op)
      }
    }
  }

  // 1. Prioriza o banco de dados SQLite do servidor (KVStore 'auth.operators')
  mergeFrom(parseAuthState(serverRaw))

  // 2. Mescla com localStorage (incluindo chaves de versões anteriores para nunca perder dados)
  if (typeof window !== 'undefined') {
    for (const key of LEGACY_STORAGE_KEYS) {
      try {
        mergeFrom(parseAuthState(localStorage.getItem(key)))
      } catch {
        // ignore
      }
    }
  }

  if (mergedOps.length > 0) {
    setupCompleted = true
    if (!activeSession && !lockedExplicitly) {
      activeSession = {
        username: mergedOps[0].username,
        level: mergedOps[0].level,
        remember: true,
      }
    }
  }

  return {
    setupCompleted,
    operators: mergedOps,
    activeSession,
    lockedExplicitly,
  }
}

function saveAuthDB(state: NomadAuthDBState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

async function syncAuthDBToServer(state: NomadAuthDBState) {
  try {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'auth.operators',
        value: JSON.stringify({
          setupCompleted: state.setupCompleted,
          operators: state.operators,
          activeSession: state.activeSession,
          lockedExplicitly: Boolean(state.lockedExplicitly),
        }),
      }),
    })
  } catch {
    // Non-fatal offline fallback
  }
}

export function getActiveOperator(): { username: string; level: string } {
  const db = loadAuthDB()
  if (db.activeSession) {
    return {
      username: db.activeSession.username,
      level: db.activeSession.level,
    }
  }
  if (db.operators.length > 0) {
    return {
      username: db.operators[0].username,
      level: db.operators[0].level,
    }
  }
  return {
    username: 'OPERADOR',
    level: 'NÍVEL 05 // COMANDO-GERAL',
  }
}

export function lockTacticalConsole() {
  if (typeof window === 'undefined') return
  const db = loadAuthDB()
  db.activeSession = null
  db.lockedExplicitly = true
  saveAuthDB(db)
  syncAuthDBToServer(db)
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY)
  window.dispatchEvent(new CustomEvent('nomad:lock-console'))
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
  const { tacticalAuth } = usePage<{ tacticalAuth?: string | null }>().props

  const [stage, setStage] = useState<BootStage>(() => {
    if (hasBootedInCurrentDocument) return 'UNLOCKED'
    const initialDb = loadAuthDB(tacticalAuth)
    if (initialDb.setupCompleted && initialDb.operators.length > 0) {
      return initialDb.lockedExplicitly ? 'LOGIN_SCREEN' : 'CLEAN_BOOT_OS'
    }
    return 'CRT_POWERON'
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

  // Login states
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [rememberSession, setRememberSession] = useState(true)
  const [loginError, setLoginError] = useState('')

  // Finalizing stage states
  const [finPct, setFinPct] = useState(0)
  const [finStatus, setFinStatus] = useState('Sincronizando subsistemas táticos e módulos offline...')

  // Subordinate operator modal states
  const [showAddOpModal, setShowAddOpModal] = useState(false)
  const [subOpName, setSubOpName] = useState('')
  const [subOpPass, setSubOpPass] = useState('')
  const [subOpLevel, setSubOpLevel] = useState('NÍVEL 03 // OPERADOR TÁTICO (Mapas & IA)')
  const [subOpSuccess, setSubOpSuccess] = useState('')

  const terminalBodyRef = useRef<HTMLDivElement>(null)
  const bootLogRef = useRef<HTMLDivElement>(null)
  const recoveryInputRef = useRef<HTMLInputElement>(null)

  const triggerGlitch = (duration = 180) => {
    setGlitching(true)
    setTimeout(() => setGlitching(false), duration)
  }

  useEffect(() => {
    let mounted = true
    async function initGate() {
      let db = loadAuthDB(tacticalAuth)

      // Se não veio no sharedData nem no localStorage, consulta a API do banco SQLite com query param correto (?key=auth.operators)
      if (db.operators.length === 0) {
        try {
          const res = await fetch('/api/settings?key=auth.operators')
          if (res.ok) {
            const data = await res.json()
            if (data?.value) {
              db = loadAuthDB(data.value)
            }
          }
        } catch {
          // ignore
        }
      }

      if (!mounted) return

      // Garante sincronização bidirecional imediata: salva no localStorage e no SQLite do servidor
      if (db.operators.length > 0) {
        saveAuthDB(db)
        if (!tacticalAuth) {
          syncAuthDBToServer(db)
        }
        window.dispatchEvent(new CustomEvent('nomad:operator-updated'))
      }

      if (db.setupCompleted && db.operators.length > 0) {
        if (db.lockedExplicitly) {
          hasBootedInCurrentDocument = true
          setStage('LOGIN_SCREEN')
        } else if (!hasBootedInCurrentDocument) {
          // Ao dar F5 ou abrir o site: roda APENAS a tela "INICIALIZANDO NEXUS N.O.M.A.D. OS..."
          // um pouco mais rápido (480ms por passo) e entra direto no painel sem pedir login ou recovery!
          hasBootedInCurrentDocument = true
          runCleanStabilizedOSBoot('UNLOCKED', 480)
        } else {
          setStage('UNLOCKED')
        }
      } else {
        hasBootedInCurrentDocument = true
        startColdBootSequence()
      }
    }

    initGate()

    const handleLock = () => {
      setLoginPass('')
      setLoginError('')
      setStage('LOGIN_SCREEN')
    }
    window.addEventListener('nomad:lock-console', handleLock)
    return () => {
      mounted = false
      window.removeEventListener('nomad:lock-console', handleLock)
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
          msg: '[ 0.2091 ] PROCURANDO TABELA DE OPERADORES (nomad_auth_db)...',
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

  function handleMasterRegister(e: React.FormEvent) {
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
    setTpmPct(15)
    setTpmStatus('GERANDO HASH CRIPTOGRÁFICO DE CREDENCIAIS...')

    setTimeout(() => {
      setTpmPct(55)
      setTpmStatus('CRIANDO TABELA DE OPERADORES (nomad_auth_db)...')
    }, 450)

    setTimeout(() => {
      setTpmPct(90)
      setTpmStatus('SELANDO CHAVE MESTRE NO CHIP TPM...')
      const db = loadAuthDB(tacticalAuth)
      const newOp: TacticalOperator = {
        username: user,
        passwordHash: btoa(unescape(encodeURIComponent(regPass))),
        level: 'NÍVEL 05 // COMANDO-GERAL (SUPREMO)',
        isMaster: true,
        createdAt: new Date().toISOString(),
      }
      db.operators = [
        newOp,
        ...db.operators.filter((o) => o.username.toLowerCase() !== user.toLowerCase()),
      ]
      db.setupCompleted = true
      db.activeSession = {
        username: newOp.username,
        level: newOp.level,
        remember: true,
      }
      db.lockedExplicitly = false
      saveAuthDB(db)
      syncAuthDBToServer(db)
    }, 950)

    setTimeout(() => {
      setTpmPct(100)
      setTpmStatus('OPERADOR MESTRE GRAVADO COM SUCESSO!')
    }, 1350)

    setTimeout(() => {
      triggerGlitch(220)
      setTpmProgressVisible(false)
      setRegSubmitting(false)
      setRecoveryStep('AWAIT_INICIAR')
      const safeUser = user.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      appendDynLog(`
        <div style="color: #4ade80; font-weight: bold; margin-top: 6px;">[SUCESSO] Banco de Autenticação inicializado e Operador Mestre salvo!</div>
        <div style="color: #ffffff; font-size: 12px;">[CREDENCIAL ATIVA] Usuário: <strong style="color: #c2a677;">${safeUser}</strong> | Nível: 05 SUPREMO | Status: <strong style="color: #4ade80;">AUTORIZADO</strong></div>
        <div style="margin: 8px 0; border-top: 1px solid #3d4d40; border-bottom: 1px solid #3d4d40; padding: 8px 0; font-size: 11.5px;">
          <div style="color: #eab308; font-weight: bold; margin-bottom: 4px;">=== HISTÓRICO DE TENTATIVAS ANTERIORES NO TERMINAL ===</div>
          <div style="color: #ef4444;">[FALHA] 2026-11-13 02:14:01 | 'iniciar sistema' -&gt; TRAVOU (Falta de Operador Mestre)</div>
          <div style="color: #ef4444;">[FALHA] 2026-11-13 03:40:22 | 'iniciar sistema' -&gt; ABORTADO (Assinatura de segurança ausente)</div>
          <div style="color: #ef4444;">[FALHA] 2026-11-13 05:11:58 | 'iniciar sistema' -&gt; KERNEL LOCKUP (Registro corrompido)</div>
          <div style="color: #728376; font-size: 11px; margin-top: 4px;">Todos os boots anteriores falharam por falta de autorização de Comando.</div>
        </div>
        <div style="color: #86efac; font-size: 11.5px;">[AVISO] Credencial de Comando Supremo agora presente no buffer do Kernel.</div>
      `)
      setRecoveryHint('INICIAR')
      setTimeout(() => recoveryInputRef.current?.focus(), 80)
    }, 1750)
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
            <span style="font-size: 11px; color: #8fa692;">Reinicializando o sistema NEXUS com vídeo estabilizado...</span>
          </div>
        `)
        setTimeout(() => runCleanStabilizedOSBoot('LOGIN_SCREEN', 550), 1200)
      }
    }
    setTimeout(nextRepair, 450)
  }

  function runCleanStabilizedOSBoot(
    targetAfterBoot: 'LOGIN_SCREEN' | 'UNLOCKED' = 'UNLOCKED',
    stepIntervalMs = 480
  ) {
    setStage('CLEAN_BOOT_OS')
    setBootPct(0)
    setBootLogs([])
    setBootStatus('INICIALIZANDO NEXUS N.O.M.A.D. OS...')

    const cleanSteps = [
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
        msg: '[ OK ] BANCO DE OPERADORES (nomad_auth_db) CARREGADO',
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
    const nextStep = () => {
      if (idx < cleanSteps.length) {
        const s = cleanSteps[idx]
        setBootPct(s.pct)
        setBootStatus(s.status)
        setBootLogs((prev) => [...prev, { msg: s.msg, color: '#4ade80' }])
        idx++
        setTimeout(nextStep, stepIntervalMs)
      } else {
        setTimeout(() => {
          if (targetAfterBoot === 'UNLOCKED') {
            setStage('UNLOCKED')
          } else {
            setLoginUser('')
            setLoginPass('')
            setStage('LOGIN_SCREEN')
          }
        }, 450)
      }
    }
    setTimeout(nextStep, 220)
  }

  function handleMainLogin(e: React.FormEvent) {
    e.preventDefault()
    const db = loadAuthDB(tacticalAuth)
    const user = loginUser.trim()
    const encodedPass = btoa(unescape(encodeURIComponent(loginPass)))

    const matched = db.operators.find(
      (o) =>
        o.username.toLowerCase() === user.toLowerCase() &&
        (o.passwordHash === encodedPass || o.passwordHash === loginPass)
    )

    if (!matched) {
      setLoginError('ACESSO NEGADO: Usuário ou senha inválidos no banco nomad_auth_db.')
      triggerGlitch(180)
      return
    }

    setLoginError('')
    db.setupCompleted = true
    db.lockedExplicitly = false
    db.activeSession = {
      username: matched.username,
      level: matched.level,
      remember: rememberSession,
    }
    saveAuthDB(db)
    syncAuthDBToServer(db)
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true')
    window.dispatchEvent(new CustomEvent('nomad:operator-updated'))

    setStage('UNLOCKED')
  }

  function runFinalizingStage() {
    setStage('FINALIZING')
    setFinPct(0)
    setFinStatus('Carregando Acervo de Sobrevivência (Kiwix)...')

    const msgs = [
      'Carregando Acervo de Sobrevivência (Kiwix)...',
      'Validando volumes locais (/dev/nvme0n1)...',
      'Inicializando Núcleo de Análise Tática & Cofre AES-256...',
      'Carregando topografia e telemetria offline...',
      'SISTEMA NEXUS N.O.M.A.D. 100% OPERACIONAL!',
    ]

    let p = 0
    const inv = setInterval(() => {
      p += 25
      setFinPct(Math.min(p, 100))
      setFinStatus(msgs[Math.min(Math.floor(p / 25), msgs.length - 1)])

      if (p >= 100) {
        clearInterval(inv)
        const db = loadAuthDB(tacticalAuth)
        db.setupCompleted = true
        db.lockedExplicitly = false
        saveAuthDB(db)
        syncAuthDBToServer(db)
        setTimeout(() => {
          setStage('UNLOCKED')
        }, 850)
      }
    }, 650)
  }

  function handleAddSubordinateOperator(e: React.FormEvent) {
    e.preventDefault()
    const name = subOpName.trim()
    if (!name || !subOpPass) return

    const db = loadAuthDB(tacticalAuth)
    const newOp: TacticalOperator = {
      username: name,
      passwordHash: btoa(unescape(encodeURIComponent(subOpPass))),
      level: subOpLevel,
      isMaster: false,
      createdAt: new Date().toISOString(),
    }
    db.operators = [
      ...db.operators.filter((o) => o.username.toLowerCase() !== name.toLowerCase()),
      newOp,
    ]
    db.setupCompleted = true
    db.lockedExplicitly = false
    saveAuthDB(db)
    syncAuthDBToServer(db)

    setLoginUser(name)
    setSubOpName('')
    setSubOpPass('')
    setSubOpSuccess(`Operador '${name}' cadastrado com sucesso!`)
    setTimeout(() => {
      setSubOpSuccess('')
      setShowAddOpModal(false)
    }, 900)
  }

  function resetFullBootSimulation() {
    if (typeof window === 'undefined') return
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY)
    syncAuthDBToServer({
      setupCompleted: false,
      operators: [],
      activeSession: null,
      lockedExplicitly: false,
    })
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
              maxWidth: '720px',
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
                PROJETO N.O.M.A.D. OS v1.0.14
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
              <strong style={{ color: '#4ade80' }}>ONLINE (nomad_auth_db)</strong>
            </div>
          </div>

          {/* Formulário de Login */}
          <form
            onSubmit={handleMainLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              className="font-mono-mil"
              style={{
                color: '#c2a677',
                fontWeight: 'bold',
                fontSize: '12px',
                borderLeft: '2px solid #c2a677',
                paddingLeft: '8px',
                textTransform: 'uppercase',
              }}
            >
              ■ AUTENTICAÇÃO DE OPERADOR DE CAMPO:
            </div>

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
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Digite seu usuário..."
                  className="mil-input"
                />
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
                  }}
                >
                  NÍVEL 05 // COMANDO-GERAL
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
                    SENHA DE CAMPO:
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
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="mil-input"
                />
              </div>
            </div>

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
                  Vincular e manter autenticado neste dispositivo local (salvar sessão permanente)
                </span>
              </label>
            </div>

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
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #222c24',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddOpModal(true)}
                className="mil-btn"
                style={{ color: '#8fa692' }}
              >
                ➕ CADASTRAR ACESSO PARA OUTRO OPERADOR
              </button>

              <button
                type="submit"
                className="mil-btn"
                style={{ color: '#4ade80', padding: '10px 20px', fontSize: '12px' }}
              >
                DESTRAVAR CONSOLE ➔
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
            padding: '24px',
            textAlign: 'center',
            maxWidth: '520px',
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

      {/* ========================================================================= */}
      {/* 5. MODAL: CADASTRAR OPERADOR SUBORDINADO (SEM PASSAR PELO FIRST BOOT)     */}
      {/* ========================================================================= */}
      {showAddOpModal && (
        <div
          className="font-mono-mil"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10020,
            background: 'rgba(7, 9, 8, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="boot-chamfer"
            style={{
              width: '100%',
              maxWidth: '440px',
              border: '2px solid #c2a677',
              background: '#141815',
              padding: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #38453b',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                className="font-stencil"
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    background: '#c2a677',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                <span>NOVO ACESSO // ALISTAMENTO DE OPERADOR</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOpModal(false)}
                style={{
                  color: '#728376',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                [ ✕ FECHAR ]
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#8fa692', marginBottom: '16px' }}>
              Cadastre um operador adicional para acessar a base local. Esta conta não precisará
              passar pelo processo de recuperação do sistema:{' '}
              <strong style={{ color: '#ffffff' }}>ela só loga e gg!</strong>
            </p>

            <form
              onSubmit={handleAddSubordinateOperator}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: '#728376',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  Nome do Operador:
                </label>
                <input
                  type="text"
                  required
                  value={subOpName}
                  onChange={(e) => setSubOpName(e.target.value)}
                  placeholder="Ex: Sargento_Silva, Operador_02..."
                  className="mil-input"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: '#728376',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  Senha de Acesso:
                </label>
                <input
                  type="password"
                  required
                  value={subOpPass}
                  onChange={(e) => setSubOpPass(e.target.value)}
                  placeholder="Digite a senha..."
                  className="mil-input"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: '#728376',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  Nível de Autorização:
                </label>
                <select
                  value={subOpLevel}
                  onChange={(e) => setSubOpLevel(e.target.value)}
                  className="mil-input"
                  style={{ color: '#c2a677', fontWeight: 'bold' }}
                >
                  <option value="NÍVEL 01 // RECRUTA (Consulta Básica)">
                    NÍVEL 01 // RECRUTA (Consulta Básica)
                  </option>
                  <option value="NÍVEL 03 // OPERADOR TÁTICO (Mapas & IA)">
                    NÍVEL 03 // OPERADOR TÁTICO (Mapas &amp; IA)
                  </option>
                  <option value="NÍVEL 05 // OFICIAL DE COMANDO (Irrestrito)">
                    NÍVEL 05 // OFICIAL DE COMANDO (Irrestrito)
                  </option>
                </select>
              </div>

              {subOpSuccess && (
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    background: '#0a2916',
                    border: '1px solid #22c55e',
                    color: '#4ade80',
                    fontWeight: 'bold',
                  }}
                >
                  {subOpSuccess}
                </div>
              )}

              <div
                style={{
                  paddingTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddOpModal(false)}
                  className="mil-btn"
                  style={{ color: '#cbd5e1' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="mil-btn" style={{ color: '#c2a677' }}>
                  CADASTRAR ACESSO ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
