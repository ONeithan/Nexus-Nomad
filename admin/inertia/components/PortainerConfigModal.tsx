import React, { useEffect, useState } from 'react'
import { Link } from '@inertiajs/react'
import {
  IconBrandDocker,
  IconCheck,
  IconInfoCircle,
  IconKey,
  IconPlugConnected,
  IconServer,
  IconSettings,
} from '@tabler/icons-react'
import StyledModal from './StyledModal'
import StyledButton from './StyledButton'
import Input from './inputs/Input'
import api from '~/lib/api'
import { useNotifications } from '~/context/NotificationContext'

export interface PortainerConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PortainerConfigModal({ isOpen, onClose }: PortainerConfigModalProps) {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'portainer' | 'truenas'>('portainer')

  // Portainer State
  const [portainerLoading, setPortainerLoading] = useState(false)
  const [portainerTesting, setPortainerTesting] = useState(false)
  const [portainerUrl, setPortainerUrl] = useState('')
  const [portainerKey, setPortainerKey] = useState('')
  const [portainerStatus, setPortainerStatus] = useState<{
    enabled?: boolean
    online?: boolean
    version?: string
    authenticated?: boolean
    totalContainers?: number
    runningContainers?: number
    apiKey?: string
    containers?: any[]
    error?: string
  } | null>(null)

