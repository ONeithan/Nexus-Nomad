import { useCallback, useEffect, useState } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import { lockTacticalConsole, logoutTacticalConsole } from '~/components/TacticalBootGate'
import {
  getRoleDefinition,
  ROLE_LEVEL_DEFINITIONS,
  type AuthSessionSummary,
  type AuthStatusPayload,
  type OperatorPublic,
  type RoleLevel,
} from '../../../types/auth'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconDeviceDesktop,
  IconKey,
  IconLock,
  IconLogout,
  IconPlus,
  IconShieldCheck,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react'

function formatDate(iso?: string | null) {
  if (!iso) return 'Nunca acessou'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR')
}

export default function ProfileSettingsPage() {
  const { authUser } = usePage<{ authUser?: AuthStatusPayload | null }>().props

  const [loading, setLoading] = useState(true)
  const [currentOperator, setCurrentOperator] = useState<OperatorPublic | null>(
    authUser?.operator ?? null
  )
  const [operators, setOperators] = useState<OperatorPublic[]>([])
  const [sessions, setSessions] = useState<AuthSessionSummary[]>([])
  const [canManage, setCanManage] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Change own password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  // Create new operator state (Level 5 only)
  const [newOpUser, setNewOpUser] = useState('')
  const [newOpPass, setNewOpPass] = useState('')
  const [newOpLevel, setNewOpLevel] = useState<RoleLevel>(3)
  const [creatingOp, setCreatingOp] = useState(false)

  // Inline reset password state for an existing operator
  const [resetPassTargetId, setResetPassTargetId] = useState<number | null>(null)
  const [resetPassValue, setResetPassValue] = useState('')

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev))
    }, 6000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/operators', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        setCurrentOperator(data.currentOperator || null)
        setOperators(Array.isArray(data.operators) ? data.operators : [])
        setSessions(Array.isArray(data.sessions) ? data.sessions : [])
        setCanManage(Boolean(data.canManageOperators))
      }
    } catch {
      showToast('error', 'Não foi possível consultar o banco de operadores no momento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'A confirmação da nova senha não confere.')
      return
    }
    setChangingPass(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        showToast('error', data?.message || 'Erro ao alterar a senha.')
      } else {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        showToast('success', data.message || 'Senha atualizada com sucesso!')
      }
    } catch {
      showToast('error', 'Falha de comunicação ao atualizar a senha.')
    } finally {
      setChangingPass(false)
    }
  }

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingOp(true)
    try {
      const res = await fetch('/api/auth/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          username: newOpUser.trim(),
          password: newOpPass,
          roleLevel: newOpLevel,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        showToast('error', data?.message || 'Erro ao cadastrar operador.')
      } else {
        setNewOpUser('')
        setNewOpPass('')
        setNewOpLevel(3)
        showToast('success', data.message || 'Operador criado no banco de dados!')
        await fetchData()
      }
    } catch {
      showToast('error', 'Falha de comunicação ao criar operador.')
    } finally {
      setCreatingOp(false)
    }
  }

  const handleUpdateOperator = async (
    id: number,
    patch: { roleLevel?: RoleLevel; isActive?: boolean; newPassword?: string }
  ) => {
    try {
      const res = await fetch(`/api/auth/operators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        showToast('error', data?.message || 'Não foi possível atualizar o operador.')
      } else {
        showToast('success', data.message || 'Permissões atualizadas com sucesso!')
        setResetPassTargetId(null)
        setResetPassValue('')
        await fetchData()
      }
    } catch {
      showToast('error', 'Falha de comunicação ao atualizar operador.')
    }
  }

  const handleDeleteOperator = async (op: OperatorPublic) => {
    if (!window.confirm(`Deseja realmente remover o acesso do operador "${op.username}"?`)) {
      return
    }
    try {
      const res = await fetch(`/api/auth/operators/${op.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        showToast('error', data?.message || 'Não foi possível remover este operador.')
      } else {
        showToast('success', data.message || 'Operador removido com sucesso.')
        await fetchData()
      }
    } catch {
      showToast('error', 'Erro de comunicação ao remover operador.')
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        showToast('error', data?.message || 'Não foi possível desconectar a sessão.')
      } else {
        showToast('success', 'Sessão encerrada com sucesso.')
        await fetchData()
      }
    } catch {
      showToast('error', 'Erro ao encerrar sessão remota.')
    }
  }

  const activeDef = getRoleDefinition(currentOperator?.roleLevel)

  return (
    <SettingsLayout>
      <Head title="Perfil & Operadores | Nexus NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-10 py-6 lg:py-8 max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-desert-green-lighter border border-border-default text-xs font-bold uppercase tracking-wider text-desert-green mb-2">
                <IconShieldCheck className="size-4" />
                <span>Autenticação, Perfis &amp; Rede Local</span>
              </div>
              <h1 className="text-3xl font-bold text-desert-green">
                Perfil &amp; Operadores do Sistema
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Gerencie sua sessão atual, altere sua senha e controle os níveis de acesso para
                outros usuários ou computadores acessando pela rede (IPs locais).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border-default bg-surface-primary hover:border-desert-green text-sm font-semibold text-text-primary transition-colors"
              >
                <IconArrowLeft className="size-4" />
                <span>Voltar ao Início</span>
              </Link>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <IconCheck className="size-4 shrink-0" />
              ) : (
                <IconAlertTriangle className="size-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Active Operator Card + Lock / Logout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 chamfer-box p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-mono-mil uppercase text-text-muted block">
                    Operador Conectado Agora
                  </span>
                  <h2 className="text-2xl font-bold text-text-primary mt-0.5">
                    {currentOperator?.username || 'Operador'}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-desert-green/15 border border-desert-green/40 text-desert-green text-xs font-bold font-mono-mil">
                      {currentOperator?.badgeLabel || activeDef.badgeLabel}
                    </span>
                    {authUser?.currentIp && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-secondary border border-border-subtle text-text-secondary text-xs font-mono">
                        IP: {authUser.currentIp}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void lockTacticalConsole()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default bg-surface-secondary hover:border-desert-orange text-xs font-semibold text-text-primary transition-colors cursor-pointer"
                  >
                    <IconLock className="size-3.5" />
                    <span>Bloquear Tela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void logoutTacticalConsole()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <IconLogout className="size-3.5" />
                    <span>Deslogar (Trocar Usuário)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle space-y-2">
                <div className="text-xs font-bold uppercase text-text-primary">
                  Suas Permissões Atuais ({activeDef.title})
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{activeDef.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeDef.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-[11px] px-2 py-0.5 rounded bg-surface-primary border border-border-default text-text-secondary"
                    >
                      ✓ {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <span>
                  Diferença entre <strong>Bloquear</strong> e <strong>Deslogar</strong>: o
                  bloqueio trava o terminal exigindo apenas a senha do usuário atual ({' '}
                  <strong>{currentOperator?.username || 'você'}</strong> ); já o{' '}
                  <strong>Deslogar</strong> encerra a sessão atual para entrar com outro usuário e
                  senha.
                </span>
              </div>
            </div>

            {/* Change Own Password */}
            <div className="chamfer-box p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-text-primary">
                <IconKey className="size-5 text-desert-orange" />
                <h3>Alterar Minha Senha</h3>
              </div>

              <form onSubmit={handleChangeOwnPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Nova Senha (mín. 4 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova senha..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-desert-green hover:bg-btn-green-hover text-white text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <IconKey className="size-4" />
                  <span>{changingPass ? 'Salvando...' : 'Salvar Nova Senha'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* 5 Permission Levels Reference */}
          <div className="chamfer-box p-6 space-y-4">
            <h2 className="text-lg font-bold text-text-primary">
              Hierarquia de Níveis de Permissão (Nível 1 ao Nível 5)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLE_LEVEL_DEFINITIONS.map((def) => (
                <div
                  key={def.level}
                  className={`p-3.5 rounded-xl border ${
                    currentOperator?.roleLevel === def.level
                      ? 'border-desert-green bg-desert-green/10'
                      : 'border-border-subtle bg-surface-secondary/50'
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono-mil text-desert-tan">
                      {def.badgeLabel}
                    </span>
                    {currentOperator?.roleLevel === def.level && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-desert-green text-white font-bold">
                        SEU NÍVEL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{def.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Nível 5 Management */}
          {canManage ? (
            <div className="space-y-6">
              {/* Create new operator */}
              <div className="chamfer-box p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-text-primary">
                  <IconPlus className="size-5 text-desert-green" />
                  <h2>Cadastrar Novo Acesso / Operador (Nível 5)</h2>
                </div>
                <p className="text-xs text-text-secondary">
                  Crie contas individuais para familiares ou membros da rede entrarem por outros
                  computadores/IPs usando usuário e senha próprios.
                </p>

                <form
                  onSubmit={handleCreateOperator}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Nome de Usuário (exato)
                    </label>
                    <input
                      type="text"
                      required
                      value={newOpUser}
                      onChange={(e) => setNewOpUser(e.target.value)}
                      placeholder="Ex: Operador_Casa"
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Senha Inicial
                    </label>
                    <input
                      type="password"
                      required
                      value={newOpPass}
                      onChange={(e) => setNewOpPass(e.target.value)}
                      placeholder="Mín. 4 caracteres"
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Nível de Permissão
                    </label>
                    <select
                      value={newOpLevel}
                      onChange={(e) => setNewOpLevel(Number(e.target.value) as RoleLevel)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border-default text-sm text-text-primary"
                    >
                      {ROLE_LEVEL_DEFINITIONS.map((r) => (
                        <option key={r.level} value={r.level}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingOp}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-desert-green hover:bg-btn-green-hover text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <IconPlus className="size-4" />
                    <span>{creatingOp ? 'Cadastrando...' : 'Cadastrar Acesso'}</span>
                  </button>
                </form>
              </div>

              {/* Operators table */}
              <div className="chamfer-box p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <IconUsers className="size-5 text-desert-tan" />
                    <h2>Operadores Cadastrados ({operators.length})</h2>
                  </div>
                </div>

                {loading ? (
                  <p className="text-xs text-text-muted">Carregando operadores do MySQL...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border-default text-xs uppercase text-text-muted">
                          <th className="py-2.5 pr-4">Usuário</th>
                          <th className="py-2.5 pr-4">Nível de Acesso</th>
                          <th className="py-2.5 pr-4">Status</th>
                          <th className="py-2.5 pr-4">Último Acesso</th>
                          <th className="py-2.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {operators.map((op) => {
                          const isSelf = currentOperator?.id === op.id
                          return (
                            <tr key={op.id}>
                              <td className="py-3 pr-4 font-semibold text-text-primary">
                                {op.username}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-desert-green/20 text-desert-green font-bold">
                                    VOCÊ
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                <select
                                  value={op.roleLevel}
                                  onChange={(e) =>
                                    void handleUpdateOperator(op.id, {
                                      roleLevel: Number(e.target.value) as RoleLevel,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-md bg-surface-secondary border border-border-default text-xs text-text-primary"
                                >
                                  {ROLE_LEVEL_DEFINITIONS.map((r) => (
                                    <option key={r.level} value={r.level}>
                                      Nível {r.level} — {r.shortLabel}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 pr-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUpdateOperator(op.id, { isActive: !op.isActive })
                                  }
                                  className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                                    op.isActive
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                      : 'bg-red-500/15 border-red-500/40 text-red-400'
                                  }`}
                                >
                                  {op.isActive ? 'Ativo' : 'Desativado'}
                                </button>
                              </td>
                              <td className="py-3 pr-4 text-xs text-text-muted">
                                {formatDate(op.lastLoginAt)}
                              </td>
                              <td className="py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  {resetPassTargetId === op.id ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <input
                                        type="password"
                                        value={resetPassValue}
                                        onChange={(e) => setResetPassValue(e.target.value)}
                                        placeholder="Nova senha"
                                        className="w-32 px-2 py-1 rounded bg-surface-secondary border border-border-default text-xs text-text-primary"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleUpdateOperator(op.id, {
                                            newPassword: resetPassValue,
                                          })
                                        }
                                        className="px-2 py-1 rounded bg-desert-green text-white text-xs font-bold cursor-pointer"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setResetPassTargetId(null)
                                          setResetPassValue('')
                                        }}
                                        className="px-2 py-1 rounded bg-surface-secondary text-xs text-text-muted cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResetPassTargetId(op.id)
                                        setResetPassValue('')
                                      }}
                                      className="px-2.5 py-1 rounded bg-surface-secondary border border-border-default text-xs text-text-primary hover:border-desert-tan cursor-pointer"
                                    >
                                      Redefinir Senha
                                    </button>
                                  )}
                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteOperator(op)}
                                      className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer"
                                      title="Excluir operador"
                                    >
                                      <IconTrash className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Active LAN Sessions */}
              <div className="chamfer-box p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-text-primary">
                  <IconDeviceDesktop className="size-5 text-desert-green" />
                  <h2>Sessões Conectadas por IP ({sessions.length})</h2>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-text-muted">Nenhuma sessão ativa registrada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border-default uppercase text-text-muted">
                          <th className="py-2 pr-4">Operador</th>
                          <th className="py-2 pr-4">IP de Origem</th>
                          <th className="py-2 pr-4">Estado</th>
                          <th className="py-2 pr-4">Última Atividade</th>
                          <th className="py-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2.5 pr-4 font-semibold text-text-primary">
                              {s.username} (Nível {s.roleLevel})
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-text-secondary">
                              {s.ipAddress || '—'}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`px-2 py-0.5 rounded font-semibold ${
                                  s.isLocked
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-emerald-500/15 text-emerald-400'
                                }`}
                              >
                                {s.isLocked ? 'Bloqueado' : 'Ativo'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-text-muted">
                              {formatDate(s.lastSeenAt)}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => void handleRevokeSession(s.id)}
                                className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer"
                              >
                                Desconectar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary/50 text-xs text-text-secondary flex items-center gap-2">
              <IconLock className="size-4 text-text-muted shrink-0" />
              <span>
                O gerenciamento de contas e permissões de outros operadores é exclusivo de contas{' '}
                <strong>Nível 5 — Admin Total</strong>.
              </span>
            </div>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
