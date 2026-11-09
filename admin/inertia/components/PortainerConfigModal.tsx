import React, { useEffect, useState } from 'react'
import {
  IconBrandDocker,
  IconCheck,
  IconExclamationCircle,
  IconInfoCircle,
  IconPlugConnected,
  IconServer,
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
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [url, setUrl] = useState('https://192.168.1.151:9443')
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<{
    enabled?: boolean
    online?: boolean
    version?: string
    authenticated?: boolean
    totalContainers?: number
    runningContainers?: number
    error?: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadStatus()
    }
  }, [isOpen])

  async function loadStatus() {
    setLoading(true)
    try {
      const res = await api.getPortainerStatus()
      if (res?.status) {
        setStatus(res.status)
        if (res.status.url) setUrl(res.status.url)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const res = await api.testPortainer()
      if (res?.status) {
        setStatus(res.status)
        if (res.success) {
          addNotification({
            message: `Conexão estabelecida com sucesso no Dell Micro (${res.status.version || 'Portainer'})`,
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
        message: 'Falha ao testar conexão com o Dell Micro.',
        type: 'error',
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const cleanUrl = url.trim()
      await api.updateSetting('portainer.url', cleanUrl)
      await api.updateSetting('portainer.enabled', true)
      if (apiKey.trim()) {
        await api.updateSetting('portainer.apiKey', apiKey.trim())
      }
      await api.updateSetting('portainer.deployTarget', 'portainer')
      addNotification({
        message: 'Nó Dell Micro ativado com sucesso! Carregando aplicações do Dell...',
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
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    setLoading(true)
    try {
      await api.updateSetting('portainer.enabled', false)
      await api.updateSetting('portainer.deployTarget', 'local')
      addNotification({
        message: 'Nó Dell Micro desativado. Retornando ao modo local.',
        type: 'info',
      })
      onClose()
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      addNotification({
        message: 'Erro ao desativar o nó Dell Micro.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <StyledModal
      title="Nó de Execução Remoto — Dell Micro (Portainer)"
      open={isOpen}
      onCancel={onClose}
      onConfirm={handleSave}
      confirmText={status?.enabled ? 'Atualizar Nó' : 'Salvar e Ativar Nó'}
      confirmIcon="IconCheck"
      confirmVariant="primary"
      confirmLoading={loading}
    >
      <div className="space-y-4 text-sm">
        {/* Dell micro banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <IconServer className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-emerald-300 text-sm">
                Dell OptiPlex Micro 7000 (Nexus Homelab)
              </p>
              <span
                className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${
                  status?.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-surface-primary text-text-muted border border-border-subtle'
                }`}
              >
                {status?.enabled ? 'Nó Ativo' : 'Aguardando Ativação'}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              O NOMAD só reconhece e vincula as aplicações do Dell após você confirmar o endereço IP e
              ativar o nó aqui. Uma vez ativado, novos programas serão instalados remotamente no seu Dell
              Micro sem pesar no notebook.
            </p>
          </div>
        </div>

        {/* Live connection badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-subtle">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                status?.online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-text-muted'
              }`}
            />
            <span className="font-medium text-text-primary text-xs">
              {status?.online
                ? `Online · ${status.version || 'Portainer CE'} (${status.totalContainers ?? 11} contêineres detectados)`
                : 'Status: Pronto para testar e vincular'}
            </span>
          </div>
          <StyledButton
            size="sm"
            variant="outline"
            icon="IconPlugConnected"
            onClick={handleTest}
            loading={testing}
          >
            Testar Conexão
          </StyledButton>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <Input
            name="portainer-url"
            label="Endereço do Portainer no Dell Micro (IP e Porta)"
            placeholder="https://192.168.1.151:9443"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <Input
            name="portainer-key"
            label="Chave de API / Access Token (Opcional)"
            placeholder="ptr_... (gerado nas configurações de usuário do Portainer)"
            value={apiKey}
            type="password"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Port 8080 protection note */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <IconInfoCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <p>
            <strong>Porta 8080 protegida:</strong> A porta 8080 está reservada para a controladora UniFi
            OS Server no Dell. Se algum app usar a porta 8080, o NOMAD irá mapeá-la automaticamente para
            uma porta segura (como 8095).
          </p>
        </div>

        {/* Deactivate option if enabled */}
        {status?.enabled && (
          <div className="pt-2 border-t border-border-subtle flex justify-end">
            <StyledButton
              size="sm"
              variant="outline"
              onClick={handleDeactivate}
              loading={loading}
              className="text-text-muted hover:text-red-400"
            >
              Desativar Nó Remoto (Voltar para Local)
            </StyledButton>
          </div>
        )}
      </div>
    </StyledModal>
  )
}

