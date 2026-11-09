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
  IconInfoCircle,
  IconKey,
  IconPlugConnected,
  IconServer,
  IconWorld,
  IconAlertTriangle,
} from '@tabler/icons-react'

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
    error?: string
  }
  truenas?: {
    enabled: boolean
    online: boolean
    url: string
    version?: string
    hostname?: string
    pools?: string[]
    error?: string
  }
}

export default function ServersSettingsPage({ portainer: initialPortainer, truenas: initialTruenas }: PageProps) {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<'portainer' | 'truenas'>('portainer')

  // Portainer state
  const [portainerStatus, setPortainerStatus] = useState(initialPortainer || null)
  const [portainerUrl, setPortainerUrl] = useState(initialPortainer?.url || '')
  const [portainerApiKey, setPortainerApiKey] = useState('')
  const [testingPortainer, setTestingPortainer] = useState(false)
  const [savingPortainer, setSavingPortainer] = useState(false)

  // TrueNAS state
  const [truenasStatus, setTruenasStatus] = useState(initialTruenas || null)
  const [truenasUrl, setTruenasUrl] = useState(initialTruenas?.url || '')
  const [truenasApiKey, setTruenasApiKey] = useState('')
  const [testingTruenas, setTestingTruenas] = useState(false)
  const [savingTruenas, setSavingTruenas] = useState(false)

  // ── Portainer handlers ──────────────────────────────────────────────────────
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
          ? 'Servidor Portainer ativado com sucesso! As aplicações serão sincronizadas.'
          : 'Servidor Portainer desativado.',
        type: 'success',
      })
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

  // ── TrueNAS handlers ────────────────────────────────────────────────────────
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
        message: enable ? 'TrueNAS ativado com sucesso!' : 'TrueNAS desativado.',
        type: 'success',
      })
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

          {/* Tab selector */}
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
              {/* Status Header Card */}
              <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                      <IconBrandDocker size={28} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-desert-green-darker">
                        Nó de Execução Remoto (Portainer)
                      </h2>
                      <p className="text-xs text-desert-stone">
                        Instalação e execução de contêineres diretamente no servidor remoto
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        portainerStatus?.online ? 'bg-emerald-500 shadow-sm' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      {portainerStatus?.enabled
                        ? portainerStatus?.online
                          ? 'Ativo & Online'
                          : 'Ativo (Inacessível)'
                        : 'Aguardando Ativação'}
                    </span>
                  </div>
                </div>

                {portainerStatus?.online && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-surface-secondary border border-border-subtle text-xs mb-6">
                    <div>
                      <span className="text-desert-stone block">Versão:</span>
                      <strong className="text-desert-green-darker">
                        {portainerStatus.version || 'Portainer CE'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-desert-stone block">Contêineres Ativos:</span>
                      <strong className="text-desert-green-darker">
                        {portainerStatus.runningContainers ?? 0} em execução
                      </strong>
                    </div>
                    <div>
                      <span className="text-desert-stone block">Total de Contêineres:</span>
                      <strong className="text-desert-green-darker">
                        {portainerStatus.totalContainers ?? 0} cadastrados
                      </strong>
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    value={portainerApiKey}
                    type="password"
                    onChange={(e) => setPortainerApiKey(e.target.value)}
                  />
                </div>

                {/* Action buttons */}
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
                    {portainerStatus?.enabled && (
                      <StyledButton
                        variant="secondary"
                        onClick={() => handleSavePortainer(false)}
                        loading={savingPortainer}
                      >
                        Desativar Nó Remoto
                      </StyledButton>
                    )}
                    <StyledButton
                      variant="primary"
                      icon="IconCheck"
                      onClick={() => handleSavePortainer(true)}
                      loading={savingPortainer}
                    >
                      {portainerStatus?.enabled ? 'Atualizar e Salvar' : 'Salvar e Ativar Servidor'}
                    </StyledButton>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Tutorial Box */}
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
                    <strong>Dica de segurança:</strong> O NOMAD armazena o token de forma segura no banco de dados local da sua instância. Quando o servidor Portainer estiver ativado, novas aplicações da Central de Aplicativos serão executadas remotamente no servidor, poupando espaço e bateria do seu notebook.
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
              {/* Status Header Card */}
              <div className="bg-desert-white rounded-xl p-6 border border-desert-stone-lighter/60 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-desert-olive/10 text-desert-olive-dark">
                      <IconServer size={28} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-desert-green-darker">
                        Servidor de Armazenamento (TrueNAS SCALE / Core)
                      </h2>
                      <p className="text-xs text-desert-stone">
                        Comunicação com o armazenamento central de arquivos, pools ZFS e mídias
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        truenasStatus?.online ? 'bg-emerald-500 shadow-sm' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      {truenasStatus?.enabled
                        ? truenasStatus?.online
                          ? 'Ativo & Conectado'
                          : 'Ativo (Inacessível)'
                        : 'Aguardando Configuração'}
                    </span>
                  </div>
                </div>

                {truenasStatus?.online && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-surface-secondary border border-border-subtle text-xs mb-6">
                    <div>
                      <span className="text-desert-stone block">Hostname:</span>
                      <strong className="text-desert-green-darker font-mono">
                        {truenasStatus.hostname || 'truenas'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-desert-stone block">Versão do Sistema:</span>
                      <strong className="text-desert-green-darker">
                        {truenasStatus.version || 'TrueNAS SCALE'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-desert-stone block">Pools ZFS Detectados:</span>
                      <strong className="text-desert-green-darker">
                        {truenasStatus.pools && truenasStatus.pools.length > 0
                          ? truenasStatus.pools.join(', ')
                          : 'Conectado'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    value={truenasApiKey}
                    type="password"
                    onChange={(e) => setTruenasApiKey(e.target.value)}
                  />
                </div>

                {/* Action buttons */}
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
                    {truenasStatus?.enabled && (
                      <StyledButton
                        variant="secondary"
                        onClick={() => handleSaveTruenas(false)}
                        loading={savingTruenas}
                      >
                        Desativar TrueNAS
                      </StyledButton>
                    )}
                    <StyledButton
                      variant="primary"
                      icon="IconCheck"
                      onClick={() => handleSaveTruenas(true)}
                      loading={savingTruenas}
                    >
                      {truenasStatus?.enabled ? 'Atualizar e Salvar' : 'Salvar e Ativar TrueNAS'}
                    </StyledButton>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Tutorial Box for TrueNAS */}
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

