import { useState } from 'react'
import { IconKey, IconCopy, IconCheck, IconLockOpen, IconUserPlus, IconShieldLock } from '@tabler/icons-react'
import { getAppDefaultCredentials } from '../../constants/app_catalog_data'

interface AppCredentialsCardProps {
  appId: string
  className?: string
}

/**
 * Displays initial login credentials, password, and first-access setup notes
 * for any application in the NOMAD catalog.
 */
export default function AppCredentialsCard({ appId, className = '' }: AppCredentialsCardProps) {
  const creds = getAppDefaultCredentials(appId)
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | null>(null)

  const copyValue = (val: string, field: 'user' | 'pass') => {
    if (!val || typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(val).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    }).catch(() => {})
  }

  const badgeStyle =
    creds.mode === 'fixed'
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      : creds.mode === 'none'
        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
        : 'bg-sky-500/15 text-sky-400 border-sky-500/30'

  const badgeLabel =
    creds.mode === 'fixed'
      ? 'Login & Senha Padrão de Fábrica'
      : creds.mode === 'none'
        ? 'Acesso Direto (Sem Login)'
        : 'Cadastro no 1º Acesso'

  const ModeIcon =
    creds.mode === 'fixed'
      ? IconKey
      : creds.mode === 'none'
        ? IconLockOpen
        : IconUserPlus

  return (
    <div className={`rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider font-mono-mil">
          <IconShieldLock size={18} />
          <span>Credenciais de Acesso &amp; Login Inicial</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
          <ModeIcon size={13} />
          {badgeLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-surface-primary border border-border-subtle flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[0.625rem] uppercase tracking-wider text-text-muted font-mono block">
              Usuário / Login
            </span>
            <span className="text-sm font-mono font-bold text-text-primary break-all">
              {creds.username}
            </span>
          </div>
          {creds.mode === 'fixed' && !creds.username.startsWith('(') && (
            <button
              type="button"
              onClick={() => copyValue(creds.username, 'user')}
              className="p-1.5 rounded-md bg-surface-secondary hover:bg-desert-green/15 text-text-muted hover:text-desert-green border border-border-subtle transition-colors cursor-pointer shrink-0"
              title="Copiar usuário"
            >
              {copiedField === 'user' ? <IconCheck size={14} className="text-emerald-500" /> : <IconCopy size={14} />}
            </button>
          )}
        </div>

        <div className="p-3 rounded-lg bg-surface-primary border border-border-subtle flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[0.625rem] uppercase tracking-wider text-text-muted font-mono block">
              Senha Padrão
            </span>
            <span className="text-sm font-mono font-bold text-text-primary break-all">
              {creds.password}
            </span>
          </div>
          {creds.mode === 'fixed' && !creds.password.startsWith('(') && (
            <button
              type="button"
              onClick={() => copyValue(creds.password, 'pass')}
              className="p-1.5 rounded-md bg-surface-secondary hover:bg-desert-green/15 text-text-muted hover:text-desert-green border border-border-subtle transition-colors cursor-pointer shrink-0"
              title="Copiar senha"
            >
              {copiedField === 'pass' ? <IconCheck size={14} className="text-emerald-500" /> : <IconCopy size={14} />}
            </button>
          )}
        </div>
      </div>

      {creds.note && (
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Observação:</strong> {creds.note}
        </p>
      )}
    </div>
  )
}
