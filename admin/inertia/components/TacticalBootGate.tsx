import React, { useState, useEffect, useRef } from 'react'
import api from '~/lib/api'

export interface OperatorRecord {
  id: string
  username: string
  passwordHash: string
  level: string
  isMaster: boolean
  createdAt: string
}

export interface AuthDBState {
  schemaVersion: string
  initializedAt: string | null
  setupCompleted: boolean
  operators: OperatorRecord[]
  activeSession: {
    operatorId: string
    username: string
    level: string
    persistent: boolean
    loggedInAt: string
  } | null
}

const DB_KEY = 'nomad_auth_db'

function hashSecret(str: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'nomad_h2_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

export const NomadAuthDB = {
  load(): AuthDBState {
    if (typeof window === 'undefined') {
      return {
        schemaVersion: '1.0',
        initializedAt: null,
        setupCompleted: false,
        operators: [],
        activeSession: null,
      }
    }
    try {
      const raw = window.localStorage.getItem(DB_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return {
      schemaVersion: '1.0',
      initializedAt: null,
      setupCompleted: false,
      operators: [],
      activeSession: null,
    }
  },
  save(db: AuthDBState) {
    if (typeof window === 'undefined') return
    try {
      const serialized = JSON.stringify(db)
      window.localStorage.setItem(DB_KEY, serialized)
      api.updateSetting('auth.operators', serialized).catch(() => {})
    } catch {}
  },
  registerOperator(username: string, password: string, level: string, isMaster = false) {
    const db = this.load()
    if (!db.initializedAt) db.initializedAt = new Date().toISOString()
    const existingIdx = db.operators.findIndex(
      (o) => o.username.toLowerCase() === username.toLowerCase()
    )
    const record: OperatorRecord = {
      id: 'OP-' + String(db.operators.length + 1).padStart(3, '0'),
      username,
      passwordHash: hashSecret(password),
      level,
      isMaster,
      createdAt: new Date().toISOString(),
    }
    if (existingIdx >= 0) {
      db.operators[existingIdx] = record
    } else {
      db.operators.push(record)
    }
    this.save(db)
    return record
  },
  authenticate(username: string, password: string): OperatorRecord | null {
    const db = this.load()
    const op = db.operators.find((o) => o.username.toLowerCase() === username.toLowerCase())
    if (!op) return null
    if (op.passwordHash === hashSecret(password)) return op
    return null
  },
  setSession(op: OperatorRecord, persistent: boolean) {
    const db = this.load()
    db.activeSession = {
      operatorId: op.id,
      username: op.username,
      level: op.level,
      persistent: !!persistent,
      loggedInAt: new Date().toISOString(),
    }
    this.save(db)
    try {
      if (persistent) {
        window.localStorage.setItem('nomad_session_active', 'true')
      } else {
        window.localStorage.removeItem('nomad_session_active')
      }
    } catch {}
  },
  clearSession() {
    const db = this.load()
    db.activeSession = null
    this.save(db)
    try {
      window.localStorage.removeItem('nomad_session_active')
    } catch {}
  },
  markSetupCompleted() {
    const db = this.load()
    db.setupCompleted = true
    this.save(db)
    try {
      window.localStorage.setItem('nomad_setup_fully_completed', 'true')
    } catch {}
  },
  resetAll() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(DB_KEY)
      window.localStorage.removeItem('nomad_session_active')
      window.localStorage.removeItem('nomad_setup_fully_completed')
      api.updateSetting('auth.operators', '').catch(() => {})
    } catch {}
  },
}

type Stage =
  | 'CRT_POWERON'
  | 'COLD_BOOT_OS'
  | 'RECOVERY'
  | 'CLEAN_BOOT_OS'
  | 'LOGIN'
  | 'FINALIZING'
  | 'AUTHENTICATED'

type RecoverySubStep = 'AWAIT_HELP' | 'AWAIT_LOGIN' | 'CREATING_USER' | 'AWAIT_INICIAR' | 'STABILIZING'

export default function TacticalBootGate({
  children,
  onOperatorChange,
  forceLoginTrigger,
}: {
  children: React.ReactNode
  onOperatorChange?: (op: { username: string; level: string }) => void
  forceLoginTrigger?: number
}) {
  const [stage, setStage] = useState<Stage>(() => {
    const db = NomadAuthDB.load()
    let setupDone = db.setupCompleted
    let sessionActive = Boolean(db.activeSession)
    try {
      if (window.localStorage.getItem('nomad_setup_fully_completed') === 'true') setupDone = true
      if (window.localStorage.getItem('nomad_session_active') === 'true') sessionActive = true
    } catch {}
    if (setupDone && sessionActive) return 'AUTHENTICATED'
    if (setupDone) return 'LOGIN'
    return 'CRT_POWERON'
  })

  const [glitching, setGlitching] = useState(false)
  const [bootPct, setBootPct] = useState(0)
  const [bootStatus, setBootStatus] = useState('INICIALIZANDO SISTEMA OPERACIONAL...')
  const [bootLogs, setBootLogs] = useState<Array<{ text: string; color: string }>>([])

  const [recStep, setRecStep] = useState<RecoverySubStep>('AWAIT_HELP')
  const [recLogs, setRecLogs] = useState<string[]>([])
  const [recHint, setRecHint] = useState<string>('')
  const [recInput, setRecInput] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Registration form
  const [regUser, setRegUser] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [showRegPass1, setShowRegPass1] = useState(false)
  const [showRegPass2, setShowRegPass2] = useState(false)
  const [regError, setRegError] = useState('')
  const [tpmProgress, setTpmProgress] = useState<number | null>(null)
  const [tpmStatusText, setTpmStatusText] = useState('')

  // Login form
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [rememberSession, setRememberSession] = useState(true)
  const [loginMsg, setLoginMsg] = useState<{ text: string; isError: boolean } | null>(null)

  // Subordinate operator modal
  const [addOpModal, setAddOpModal] = useState(false)
  const [subUser, setSubUser] = useState('')
  const [subPass, setSubPass] = useState('')
  const [subLevel, setSubLevel] = useState('NÍVEL 03 // OPERADOR TÉCNICO')

  // Finalizing progress
  const [finPct, setFinPct] = useState(0)
  const [finStatus, setFinStatus] = useState('Sincronizando subsistemas táticos e módulos offline...')

  const recBodyRef = useRef<HTMLDivElement>(null)
  const recInputRef = useRef<HTMLInputElement>(null)

  const triggerGlitch = (ms = 180) => {
    setGlitching(true)
    setTimeout(() => setGlitching(false), ms)
  }

  // Sync operator info when authenticated
  useEffect(() => {
    if (stage === 'AUTHENTICATED' && onOperatorChange) {
      const db = NomadAuthDB.load()
      const username =
        db.activeSession?.username || db.operators[0]?.username || 'OPERADOR'
      const level =
        db.activeSession?.level || db.operators[0]?.level || 'NÍVEL 05 // COMANDO-GERAL'
      onOperatorChange({ username, level })
    }
  }, [stage])

  // External logout trigger
  useEffect(() => {
    if (forceLoginTrigger && forceLoginTrigger > 0) {
      NomadAuthDB.clearSession()
      setStage('LOGIN')
    }
  }, [forceLoginTrigger])

  // Periodic screen glitch every 5s during unstable stages
  useEffect(() => {
    if (stage !== 'CRT_POWERON' && stage !== 'COLD_BOOT_OS' && stage !== 'RECOVERY') return
    const timer = setInterval(() => {
      triggerGlitch(180)
    }, 5000)
    return () => clearInterval(timer)
  }, [stage])

  // Stage 0 -> Stage 1
  useEffect(() => {
    if (stage !== 'CRT_POWERON') return
    const t = setTimeout(() => {
      triggerGlitch(220)
      setStage('COLD_BOOT_OS')
    }, 1850)
    return () => clearTimeout(t)
  }, [stage])

  // Stage 1: Cold Boot OS sequence
  useEffect(() => {
    if (stage !== 'COLD_BOOT_OS') return
    setBootPct(0)
    setBootLogs([])
    setBootStatus('INICIALIZANDO SISTEMA OPERACIONAL...')

    const steps = [
      {
        pct: 14,
        color: '#a1b8a6',
        status: 'ENERGIZANDO HARDWARE NEXUS-01...',
        msg: '[ 0.00 ] ENERGIZANDO PLACA PRINCIPAL NEXUS-01 (BATERIA 14%)...',
      },
      {
        pct: 29,
        color: '#a1b8a6',
        status: 'CARREGANDO KERNEL MIL-STD-810H...',
        msg: '[ 0.85 ] CARREGANDO KERNEL MIL-STD-810H v1.0.12-nexus...',
      },
      {
        pct: 46,
        color: '#a1b8a6',
        status: 'MONTANDO UNIDADES NVMe...',
        msg: '[ 1.90 ] INICIALIZANDO SUBSISTEMA DE ARQUIVOS (/dev/nvme0n1)...',
      },
      {
        pct: 64,
        color: '#c2a677',
        status: 'VERIFICANDO TABELA DE OPERADORES...',
        msg: '[ 3.10 ] VERIFICANDO TABELA DE USUÁRIOS E PERMISSÕES...',
      },
      {
        pct: 79,
        color: '#eab308',
        status: 'ALERTA: FALHA DE INTEGRIDADE...',
        msg: '[ 4.40 ] [ALERTA] FALHA DE INTEGRIDADE DETECTADA NOS REGISTROS!',
      },
      {
        pct: 91,
        color: '#ef4444',
        status: 'ERRO CRÍTICO NO BANCO DE DADOS...',
        msg: '[ 5.60 ] [ERRO] SETOR DE AUTENTICAÇÃO CORROMPIDO (0xFF00AA)',
      },
      {
        pct: 100,
        color: '#ef4444',
        status: 'ATIVANDO MODO DE RECUPERAÇÃO...',
        msg: '[ 6.80 ] ABORTANDO BOOT NORMAL -> ENTRANDO EM MODO DE RECUPERAÇÃO...',
      },
    ]

    let idx = 0
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      if (idx < steps.length) {
        const s = steps[idx]
        setBootPct(s.pct)
        setBootStatus(s.status)
        setBootLogs((prev) => [...prev, { text: s.msg, color: s.color }])
        if (s.pct >= 79) triggerGlitch(150)
        idx++
        setTimeout(tick, 900)
      } else {
        setTimeout(() => {
          if (!cancelled) {
            triggerGlitch(260)
            setStage('RECOVERY')
          }
        }, 1000)
      }
    }

    const startTimer = setTimeout(tick, 450)
    return () => {
      cancelled = true
      clearTimeout(startTimer)
    }
  }, [stage])

  // Stage 2: Recovery intro
  useEffect(() => {
    if (stage !== 'RECOVERY') return
    setRecStep('AWAIT_HELP')
    setRecLogs([])
    setShowCreateForm(false)
    setRecHint("DIGITE 'help' NO CONSOLE PARA TENTAR CARREGAR O MANUAL DE RECUPERAÇÃO...")

    const intro = [
      '<span style="color:#eab308;font-weight:bold;">[ ▲ ALERTA DE ENERGIA CRÍTICA // BATERIA 14% // ALIMENTAÇÃO AUXILIAR INSTÁVEL ]</span>',
      '<span style="color:#8fa692;">[ DETECTADO HARDWARE MILITAR RUGGEDIZADO NEXUS-01 // MODO OFF-GRID ]</span>',
      '<span style="color:#ef4444;font-weight:bold;">[ KERNEL TRAP 0x0000007B // INFORMAÇÕES DE REGISTRO CORROMPIDAS ]</span>',
      '<div style="border-top:1px solid #2d382e;border-bottom:1px solid #2d382e;padding:8px 0;margin:6px 0;color:#9bb3a0;"><div style="color:#fde047;font-weight:bold;">AVISO DO SUBSISTEMA DE CONTINGÊNCIA N.O.M.A.D. (OFF-GRID RECOVERY):</div><div>• BANCO DE DADOS LOCAL: <strong style="color:#ef4444;">INACESSÍVEL / NÃO LOCALIZADO</strong></div><div>• TABELA DE PERMISSÕES &amp; OPERADORES: <strong style="color:#ef4444;">CORROMPIDA</strong></div><div>• STATUS DOS DISCOS NVME: <span style="color:#eab308;">MONTADO SOMENTE-LEITURA (/dev/nvme0n1)</span></div></div>',
    ]

    setRecLogs(intro)
    setTimeout(() => recInputRef.current?.focus(), 200)
  }, [stage])

  // Scroll recovery terminal on new logs
  useEffect(() => {
    if (recBodyRef.current) {
      recBodyRef.current.scrollTop = recBodyRef.current.scrollHeight
    }
  }, [recLogs, showCreateForm, tpmProgress])

  // Clean Reboot OS stage before Login
  useEffect(() => {
    if (stage !== 'CLEAN_BOOT_OS') return
    setBootPct(0)
    setBootLogs([])
    setBootStatus('INICIALIZANDO NEXUS N.O.M.A.D. OS ESTABILIZADO...')

    const cleanSteps = [
      { pct: 20, status: 'SINCRONIZANDO KERNEL ESTABILIZADO...', msg: '[ OK ] KERNEL MIL-STD-810H INICIADO SEM ERROS' },
      { pct: 45, status: 'MONTANDO VOLUMES DE LEITURA/ESCRITA...', msg: '[ OK ] /dev/nvme0n1 MONTADO EM MODO READ/WRITE' },
      { pct: 70, status: 'CONECTANDO BANCO DE AUTENTICAÇÃO...', msg: '[ OK ] BANCO DE OPERADORES (nomad_auth_db) CARREGADO' },
      { pct: 90, status: 'INICIALIZANDO INTERFACE DE LOGIN...', msg: '[ OK ] SUBSISTEMA DE AUTENTICAÇÃO PRONTO' },
      { pct: 100, status: 'SISTEMA PRONTO // ABRINDO LOGIN...', msg: '[ 100% ] BEM-VINDO AO NEXUS N.O.M.A.D. OS v1.0.12' },
    ]

    let idx = 0
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      if (idx < cleanSteps.length) {
        const s = cleanSteps[idx]
        setBootPct(s.pct)
        setBootStatus(s.status)
        setBootLogs((prev) => [...prev, { text: s.msg, color: '#4ade80' }])
        idx++
        setTimeout(tick, 700)
      } else {
        setTimeout(() => {
          if (!cancelled) setStage('LOGIN')
        }, 750)
      }
    }
    const t = setTimeout(tick, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [stage])

  // Finalizing stage
  useEffect(() => {
    if (stage !== 'FINALIZING') return
    setFinPct(0)
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
      setFinPct(p)
      setFinStatus(msgs[Math.min(Math.floor(p / 25), msgs.length - 1)])
      if (p >= 100) {
        clearInterval(inv)
        NomadAuthDB.markSetupCompleted()
        setTimeout(() => setStage('AUTHENTICATED'), 800)
      }
    }, 650)
    return () => clearInterval(inv)
  }, [stage])

  const appendLog = (html: string) => {
    setRecLogs((prev) => [...prev, html])
  }

  const runRecoveryCommand = (rawCmd: string) => {
    const clean = rawCmd.toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ').trim()
    triggerGlitch(160)
    appendLog(
      `<div style="color:#ffffff;font-weight:bold;margin-top:4px;"><span style="color:#eab308;">RECOVERY:~$</span> ${rawCmd}</div>`
    )

    if (recStep === 'AWAIT_HELP') {
      if (clean === 'help') {
        appendLog('<div style="color:#8fa692;">[EXECUTANDO: /bin/help --verbose --emergency-mode...]</div>')
        setTimeout(() => {
          triggerGlitch(160)
          appendLog(
            `<div style="color:#ef4444;font-weight:bold;">[ERRO CRÍTICO] Falha ao localizar /bin/help ou manual de diretrizes (/usr/share/nomad/manual.db).</div>
             <div style="color:#fca5a5;">• Setor de comandos corrompido: get_command_table() retornou NULL (0x00000000).</div>
             <div style="color:#fca5a5;">• Código de falha: 0xFF00AA (SETOR_ILEGÍVEL // ASSINATURA_AUSENTE).</div>
             <div style="color:#eab308;">• Partições detectadas: /dev/nvme0n1p1 [SOMENTE-LEITURA] | /dev/nvme0n1p2 [BLOQUEADA].</div>
             <div style="color:#8fa692;">• Estado de Segurança: AUTH_REQUIRED (Nenhum operador mestre autenticado na tabela local).</div>`
          )
          setRecStep('AWAIT_LOGIN')
          setRecHint("É NECESSÁRIO FAZER LOGIN. Por favor, digite 'login' no console.")
        }, 550)
      } else {
        appendLog(
          `<div style="color:#ef4444;">Comando '${rawCmd}' desconhecido no modo de emergência. Digite <strong style="color:#fde047;">help</strong>.</div>`
        )
      }
      return
    }

    if (recStep === 'AWAIT_LOGIN') {
      if (clean === 'login') {
        setRecStep('CREATING_USER')
        appendLog(
          `<div style="color:#4ade80;">[INICIANDO ROTINA DE AUTENTICAÇÃO MIL-STD-810H // MÓDULO TPM 2.0...]</div>
           <div style="color:#728376;">0x7FFF0010: SCANNING /srv/data/auth/nomad_auth.db ...... [FALHA: ARQUIVO INACESSÍVEL]</div>
           <div style="color:#728376;">0x7FFF002C: VERIFICANDO REGISTRADORES PCR[0..7] DO TPM .. [INTEGRIDADE COMPROMETIDA]</div>
           <div style="color:#728376;">0x7FFF0048: CHECANDO CHAVE MESTRE DE COMANDO ........... [CORROMPIDA: 0x00000000]</div>
           <div style="color:#728376;">0x7FFF009C: CONSULTANDO TABELA DE OPERADORES ATIVOS ..... [0 REGISTROS ENCONTRADOS]</div>
           <div style="color:#eab308;font-weight:bold;">[PROTOCOLO DE CONTINGÊNCIA] Liberando módulo de criação emergencial de Operador Mestre:</div>`
        )
        setTimeout(() => {
          setShowCreateForm(true)
          setRecHint('Preencha o formulário acima para registrar seu Operador Mestre.')
        }, 450)
      } else {
        appendLog(
          `<div style="color:#ef4444;">Acesso restrito. Digite <strong style="color:#fde047;">login</strong> para prosseguir.</div>`
        )
      }
      return
    }

    if (recStep === 'AWAIT_INICIAR') {
      if (clean === 'iniciar sistema' || clean === 'iniciar' || clean === 'start') {
        setRecStep('STABILIZING')
        appendLog(
          `<div style="color:#4ade80;font-weight:bold;margin-top:6px;">SISTEMA OPERACIONAL TÁTICO MILITAR MIL-STD-810H // INICIALIZANDO REPAROS DE KERNEL:</div>
           <div style="color:#a1b8a6;">• REPARANDO SETOR DE BOOT &amp; TABELA MBR/GPT MIL-STD-810H ... <strong style="color:#4ade80;">[CORRIGIDO ✓]</strong></div>
           <div style="color:#a1b8a6;">• RECONSTRUINDO TABELA DE VOLUMES NVMe (/dev/nvme0n1p1) ... <strong style="color:#4ade80;">[CORRIGIDO ✓]</strong></div>
           <div style="color:#a1b8a6;">• MONTANDO PARTIÇÕES TÁTICAS EM MODO LEITURA/ESCRITA ... <strong style="color:#4ade80;">[CORRIGIDO ✓]</strong></div>
           <div style="color:#a1b8a6;">• VALIDANDO CHECKSUM SHA-256 DO KERNEL &amp; ESTABILIZANDO VÍDEO ... <strong style="color:#4ade80;">[CORRIGIDO ✓]</strong></div>`
        )
        setTimeout(() => {
          setStage('CLEAN_BOOT_OS')
        }, 1600)
      } else {
        appendLog(
          `<div style="color:#fde047;">Comando pendente: Digite <strong style="color:#4ade80;">iniciar sistema</strong> no console.</div>`
        )
      }
    }
  }

  const handleMasterRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regUser.trim() || !regPass) {
      setRegError('Informe usuário e senha.')
      return
    }
    if (regPass !== regPassConfirm) {
      setRegError('As senhas não coincidem. Confirme a senha corretamente.')
      return
    }
    setRegError('')
    setTpmProgress(20)
    setTpmStatusText('GERANDO HASH CRIPTOGRÁFICO DE CREDENCIAIS...')

    setTimeout(() => {
      setTpmProgress(60)
      setTpmStatusText('CRIANDO TABELA DE OPERADORES (nomad_auth_db & KVStore)...')
    }, 450)

    setTimeout(() => {
      setTpmProgress(95)
      setTpmStatusText('SELANDO CHAVE MESTRE NO CHIP TPM...')
      NomadAuthDB.registerOperator(
        regUser.trim(),
        regPass,
        'NÍVEL 05 // COMANDO-GERAL (SUPREMO)',
        true
      )
    }, 900)

    setTimeout(() => {
      setTpmProgress(null)
      setShowCreateForm(false)
      triggerGlitch(200)
      setRecStep('AWAIT_INICIAR')
      appendLog(
        `<div style="color:#4ade80;font-weight:bold;margin-top:6px;">[SUCESSO] Banco de Autenticação inicializado e Operador Mestre salvo!</div>
         <div style="color:#ffffff;">[CREDENCIAL ATIVA] Usuário: <strong style="color:#c2a677;">${regUser.trim()}</strong> | Nível: 05 SUPREMO | Status: <strong style="color:#4ade80;">AUTORIZADO</strong></div>
         <div style="color:#86efac;">[AVISO] Digite <strong>iniciar sistema</strong> abaixo para reiniciar o Kernel estabilizado e abrir a tela de Login.</div>`
      )
      setRecHint("DIGITE 'iniciar sistema' NO CONSOLE PARA INICIALIZAR O N.O.M.A.D...")
      setTimeout(() => recInputRef.current?.focus(), 100)
    }, 1450)
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const matched = NomadAuthDB.authenticate(loginUser.trim(), loginPass)
    if (!matched) {
      setLoginMsg({
        text: 'ACESSO NEGADO: Usuário ou senha inválidos no banco nomad_auth_db.',
        isError: true,
      })
      return
    }
    setLoginMsg(null)
    NomadAuthDB.setSession(matched, rememberSession)
    const db = NomadAuthDB.load()
    if (!db.setupCompleted) {
      setStage('FINALIZING')
    } else {
      setStage('AUTHENTICATED')
    }
  }

  const handleAddSubOperator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subUser.trim() || !subPass) return
    NomadAuthDB.registerOperator(subUser.trim(), subPass, subLevel, false)
    setAddOpModal(false)
    setSubUser('')
    setSubPass('')
    setLoginMsg({
      text: `Operador '${subUser.trim()}' gravado no banco nomad_auth_db! Já pode autenticar.`,
      isError: false,
    })
  }

  const handleResetTest = () => {
    NomadAuthDB.resetAll()
    setStage('CRT_POWERON')
  }

  if (stage === 'AUTHENTICATED') {
    return <>{children}</>
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#080b09] text-[#e5ece6] font-mono overflow-y-auto flex items-center justify-center p-4"
      style={{
        transform: glitching ? 'translate(-2px, 1px) skewX(-0.4deg)' : 'none',
        filter: glitching ? 'brightness(1.22) contrast(1.15)' : 'none',
        transition: 'transform 0.08s ease',
      }}
    >
      {/* Scanlines sutis */}
      <div
        className="pointer-events-none fixed inset-0 z-[10000]"
        style={{
          background:
            'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.32) 50%), linear-gradient(90deg, rgba(255,0,0,0.015), rgba(0,255,0,0.01), rgba(0,0,255,0.015))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* STAGE 0: CRT POWER-ON */}
      {stage === 'CRT_POWERON' && (
        <div className="fixed inset-0 bg-[#020302] flex flex-col items-center justify-center">
          <div
            className="w-full h-1 bg-white animate-pulse"
            style={{
              boxShadow: '0 0 25px 6px #4ade80, 0 0 50px 12px #ffffff',
            }}
          />
          <div className="text-xs tracking-widest text-[#4d6050] absolute bottom-8 uppercase">
            ENERGIZANDO TUBO CRT // MIL-STD-810H...
          </div>
        </div>
      )}

      {/* STAGE 1 & CLEAN REBOOT: OS SPLASH SCREEN */}
      {(stage === 'COLD_BOOT_OS' || stage === 'CLEAN_BOOT_OS') && (
        <div className="chamfer-box w-full max-w-2xl bg-[#0c120e] border-2 border-[#3d4d40] p-7 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#27352a] pb-2.5 mb-5 text-xs">
            <span className="text-[#8fa692]">NEXUS-01 // BIOS REV 4.2-MIL</span>
            <span
              style={{
                color: stage === 'CLEAN_BOOT_OS' ? '#4ade80' : '#eab308',
              }}
            >
              {stage === 'CLEAN_BOOT_OS'
                ? 'ESTABILIDADE DE VÍDEO: 100% NOMINAL'
                : 'ALIMENTAÇÃO: BATERIA AUXILIAR (14%)'}
            </span>
          </div>

          <div className="text-center mb-5">
            <div className="text-[10px] text-[#728376] tracking-[4px] mb-1">
              SISTEMA OPERACIONAL TÁTICO DE CAMPO
            </div>
            <div
              className="text-5xl font-black tracking-[10px] text-[#c2a677]"
              style={{ textShadow: '0 0 24px rgba(194,166,119,0.35)' }}
            >
              NEXUS
            </div>
            <div className="text-xs text-[#4ade80] tracking-[3px] mt-2 font-bold">
              PROJETO N.O.M.A.D. OS v1.0.12
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-4 w-4 rounded-full border-2 border-[#27352a] border-t-[#c2a677] animate-spin" />
            <span className="text-xs font-bold text-[#e5ece6]">{bootStatus}</span>
          </div>

          <div className="w-full bg-[#080d09] border border-[#3d4d40] h-4 rounded p-0.5 mb-4 overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${bootPct}%`,
                background: 'linear-gradient(90deg, #15803d, #4ade80)',
              }}
            />
          </div>

          <div className="bg-[#080d09] border border-[#222c24] rounded p-3 h-40 overflow-y-auto text-xs space-y-1">
            {bootLogs.map((l, i) => (
              <div key={i} style={{ color: l.color }}>
                {l.text}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-3 text-[11px] text-[#647466]">
            <span>MIL-STD-810H // OFF-GRID</span>
            <span className="text-[#4ade80] font-bold">{bootPct}%</span>
          </div>
        </div>
      )}

      {/* STAGE 2: RECOVERY TERMINAL */}
      {stage === 'RECOVERY' && (
        <div className="chamfer-box w-full max-w-4xl bg-[#0c120e] border-2 border-[#3d4d40] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#141b16] border-b border-[#27352a] text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308] animate-pulse" />
              <span className="font-bold text-[#eab308]">
                N.O.M.A.D. RECOVERY // KERNEL MIL-STD-810H (MODO DE EMERGÊNCIA)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStage('AUTHENTICATED')}
                className="px-2.5 py-1 rounded border border-[#4d6050] bg-[#1d2720] text-[#8fa692] hover:text-white text-[10px] font-bold cursor-pointer"
              >
                PULAR BOOT ➔
              </button>
              <button
                type="button"
                onClick={handleResetTest}
                className="px-2.5 py-1 rounded border border-[#4d6050] bg-[#1d2720] text-[#c2a677] hover:text-white text-[10px] font-bold cursor-pointer"
              >
                🔄 REINICIAR TESTE
              </button>
            </div>
          </div>

          <div
            ref={recBodyRef}
            className="p-5 text-xs leading-relaxed text-[#c2d6c6] min-h-[340px] max-h-[62vh] overflow-y-auto space-y-2"
          >
            {recLogs.map((html, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}

            {recHint && (
              <div className="text-[#c2a677] font-bold pt-2">
                &gt;&gt;&gt; {recHint}{' '}
                {recStep === 'AWAIT_HELP' && (
                  <button
                    type="button"
                    onClick={() => runRecoveryCommand('help')}
                    className="underline text-white ml-1 cursor-pointer"
                  >
                    [Executar help]
                  </button>
                )}
                {recStep === 'AWAIT_LOGIN' && (
                  <button
                    type="button"
                    onClick={() => runRecoveryCommand('login')}
                    className="underline text-white ml-1 cursor-pointer"
                  >
                    [Executar login]
                  </button>
                )}
                {recStep === 'AWAIT_INICIAR' && (
                  <button
                    type="button"
                    onClick={() => runRecoveryCommand('iniciar sistema')}
                    className="underline text-white ml-1 cursor-pointer"
                  >
                    [Executar iniciar sistema]
                  </button>
                )}
              </div>
            )}

            {showCreateForm && (
              <div className="mt-4 p-4 border-t-2 border-[#c2a677] bg-[#121914] rounded">
                <div className="flex items-center justify-between border-b border-[#2d382e] pb-2 mb-3">
                  <span className="font-bold text-white uppercase">
                    ■ CRIAÇÃO DE ACESSO MESTRE // NÍVEL SUPREMO (COMANDO-GERAL)
                  </span>
                  <span className="text-[10px] bg-[#451a03] text-[#fde047] border border-[#b45309] font-bold px-2 py-0.5 rounded">
                    PRIMEIRO ACESSO
                  </span>
                </div>

                <form onSubmit={handleMasterRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                        IDENTIFICAÇÃO / USUÁRIO:
                      </label>
                      <input
                        type="text"
                        required
                        value={regUser}
                        onChange={(e) => setRegUser(e.target.value)}
                        placeholder="Ex: Operador-01"
                        className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs focus:border-[#c2a677] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                        NÍVEL DE AUTORIZAÇÃO:
                      </label>
                      <div className="h-9 bg-[#080d09] border border-[#c2a677]/60 rounded px-3 text-[#c2a677] font-bold text-xs flex items-center justify-between">
                        <span>★ NÍVEL 05 // SUPREMO</span>
                        <span className="text-[10px] text-[#4ade80] bg-[#052e16] px-1.5 py-0.5 rounded border border-[#166534]">
                          TOTAL
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] text-[#728376] font-bold uppercase">
                          SENHA DE CAMPO:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowRegPass1((v) => !v)}
                          className="text-[10px] text-[#c2a677] underline cursor-pointer"
                        >
                          {showRegPass1 ? '🔒 OCULTAR' : '👁️ MOSTRAR'}
                        </button>
                      </div>
                      <input
                        type={showRegPass1 ? 'text' : 'password'}
                        required
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="Digite a senha..."
                        className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs focus:border-[#c2a677] focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] text-[#728376] font-bold uppercase">
                          CONFIRMAR SENHA:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowRegPass2((v) => !v)}
                          className="text-[10px] text-[#c2a677] underline cursor-pointer"
                        >
                          {showRegPass2 ? '🔒 OCULTAR' : '👁️ MOSTRAR'}
                        </button>
                      </div>
                      <input
                        type={showRegPass2 ? 'text' : 'password'}
                        required
                        value={regPassConfirm}
                        onChange={(e) => setRegPassConfirm(e.target.value)}
                        placeholder="Repita a senha..."
                        className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs focus:border-[#c2a677] focus:outline-none"
                      />
                    </div>
                  </div>

                  {tpmProgress !== null && (
                    <div className="bg-[#080d09] border border-[#2e3d30] rounded p-2.5">
                      <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[#4ade80]">
                        <span className="h-3 w-3 rounded-full border-2 border-[#27352a] border-t-[#c2a677] animate-spin" />
                        <span>{tpmStatusText}</span>
                      </div>
                      <div className="w-full bg-[#141b16] h-2 rounded overflow-hidden">
                        <div
                          className="h-full bg-[#4ade80] transition-all duration-300"
                          style={{ width: `${tpmProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {regError && (
                    <div className="text-red-400 text-xs font-bold bg-red-950/70 p-2 rounded border border-red-800">
                      {regError}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={tpmProgress !== null}
                      className="px-4 py-2 rounded border border-[#4d6050] bg-[#1d2720] text-[#4ade80] hover:text-white font-bold text-xs cursor-pointer"
                    >
                      ⚡ REGISTRAR OPERADOR NO BANCO &amp; TPM ➔
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-[#090e0b] border-t border-[#27352a] text-xs">
            <span className="text-[#eab308] font-bold">RECOVERY:~$</span>
            <input
              ref={recInputRef}
              type="text"
              value={recInput}
              onChange={(e) => setRecInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && recInput.trim()) {
                  const cmd = recInput.trim()
                  setRecInput('')
                  runRecoveryCommand(cmd)
                }
              }}
              placeholder="Digite os comandos de recuperação (ex: help, login, iniciar sistema)..."
              className="flex-1 bg-transparent text-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* STAGE 3: LOGIN SCREEN */}
      {stage === 'LOGIN' && (
        <div className="chamfer-box w-full max-w-3xl bg-[#0c120e] border-2 border-[#3d4d40] p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#2d382e] pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="font-bold text-white text-sm tracking-wider uppercase">
                  N.O.M.A.D. BOOT KERNEL // POSTO DE COMANDO TÁTICO
                </span>
              </div>
              <p className="text-[11px] text-[#728376] mt-1">
                SISTEMA OPERACIONAL TÁTICO MILITAR DE CAMPO &amp; SOBREVIVÊNCIA OFFLINE
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTest}
                className="px-2.5 py-1 rounded border border-[#4d6050] bg-[#1d2720] text-[#c2a677] hover:text-white text-[10px] font-bold cursor-pointer"
              >
                🔄 REINICIAR TESTE
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#080d09] border border-[#222c24] rounded text-[11px] text-[#8fa692] space-y-0.5">
            <div>
              [ 0.001024 ] BIOS MIL-STD-810H LOADED: HARDWARE SECURE...{' '}
              <strong className="text-[#4ade80]">OK</strong>
            </div>
            <div>
              [ 0.014290 ] INITIALIZING NVME ENCRYPTED MATRIX (/dev/nvme0n1)...{' '}
              <strong className="text-[#4ade80]">OK</strong>
            </div>
            <div>
              [ 0.038102 ] MOUNTING ZIM SURVIVAL CORPUS &amp; RAG ENGINE...{' '}
              <strong className="text-[#4ade80]">OK</strong>
            </div>
            <div>
              [ 0.078210 ] AUTH DATABASE:{' '}
              <strong className="text-[#4ade80]">ONLINE (nomad_auth_db)</strong>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-[#c2a677] font-bold text-xs border-l-2 border-[#c2a677] pl-2 uppercase">
              ■ AUTENTICAÇÃO DE OPERADOR DE CAMPO:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                  IDENTIFICAÇÃO / USUÁRIO:
                </label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Digite seu usuário..."
                  className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs focus:border-[#c2a677] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                  NÍVEL DE AUTORIZAÇÃO:
                </label>
                <div className="h-9 flex items-center bg-[#080d09] border border-[#3e4f41] rounded px-3 text-[#c2a677] font-bold text-xs">
                  NÍVEL 05 // COMANDO-GERAL
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-[#728376] font-bold uppercase">
                    SENHA DE CAMPO:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="text-[10px] text-[#c2a677] underline font-bold cursor-pointer"
                  >
                    {showLoginPass ? '🔒 OCULTAR SENHA' : '👁️ MOSTRAR SENHA'}
                  </button>
                </div>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs focus:border-[#c2a677] focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[#8fa692] text-xs select-none">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="h-4 w-4"
              />
              <span>
                Vincular e manter autenticado neste dispositivo local (salvar sessão permanente)
              </span>
            </label>

            {loginMsg && (
              <div
                className={`text-xs font-bold p-2.5 rounded border ${
                  loginMsg.isError
                    ? 'text-red-400 bg-red-950/70 border-red-800'
                    : 'text-[#4ade80] bg-emerald-950/70 border-emerald-700'
                }`}
              >
                {loginMsg.text}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222c24]">
              <button
                type="button"
                onClick={() => setAddOpModal(true)}
                className="px-3.5 py-2 rounded border border-[#4d6050] bg-[#1d2720] text-[#8fa692] hover:text-white text-xs font-bold cursor-pointer"
              >
                ➕ CADASTRAR ACESSO PARA OUTRO OPERADOR
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded border border-[#4d6050] bg-[#1d2720] text-[#4ade80] hover:text-white text-xs font-bold cursor-pointer"
              >
                DESTRAVAR CONSOLE ➔
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAGE 4: FINALIZING */}
      {stage === 'FINALIZING' && (
        <div className="chamfer-box w-full max-w-lg bg-[#0c120e] border-2 border-[#3d4d40] p-6 text-center space-y-3.5 shadow-2xl">
          <div className="text-[#4ade80] font-bold text-sm tracking-wider uppercase">
            NEXUS N.O.M.A.D. // FINALIZANDO SUBSISTEMAS OPERACIONAIS
          </div>
          <p className="text-xs text-[#8fa692]">
            Autenticação confirmada. Carregando os módulos táticos de sobrevivência...
          </p>
          <div className="w-full bg-[#080d09] border border-[#2e3d30] h-4 rounded p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#22c55e] rounded transition-all duration-500"
              style={{ width: `${finPct}%` }}
            />
          </div>
          <div className="text-xs text-[#c2a677] font-bold">{finStatus}</div>
        </div>
      )}

      {/* ADD SUBORDINATE OPERATOR MODAL */}
      {addOpModal && (
        <div className="fixed inset-0 z-[10005] bg-black/80 flex items-center justify-center p-4">
          <div className="chamfer-box w-full max-w-md bg-[#0c120e] border-2 border-[#3d4d40] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27352a] pb-2">
              <span className="font-bold text-[#c2a677] text-xs uppercase">
                ➕ CADASTRAR NOVO OPERADOR DE CAMPO
              </span>
              <button
                type="button"
                onClick={() => setAddOpModal(false)}
                className="text-xs text-[#8fa692] hover:text-white cursor-pointer"
              >
                ✕ FECHAR
              </button>
            </div>
            <form onSubmit={handleAddSubOperator} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                  IDENTIFICAÇÃO / NOME DO OPERADOR:
                </label>
                <input
                  type="text"
                  required
                  value={subUser}
                  onChange={(e) => setSubUser(e.target.value)}
                  placeholder="Ex: Operador-02"
                  className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                  SENHA DE ACESSO:
                </label>
                <input
                  type="password"
                  required
                  value={subPass}
                  onChange={(e) => setSubPass(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#728376] font-bold uppercase mb-1">
                  PATENTE / NÍVEL DE ACESSO:
                </label>
                <select
                  value={subLevel}
                  onChange={(e) => setSubLevel(e.target.value)}
                  className="w-full h-9 bg-[#080d09] border border-[#3e4f41] rounded px-3 text-[#c2a677] text-xs"
                >
                  <option value="NÍVEL 04 // OFICIAL EXECUTIVO">NÍVEL 04 // OFICIAL EXECUTIVO</option>
                  <option value="NÍVEL 03 // OPERADOR TÉCNICO">NÍVEL 03 // OPERADOR TÉCNICO</option>
                  <option value="NÍVEL 02 // CONSULTA MÉDICA &amp; MAPAS">
                    NÍVEL 02 // CONSULTA MÉDICA &amp; MAPAS
                  </option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpModal(false)}
                  className="px-3 py-1.5 rounded border border-[#3e4f41] text-xs text-[#8fa692] cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded border border-[#4d6050] bg-[#1d2720] text-[#4ade80] font-bold text-xs cursor-pointer"
                >
                  SALVAR NO BANCO ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