  // TrueNAS State
  const [truenasLoading, setTruenasLoading] = useState(false)
  const [truenasTesting, setTruenasTesting] = useState(false)
  const [truenasUrl, setTruenasUrl] = useState('')
  const [truenasKey, setTruenasKey] = useState('')
  const [truenasStatus, setTruenasStatus] = useState<{
    enabled?: boolean
    online?: boolean
    version?: string
    hostname?: string
    pools?: string[]
    apiKey?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadStatuses()
    }
  }, [isOpen])

  async function loadStatuses() {
    setPortainerLoading(true)
    setTruenasLoading(true)
    try {
      const [pRes, tRes] = await Promise.all([api.getPortainerStatus(), api.getTruenasStatus()])
      if (pRes?.status) {
        setPortainerStatus(pRes.status)
        if (pRes.status.url) setPortainerUrl(pRes.status.url)
        if (pRes.status.apiKey) setPortainerKey(pRes.status.apiKey)
      }
      if (tRes?.status) {
        setTruenasStatus(tRes.status)
        if (tRes.status.url) setTruenasUrl(tRes.status.url)
        if (tRes.status.apiKey) setTruenasKey(tRes.status.apiKey)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPortainerLoading(false)
      setTruenasLoading(false)
    }
  }

  // ── Portainer Handlers ───────────────────────────────────────────────────────
  async function handleTestPortainer() {
    setPortainerTesting(true)
    try {
      const res = await api.testPortainer({
        url: portainerUrl.trim(),
        apiKey: portainerKey.trim(),
      })
      if (res?.status) {
        setPortainerStatus(res.status)
        if (res.success) {
          addNotification({
            message: `Conexão estabelecida com sucesso no Portainer (${res.status.version || 'Online'})`,
            type: 'success',
          })
        } else {
          addNotification({
            message: res.status.error || 'Não foi possível conectar ao Portainer.',
            type: 'error',
          })
        }
      }
    } catch {
      addNotification({
        message: 'Falha ao testar conexão com o Portainer.',
        type: 'error',
      })
    } finally {
      setPortainerTesting(false)
    }
  }

  async function handleSavePortainer() {
    setPortainerLoading(true)
    try {
      const cleanUrl = portainerUrl.trim()
      await api.updateSetting('portainer.url', cleanUrl)
      await api.updateSetting('portainer.enabled', true)
      if (portainerKey.trim()) {
        await api.updateSetting('portainer.apiKey', portainerKey.trim())
      }
      await api.updateSetting('portainer.deployTarget', 'portainer')
      addNotification({
        message: 'Servidor Portainer ativado com sucesso! Carregando aplicações do servidor...',
        type: 'success',
      })
      onClose()
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao salvar configurações do Portainer.',
        type: 'error',
      })
    } finally {
      setPortainerLoading(false)
    }
  }

  async function handleDeactivatePortainer() {
    setPortainerLoading(true)
    try {
      await api.updateSetting('portainer.enabled', false)
      await api.updateSetting('portainer.deployTarget', 'local')
      addNotification({
        message: 'Servidor Portainer desativado. Retornando ao modo local.',
        type: 'info',
      })
      onClose()
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao desativar o servidor Portainer.',
        type: 'error',
      })
    } finally {
      setPortainerLoading(false)
    }
  }

  // ── TrueNAS Handlers ────────────────────────────────────────────────────────
  async function handleTestTruenas() {
    setTruenasTesting(true)
    try {
      const res = await api.testTruenas({
        url: truenasUrl.trim(),
        apiKey: truenasKey.trim(),
      })
      if (res?.status) {
        setTruenasStatus(res.status)
        if (res.success) {
          addNotification({
            message: `TrueNAS conectado com sucesso! (${res.status.version || res.status.hostname})`,
            type: 'success',
          })
        } else {
          addNotification({
            message: res.status.error || 'Não foi possível conectar ao TrueNAS.',
            type: 'error',
          })
        }
      }
    } catch {
      addNotification({
        message: 'Falha ao testar conexão com o servidor TrueNAS.',
        type: 'error',
      })
    } finally {
      setTruenasTesting(false)
    }
  }

  async function handleSaveTruenas() {
    setTruenasLoading(true)
    try {
      const cleanUrl = truenasUrl.trim()
      await api.updateSetting('truenas.url', cleanUrl)
      await api.updateSetting('truenas.enabled', true)
      if (truenasKey.trim()) {
        await api.updateSetting('truenas.apiKey', truenasKey.trim())
      }
      addNotification({
        message: 'Servidor TrueNAS configurado com sucesso!',
        type: 'success',
      })
      onClose()
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao salvar configurações do TrueNAS.',
        type: 'error',
      })
    } finally {
      setTruenasLoading(false)
    }
  }

  return (
    <StyledModal
      title="Gerenciador de Servidores Remotos"
      open={isOpen}
      onCancel={onClose}
      onConfirm={activeTab === 'portainer' ? handleSavePortainer : handleSaveTruenas}
      confirmText={
        activeTab === 'portainer'
          ? portainerStatus?.enabled
            ? 'Atualizar Portainer'
            : 'Salvar e Ativar Portainer'
          : truenasStatus?.enabled
            ? 'Atualizar TrueNAS'
            : 'Salvar e Ativar TrueNAS'
      }
      confirmIcon="IconCheck"
      confirmVariant="primary"
      confirmLoading={portainerLoading || truenasLoading}
    >
      <div className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
        {/* Tab selection */}
        <div className="flex border-b border-border-subtle gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('portainer')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'portainer'
                ? 'border-desert-green text-desert-green-darker bg-desert-sand/20'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <IconBrandDocker size={16} />
            Portainer (Docker)
            {portainerStatus?.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('truenas')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'truenas'
                ? 'border-desert-green text-desert-green-darker bg-desert-sand/20'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <IconServer size={16} />
            TrueNAS (Storage)
            {truenasStatus?.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
          <Link
            href="/settings/servers"
            className="ml-auto flex items-center gap-1 text-[11px] text-desert-green hover:underline px-2 py-1"
          >
            <IconSettings size={14} />
            Página Completa
          </Link>
        </div>

        {/* ── PORTAINER TAB ── */}
        {activeTab === 'portainer' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <IconBrandDocker className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-emerald-300 text-sm">
                    Servidor Docker Remoto (Portainer)
                  </p>
                  <span
                    className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${
                      portainerStatus?.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-surface-primary text-text-muted border border-border-subtle'
                    }`}
                  >
                    {portainerStatus?.enabled ? 'Nó Ativo' : 'Aguardando Ativação'}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Ao ativar este nó, os novos aplicativos serão implantados e executados diretamente
                  no seu servidor Portainer remoto, sem consumir armazenamento ou CPU do seu computador.
                </p>
              </div>
            </div>

            {/* Live connection badge */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    portainerStatus?.online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-text-muted'
                  }`}
                />
                <span className="font-medium text-text-primary text-xs">
                  {portainerStatus?.online
                    ? `Online · ${portainerStatus.version || 'Portainer CE'} (${portainerStatus.runningContainers ?? 0} contêineres ativos)`
                    : 'Status: Pronto para testar e conectar'}
                </span>
              </div>
              <StyledButton
                size="sm"
                variant="outline"
                icon="IconPlugConnected"
                onClick={handleTestPortainer}
                loading={portainerTesting}
              >
                Testar Conexão
              </StyledButton>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <Input
                name="portainer-url"
                label="Endereço IP / URL do Portainer"
                placeholder="https://192.168.1.100:9443 ou http://192.168.1.100:9000"
                value={portainerUrl}
                onChange={(e) => setPortainerUrl(e.target.value)}
              />

              <Input
                name="portainer-key"
                label="Token de Acesso / API Key"
                placeholder="ptr_... (gerado no perfil de usuário do Portainer)"
                value={portainerKey}
                type="password"
                onChange={(e) => setPortainerKey(e.target.value)}
              />
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-desert-green-darker">
                <IconKey size={16} />
                Como pegar o Token de Acesso no Portainer:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-text-secondary leading-relaxed">
                <li>Acesse o Portainer no seu navegador (<code className="font-mono">https://&lt;IP&gt;:9443</code>).</li>
                <li>Clique no seu usuário no canto superior direito e clique em <strong>My Account</strong>.</li>
                <li>Role até a seção <strong>Access tokens</strong>.</li>
                <li>Clique no botão <strong>+ Add access token</strong>.</li>
                <li>Dê uma descrição (ex: <em>NOMAD</em>) e clique em <strong>Create access token</strong>.</li>
                <li>Copie o token gerado (<code className="font-mono text-emerald-600">ptr_...</code>) e cole no campo acima.</li>
              </ol>
            </div>

            {/* Deactivate option if enabled */}
            {portainerStatus?.enabled && (
              <div className="pt-2 border-t border-border-subtle flex justify-end">
                <StyledButton
                  size="sm"
                  variant="outline"
                  onClick={handleDeactivatePortainer}
                  loading={portainerLoading}
                  className="text-text-muted hover:text-red-400"
                >
                  Desativar Nó Remoto (Voltar para Local)
                </StyledButton>
              </div>
            )}
          </div>
        )}

        {/* ── TRUENAS TAB ── */}
        {activeTab === 'truenas' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <IconServer className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-emerald-300 text-sm">
                    Servidor de Armazenamento TrueNAS
                  </p>
                  <span
                    className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${
                      truenasStatus?.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-surface-primary text-text-muted border border-border-subtle'
                    }`}
                  >
                    {truenasStatus?.enabled ? 'Conectado' : 'Aguardando Configuração'}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Conecte o seu servidor TrueNAS para integração de pools ZFS, compartilhamentos de rede
                  e gerenciamento de armazenamento compartilhado.
                </p>
              </div>
            </div>

            {/* Live connection badge */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-subtle">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    truenasStatus?.online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-text-muted'
                  }`}
                />
                <span className="font-medium text-text-primary text-xs">
                  {truenasStatus?.online
                    ? `Online · ${truenasStatus.version || 'TrueNAS'} (${truenasStatus.pools?.join(', ') || 'OK'})`
                    : 'Status: Pronto para testar e conectar'}
                </span>
              </div>
              <StyledButton
                size="sm"
                variant="outline"
                icon="IconPlugConnected"
                onClick={handleTestTruenas}
                loading={truenasTesting}
              >
                Testar Conexão
              </StyledButton>
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <Input
                name="truenas-url"
                label="Endereço IP / URL do TrueNAS"
                placeholder="https://192.168.1.50 ou http://192.168.1.50"
                value={truenasUrl}
                onChange={(e) => setTruenasUrl(e.target.value)}
              />

              <Input
                name="truenas-key"
                label="Chave de API do TrueNAS (API Key)"
                placeholder="Cole a chave de API gerada no TrueNAS"
                value={truenasKey}
                type="password"
                onChange={(e) => setTruenasKey(e.target.value)}
              />
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-desert-green-darker">
                <IconKey size={16} />
                Como gerar a Chave de API no TrueNAS:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-text-secondary leading-relaxed">
                <li>Acesse o painel do TrueNAS pelo navegador (<code className="font-mono">https://&lt;IP&gt;</code>).</li>
                <li>No canto superior direito, clique no menu do usuário e clique em <strong>API Keys</strong>.</li>
                <li>Clique no botão <strong>Add API Key</strong>.</li>
                <li>Defina um nome (ex: <em>NOMAD</em>) e confirme a criação.</li>
                <li>Copie a chave gerada imediatamente e cole no campo acima.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </StyledModal>
  )
}
