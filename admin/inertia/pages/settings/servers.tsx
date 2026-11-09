import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import Input from '~/components/inputs/Input'
import api from '~/lib/api'
import { useNotifications } from '~/context/NotificationContext'
import {
  IconBrandDocker,
  IconCheck,
  IconCopy,
  IconDatabase,
  IconDeviceDesktop,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconKey,
  IconPlugConnected,
  IconRefresh,
  IconServer,
  IconTrash,
  IconWorld,
  IconAlertTriangle,
} from '@tabler/icons-react'

export interface PortainerContainerInfo {
  id?: string
  name: string
  image: string
  state: string
  status: string
  ports: string[]
}

interface PageProps {
  portainer?: {
    enabled: boolean
    online: boolean
    url: string
    endpointId: number
    authenticated: boolean
    version?: string
    totalContainers?: number
    runningContainers?: number
    containers?: PortainerContainerInfo[]
    apiKey?: string
    error?: string
  }
  truenas?: {
    enabled: boolean
    online: boolean
    url: string
    version?: string
    hostname?: string
    pools?: string[]
    apiKey?: string
    error?: string
  }
}

export default function ServersSettingsPage({ portainer: initialPortainer, truenas: initialTruenas }: PageProps) {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'portainer' | 'truenas'>('portainer')

  // ── Portainer State ─────────────────────────────────────────────────────────
  const [portainerStatus, setPortainerStatus] = useState(initialPortainer || null)
  const [portainerUrl, setPortainerUrl] = useState(initialPortainer?.url || '')
  const [portainerApiKey, setPortainerApiKey] = useState(initialPortainer?.apiKey || '')
  const [testingPortainer, setTestingPortainer] = useState(false)
  const [savingPortainer, setSavingPortainer] = useState(false)
  const [showPortainerKey, setShowPortainerKey] = useState(false)

  const isPortainerConfigured = Boolean(portainerStatus?.url && portainerStatus?.enabled)
  const [isEditingPortainer, setIsEditingPortainer] = useState(!initialPortainer?.enabled || !initialPortainer?.url)

  // ── TrueNAS State ───────────────────────────────────────────────────────────
  const [truenasStatus, setTruenasStatus] = useState(initialTruenas || null)
  const [truenasUrl, setTruenasUrl] = useState(initialTruenas?.url || '')
  const [truenasApiKey, setTruenasApiKey] = useState(initialTruenas?.apiKey || '')
  const [testingTruenas, setTestingTruenas] = useState(false)
  const [savingTruenas, setSavingTruenas] = useState(false)
  const [showTruenasKey, setShowTruenasKey] = useState(false)

  const isTruenasConfigured = Boolean(truenasStatus?.url && truenasStatus?.enabled)
  const [isEditingTruenas, setIsEditingTruenas] = useState(!initialTruenas?.enabled || !initialTruenas?.url)

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function copyToClipboard(text: string, label: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    addNotification({
      message: `${label} copiado para a área de transferência!`,
      type: 'info',
    })
  }

  // ── Portainer Handlers ──────────────────────────────────────────────────────
  async function handleTestPortainer() {
    setTestingPortainer(true)
    try {
      const res = await api.testPortainer({
        url: portainerUrl.trim(),
        apiKey: portainerApiKey.trim(),
      })
      if (res?.status) {
        setPortainerStatus(res.status)
        if (res.success) {
          addNotification({
            message: `Portainer conectado com sucesso! (${res.status.version || 'Online'})`,
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
        message: 'Falha ao testar conexão com o servidor Portainer.',
        type: 'error',
      })
    } finally {
      setTestingPortainer(false)
    }
  }

  async function handleSavePortainer(enable = true) {
    setSavingPortainer(true)
    try {
      const cleanUrl = portainerUrl.trim()
      await api.updateSetting('portainer.url', cleanUrl)
      await api.updateSetting('portainer.enabled', enable)
      if (portainerApiKey.trim()) {
        await api.updateSetting('portainer.apiKey', portainerApiKey.trim())
      }
      await api.updateSetting('portainer.deployTarget', enable ? 'portainer' : 'local')

      addNotification({
        message: enable
          ? 'Servidor Portainer vinculado e salvo com sucesso!'
          : 'Servidor Portainer desativado.',
        type: 'success',
      })
      setIsEditingPortainer(false)
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao salvar configurações do Portainer.',
        type: 'error',
      })
    } finally {
      setSavingPortainer(false)
    }
  }

  async function handleRemovePortainer() {
    if (
      !window.confirm(
        'Tem certeza que deseja desvincular e remover este servidor Portainer? As aplicações locais não serão afetadas.'
      )
    ) {
      return
    }

    setSavingPortainer(true)
    try {
      await api.updateSetting('portainer.url', '')
      await api.updateSetting('portainer.apiKey', '')
      await api.updateSetting('portainer.enabled', false)
      await api.updateSetting('portainer.deployTarget', 'local')

      setPortainerUrl('')
      setPortainerApiKey('')
      setPortainerStatus(null)
      setIsEditingPortainer(true)

      addNotification({
        message: 'Servidor Portainer removido e desvinculado com sucesso.',
        type: 'info',
      })
    } catch {
      addNotification({
        message: 'Erro ao desvincular o servidor Portainer.',
        type: 'error',
      })
    } finally {
      setSavingPortainer(false)
    }
  }

  // ── TrueNAS Handlers ────────────────────────────────────────────────────────
  async function handleTestTruenas() {
    setTestingTruenas(true)
    try {
      const res = await api.testTruenas({
        url: truenasUrl.trim(),
        apiKey: truenasApiKey.trim(),
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
      setTestingTruenas(false)
    }
  }

  async function handleSaveTruenas(enable = true) {
    setSavingTruenas(true)
    try {
      const cleanUrl = truenasUrl.trim()
      await api.updateSetting('truenas.url', cleanUrl)
      await api.updateSetting('truenas.enabled', enable)
      if (truenasApiKey.trim()) {
        await api.updateSetting('truenas.apiKey', truenasApiKey.trim())
      }

      addNotification({
        message: enable ? 'TrueNAS vinculado com sucesso!' : 'TrueNAS desativado.',
        type: 'success',
      })
      setIsEditingTruenas(false)
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao salvar configurações do TrueNAS.',
        type: 'error',
      })
    } finally {
      setSavingTruenas(false)
    }
  }

  async function handleRemoveTruenas() {
    if (
      !window.confirm(
        'Tem certeza que deseja desvincular e remover este servidor TrueNAS?'
      )
    ) {
      return
    }

    setSavingTruenas(true)
    try {
      await api.updateSetting('truenas.url', '')
      await api.updateSetting('truenas.apiKey', '')
      await api.updateSetting('truenas.enabled', false)

      setTruenasUrl('')
      setTruenasApiKey('')
      setTruenasStatus(null)
      setIsEditingTruenas(true)

      addNotification({
        message: 'Servidor TrueNAS removido e desvinculado com sucesso.',
        type: 'info',
      })
    } catch {
      addNotification({
        message: 'Erro ao desvincular o servidor TrueNAS.',
        type: 'error',
      })
    } finally {
      setSavingTruenas(false)
    }
  }

  return (
    <SettingsLayout>
      <Head title="Servidores Remotos | Nexus NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-desert-green mb-2">Servidores Remotos</h1>
            <p className="text-desert-stone-dark">
              Vincule servidores externos para execução remota de contêineres Docker (Portainer) ou
              armazenamento de arquivos e bibliotecas (TrueNAS).
            </p>
          </div>

          {/* Seletor de Abas */}
          <div className="flex border-b border-desert-stone-lighter/60 mb-8 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('portainer')}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'portainer'
                  ? 'border-desert-green text-desert-green-darker bg-desert-sand/20'
                  : 'border-transparent text-desert-stone hover:text-desert-green-darker'
              }`}
            >
              <IconBrandDocker size={18} />
              Servidor Docker (Portainer)
              {portainerStatus?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('truenas')}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'truenas'
                  ? 'border-desert-green text-desert-green-darker bg-desert-sand/20'
                  : 'border-transparent text-desert-stone hover:text-desert-green-darker'
              }`}
            >
              <IconServer size={18} />
              Servidor TrueNAS (Storage)
              {truenasStatus?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              )}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              ABA 1: PORTAINER
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'portainer' && (
            <div className="space-y-8">
              {/* CARD: NÓ CONECTADO (quando configurado e não está em edição) */}
              {!isEditingPortainer && isPortainerConfigured ? (
                <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm space-y-6">
                  {/* Cabeçalho do Nó Conectado */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-desert-stone-lighter/40">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                        <IconBrandDocker size={28} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-desert-green-darker">
                            Nó de Execução Remoto (Portainer)
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-desert-olive/10 text-desert-olive-dark font-medium">
                            Nó Conectado
                          </span>
                        </div>
                        <p className="text-xs text-desert-stone">
                          Servidor dedicado para implantação e execução de contêineres Docker
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          portainerStatus?.online ? 'bg-emerald-500 animate-pulse shadow-sm' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                        {portainerStatus?.online ? 'ATIVO & ONLINE' : 'INACESSÍVEL / OFFLINE'}
                      </span>
                    </div>
                  </div>

                  {/* Grade de Informações e Métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-secondary border border-border-subtle text-xs">
                    <div>
                      <span className="text-desert-stone block mb-1">Endereço do Servidor:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-desert-green-darker font-mono break-all">
                          {portainerUrl}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(portainerUrl, 'Endereço IP')}
                          className="text-desert-stone hover:text-desert-green p-0.5"
                          title="Copiar Endereço"
                        >
                          <IconCopy size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Token de Acesso / API:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-desert-green-darker font-mono">
                          {showPortainerKey
                            ? portainerApiKey || 'Chave oculta'
                            : '••••••••••••••••••••••••'}
                        </strong>
                        {portainerApiKey && (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowPortainerKey(!showPortainerKey)}
                              className="text-desert-stone hover:text-desert-green p-0.5"
                              title={showPortainerKey ? 'Ocultar Token' : 'Mostrar Token'}
                            >
                              {showPortainerKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(portainerApiKey, 'Token')}
                              className="text-desert-stone hover:text-desert-green p-0.5"
                              title="Copiar Token"
                            >
                              <IconCopy size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Versão do Portainer:</span>
                      <strong className="text-desert-green-darker font-semibold">
                        {portainerStatus?.version || 'Portainer CE'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Contêineres Ativos / Total:</span>
                      <strong className="text-desert-green-darker font-semibold">
                        {portainerStatus?.runningContainers ?? 0} ativos / {portainerStatus?.totalContainers ?? 0} cadastrados
                      </strong>
                    </div>
                  </div>

                  {/* Lista de Contêineres Detectados no Nó Remoto */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconBrandDocker size={18} className="text-desert-olive-dark" />
                        <h3 className="text-sm font-bold text-desert-green-darker">
                          Aplicações e Contêineres no Servidor Remoto
                          {portainerStatus?.containers && ` (${portainerStatus.containers.length})`}
                        </h3>
                      </div>
                      <span className="text-xs text-desert-stone">
                        Sincronizado automaticamente via API do Portainer
                      </span>
                    </div>

                    {portainerStatus?.containers && portainerStatus.containers.length > 0 ? (
                      <div className="border border-desert-stone-lighter/50 rounded-lg overflow-hidden bg-desert-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-desert-sand/20 border-b border-desert-stone-lighter/40 text-desert-stone-dark font-semibold">
                              <tr>
                                <th className="px-4 py-2.5">Nome do Contêiner</th>
                                <th className="px-4 py-2.5">Imagem Docker</th>
                                <th className="px-4 py-2.5">Estado</th>
                                <th className="px-4 py-2.5">Portas de Rede</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-desert-stone-lighter/30">
                              {portainerStatus.containers.map((c, idx) => {
                                const isRunning = c.state === 'running'
                                return (
                                  <tr key={c.id || idx} className="hover:bg-desert-sand/10 transition-colors">
                                    <td className="px-4 py-2.5 font-medium text-desert-green-darker flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          isRunning ? 'bg-emerald-500' : 'bg-gray-400'
                                        }`}
                                      />
                                      {c.name}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-desert-stone text-[11px] truncate max-w-[200px]" title={c.image}>
                                      {c.image}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                          isRunning
                                            ? 'bg-emerald-500/10 text-emerald-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {isRunning ? 'Em execução' : c.state || 'Parado'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-[11px] text-desert-stone-dark">
                                      {c.ports && c.ports.length > 0 ? c.ports.join(', ') : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-desert-sand/10 border border-desert-stone-lighter/40 text-xs text-desert-stone flex items-center gap-2.5">
                        <IconInfoCircle size={18} className="text-desert-olive flex-shrink-0" />
                        <p>
                          Nenhum contêiner detectado no nó neste momento. Clique em <strong>Testar Conexão</strong> para atualizar a lista em tempo real.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Barra de Ações do Nó Conectado */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-desert-stone-lighter/40">
                    <StyledButton
                      variant="outline"
                      icon="IconPlugConnected"
                      onClick={handleTestPortainer}
                      loading={testingPortainer}
                    >
                      Testar Conexão / Atualizar
                    </StyledButton>

                    <div className="flex items-center gap-3">
                      <StyledButton
                        variant="outline"
                        icon="IconEdit"
                        onClick={() => setIsEditingPortainer(true)}
                      >
                        Editar Configurações
                      </StyledButton>
                      <StyledButton
                        variant="danger"
                        icon="IconTrash"
                        onClick={handleRemovePortainer}
                        loading={savingPortainer}
                      >
                        Remover Servidor
                      </StyledButton>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO DE ADIÇÃO OU EDIÇÃO DO PORTAINER */
                <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-desert-stone-lighter/40">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                      <IconBrandDocker size={28} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-desert-green-darker">
                        {isPortainerConfigured ? 'Editar Servidor Portainer' : 'Vincular Servidor Portainer (Docker)'}
                      </h2>
                      <p className="text-xs text-desert-stone">
                        Insira o endereço IP e o Token de Acesso do Portainer CE para conectar o nó
                      </p>
                    </div>
                  </div>

                  {/* Campos de Entrada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="portainer-url"
                      label="Endereço IP / URL do Portainer"
                      placeholder="https://192.168.1.100:9443 ou http://192.168.1.100:9000"
                      value={portainerUrl}
                      onChange={(e) => setPortainerUrl(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        name="portainer-key"
                        label="Token de Acesso / API Key"
                        placeholder="ptr_... (gerado no perfil de usuário do Portainer)"
                        value={portainerApiKey}
                        type={showPortainerKey ? 'text' : 'password'}
                        onChange={(e) => setPortainerApiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPortainerKey(!showPortainerKey)}
                        className="absolute right-3 top-[36px] text-desert-stone hover:text-desert-green p-1 transition-colors"
                        title={showPortainerKey ? 'Ocultar Token' : 'Mostrar Token'}
                      >
                        {showPortainerKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Botões do Formulário */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-desert-stone-lighter/40">
                    <StyledButton
                      variant="outline"
                      icon="IconPlugConnected"
                      onClick={handleTestPortainer}
                      loading={testingPortainer}
                    >
                      Testar Conexão
                    </StyledButton>

                    <div className="flex items-center gap-3">
                      {isPortainerConfigured && (
                        <StyledButton
                          variant="secondary"
                          onClick={() => setIsEditingPortainer(false)}
                        >
                          Cancelar Edição
                        </StyledButton>
                      )}
                      <StyledButton
                        variant="primary"
                        icon="IconCheck"
                        onClick={() => handleSavePortainer(true)}
                        loading={savingPortainer}
                      >
                        {isPortainerConfigured ? 'Atualizar e Salvar' : 'Salvar e Ativar Servidor'}
                      </StyledButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutorial Passo a Passo Portainer */}
              <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <IconKey size={20} className="text-desert-olive-dark" />
                  <h3 className="text-lg font-bold text-desert-green-darker">
                    Passo a Passo: Como Gerar o Token de Acesso no Portainer
                  </h3>
                </div>

                <div className="space-y-4 text-sm text-text-secondary">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Abra o Portainer no seu navegador
                      </p>
                      <p className="text-xs text-desert-stone">
                        Acesse o endereço da sua máquina onde o Portainer está instalado (exemplo:{' '}
                        <code className="bg-surface-secondary px-1 py-0.5 rounded text-desert-green-darker font-mono">
                          https://&lt;IP_DO_SERVIDOR&gt;:9443
                        </code>
                        ).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Acesse a página de perfil da sua conta
                      </p>
                      <p className="text-xs text-desert-stone">
                        No canto superior direito da tela do Portainer, clique no seu nome de usuário e selecione a opção <strong>My Account</strong> (ou <em>Minha Conta</em>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Localize a seção "Access tokens"
                      </p>
                      <p className="text-xs text-desert-stone">
                        Role a página para baixo até encontrar a tabela <strong>Access tokens</strong> (Tokens de acesso).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      4
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Clique no botão "+ Add access token"
                      </p>
                      <p className="text-xs text-desert-stone">
                        No canto superior direito da tabela de tokens, clique no botão <strong>+ Add access token</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      5
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Defina uma descrição e crie o token
                      </p>
                      <p className="text-xs text-desert-stone">
                        No campo <em>Description</em>, digite um nome como <code className="bg-surface-secondary px-1 py-0.5 rounded font-mono">NOMAD</code> e confirme.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      6
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Copie a chave gerada e cole no campo acima
                      </p>
                      <p className="text-xs text-desert-stone">
                        O Portainer exibirá uma chave começando com <code className="bg-surface-secondary px-1 py-0.5 rounded font-mono text-emerald-600">ptr_...</code>. <strong>Copie-a imediatamente</strong> (ela não será mostrada novamente) e cole no campo <em>Token de Acesso / API Key</em> desta página.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-start gap-2.5">
                  <IconInfoCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <strong>Dica de infraestrutura:</strong> Quando o servidor Portainer estiver ativado, novas aplicações da Central de Aplicativos poderão ser executadas remotamente no servidor, poupando armazenamento e bateria do seu dispositivo local.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              ABA 2: TRUENAS
             ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'truenas' && (
            <div className="space-y-8">
              {/* CARD: NÓ CONECTADO TRUENAS (quando configurado e não está em edição) */}
              {!isEditingTruenas && isTruenasConfigured ? (
                <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm space-y-6">
                  {/* Cabeçalho do Nó Conectado */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-desert-stone-lighter/40">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                        <IconServer size={28} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-desert-green-darker">
                            Servidor de Armazenamento (TrueNAS)
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-desert-olive/10 text-desert-olive-dark font-medium">
                            Nó Conectado
                          </span>
                        </div>
                        <p className="text-xs text-desert-stone">
                          Armazenamento centralizado de arquivos, pools ZFS e biblioteca de mídias
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          truenasStatus?.online ? 'bg-emerald-500 animate-pulse shadow-sm' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                        {truenasStatus?.online ? 'ATIVO & CONECTADO' : 'INACESSÍVEL / OFFLINE'}
                      </span>
                    </div>
                  </div>

                  {/* Grade de Informações e Pools */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-secondary border border-border-subtle text-xs">
                    <div>
                      <span className="text-desert-stone block mb-1">Endereço do Servidor:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-desert-green-darker font-mono break-all">
                          {truenasUrl}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(truenasUrl, 'Endereço IP')}
                          className="text-desert-stone hover:text-desert-green p-0.5"
                          title="Copiar Endereço"
                        >
                          <IconCopy size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Chave de API:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-desert-green-darker font-mono">
                          {showTruenasKey
                            ? truenasApiKey || 'Chave oculta'
                            : '••••••••••••••••••••••••'}
                        </strong>
                        {truenasApiKey && (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowTruenasKey(!showTruenasKey)}
                              className="text-desert-stone hover:text-desert-green p-0.5"
                              title={showTruenasKey ? 'Ocultar Chave' : 'Mostrar Chave'}
                            >
                              {showTruenasKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(truenasApiKey, 'Chave de API')}
                              className="text-desert-stone hover:text-desert-green p-0.5"
                              title="Copiar Chave"
                            >
                              <IconCopy size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Hostname:</span>
                      <strong className="text-desert-green-darker font-semibold">
                        {truenasStatus?.hostname || 'truenas'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-desert-stone block mb-1">Versão do TrueNAS:</span>
                      <strong className="text-desert-green-darker font-semibold">
                        {truenasStatus?.version || 'TrueNAS SCALE'}
                      </strong>
                    </div>
                  </div>

                  {/* Pools ZFS */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <IconDatabase size={18} className="text-desert-olive-dark" />
                      <h3 className="text-sm font-bold text-desert-green-darker">
                        Pools de Armazenamento ZFS Detectados
                      </h3>
                    </div>

                    {truenasStatus?.pools && truenasStatus.pools.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {truenasStatus.pools.map((pool, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-border-subtle text-xs"
                          >
                            <IconDatabase size={16} className="text-desert-olive" />
                            <strong className="text-desert-green-darker font-mono">{pool}</strong>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
                              ONLINE
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-desert-sand/10 border border-desert-stone-lighter/40 text-xs text-desert-stone flex items-center gap-2.5">
                        <IconInfoCircle size={18} className="text-desert-olive flex-shrink-0" />
                        <p>
                          Nenhuma pool ZFS retornada ou conexão básica estabelecida.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Barra de Ações TrueNAS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-desert-stone-lighter/40">
                    <StyledButton
                      variant="outline"
                      icon="IconPlugConnected"
                      onClick={handleTestTruenas}
                      loading={testingTruenas}
                    >
                      Testar Conexão / Atualizar
                    </StyledButton>

                    <div className="flex items-center gap-3">
                      <StyledButton
                        variant="outline"
                        icon="IconEdit"
                        onClick={() => setIsEditingTruenas(true)}
                      >
                        Editar Configurações
                      </StyledButton>
                      <StyledButton
                        variant="danger"
                        icon="IconTrash"
                        onClick={handleRemoveTruenas}
                        loading={savingTruenas}
                      >
                        Remover Servidor
                      </StyledButton>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO DE ADIÇÃO OU EDIÇÃO DO TRUENAS */
                <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-desert-stone-lighter/40">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                      <IconServer size={28} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-desert-green-darker">
                        {isTruenasConfigured ? 'Editar Servidor TrueNAS' : 'Vincular Servidor TrueNAS'}
                      </h2>
                      <p className="text-xs text-desert-stone">
                        Insira o endereço IP e a Chave de API gerada no TrueNAS SCALE ou Core
                      </p>
                    </div>
                  </div>

                  {/* Campos de Entrada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="truenas-url"
                      label="Endereço IP / URL do TrueNAS"
                      placeholder="https://192.168.1.50 ou http://192.168.1.50"
                      value={truenasUrl}
                      onChange={(e) => setTruenasUrl(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        name="truenas-key"
                        label="Chave de API do TrueNAS (API Key)"
                        placeholder="Cole a chave de API gerada no TrueNAS"
                        value={truenasApiKey}
                        type={showTruenasKey ? 'text' : 'password'}
                        onChange={(e) => setTruenasApiKey(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTruenasKey(!showTruenasKey)}
                        className="absolute right-3 top-[36px] text-desert-stone hover:text-desert-green p-1 transition-colors"
                        title={showTruenasKey ? 'Ocultar Chave' : 'Mostrar Chave'}
                      >
                        {showTruenasKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Botões do Formulário */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-desert-stone-lighter/40">
                    <StyledButton
                      variant="outline"
                      icon="IconPlugConnected"
                      onClick={handleTestTruenas}
                      loading={testingTruenas}
                    >
                      Testar Conexão
                    </StyledButton>

                    <div className="flex items-center gap-3">
                      {isTruenasConfigured && (
                        <StyledButton
                          variant="secondary"
                          onClick={() => setIsEditingTruenas(false)}
                        >
                          Cancelar Edição
                        </StyledButton>
                      )}
                      <StyledButton
                        variant="primary"
                        icon="IconCheck"
                        onClick={() => handleSaveTruenas(true)}
                        loading={savingTruenas}
                      >
                        {isTruenasConfigured ? 'Atualizar e Salvar' : 'Salvar e Ativar TrueNAS'}
                      </StyledButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Tutorial Passo a Passo TrueNAS */}
              <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <IconKey size={20} className="text-desert-olive-dark" />
                  <h3 className="text-lg font-bold text-desert-green-darker">
                    Passo a Passo: Como Gerar a Chave de API no TrueNAS
                  </h3>
                </div>

                <div className="space-y-4 text-sm text-text-secondary">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Acesse a interface web do seu TrueNAS
                      </p>
                      <p className="text-xs text-desert-stone">
                        Abra o navegador e digite o endereço IP do seu TrueNAS (exemplo:{' '}
                        <code className="bg-surface-secondary px-1 py-0.5 rounded text-desert-green-darker font-mono">
                          https://&lt;IP_DO_TRUENAS&gt;
                        </code>
                        ).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Abra o menu do seu usuário
                      </p>
                      <p className="text-xs text-desert-stone">
                        No canto superior direito do painel do TrueNAS, clique no seu usuário (ou no ícone de engrenagem) e clique em <strong>API Keys</strong> (ou <em>Chaves de API</em>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Clique em "Add API Key" (Adicionar Chave de API)
                      </p>
                      <p className="text-xs text-desert-stone">
                        Clique no botão azul <strong>Add API Key</strong> para iniciar a criação de uma nova credencial.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      4
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Digite um nome para a chave
                      </p>
                      <p className="text-xs text-desert-stone">
                        No campo <em>Name</em>, digite <code className="bg-surface-secondary px-1 py-0.5 rounded font-mono">NOMAD</code> e confirme.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      5
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Copie a chave imediatamente
                      </p>
                      <p className="text-xs text-desert-stone">
                        O TrueNAS exibirá a chave recém-criada em uma caixa de diálogo. <strong>Copie-a agora</strong>, pois o TrueNAS não a exibirá novamente por motivos de segurança.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-desert-olive text-xs font-bold text-white">
                      6
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">
                        Cole a chave no campo acima e teste a conexão
                      </p>
                      <p className="text-xs text-desert-stone">
                        Cole a chave copiada no campo <em>Chave de API do TrueNAS</em> e clique em <strong>Testar Conexão</strong> para validar a comunicação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
