import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import Alert from '~/components/Alert'
import { useEffect, useRef, useState } from 'react'
import { IconAlertCircle, IconArrowBigUpLines, IconCheck, IconCircleCheck, IconReload } from '@tabler/icons-react'
import { SystemUpdateStatus } from '../../../types/system'
import api from '~/lib/api'
import Input from '~/components/inputs/Input'
import Switch from '~/components/inputs/Switch'
import { useMutation } from '@tanstack/react-query'
import { useNotifications } from '~/context/NotificationContext'
import { useSystemSetting } from '~/hooks/useSystemSetting'
import CoreAutoUpdateSection from '~/components/updates/CoreAutoUpdateSection'
import AppAutoUpdateSection from '~/components/updates/AppAutoUpdateSection'
import ContentAutoUpdateSection from '~/components/updates/ContentAutoUpdateSection'
import ContentUpdatesSection from '~/components/updates/ContentUpdatesSection'

type Props = {
  updateAvailable: boolean
  latestVersion: string
  currentVersion: string
  earlyAccess: boolean
}

const STAGE_LABELS: Record<SystemUpdateStatus['stage'], string> = {
  idle: 'Preparando Atualização',
  starting: 'Iniciando Atualização',
  pulling: 'Baixando Atualização',
  pulled: 'Download Concluído',
  recreating: 'Instalando Atualização',
  complete: 'Atualização Concluída!',
  error: 'Falha na Atualização',
}

const translateUpdateMessage = (stage: SystemUpdateStatus['stage'], message?: string): string => {
  if (!message) {
    switch (stage) {
      case 'starting':
        return 'Iniciando o processo de atualização...'
      case 'pulling':
        return 'Baixando pacotes e imagens mais recentes...'
      case 'pulled':
        return 'Download concluído com sucesso! Iniciando instalação...'
      case 'recreating':
        return 'Instalando a nova versão e inicializando serviços...'
      case 'complete':
        return 'Atualização concluída com sucesso! Recarregando sistema...'
      case 'error':
        return 'Ocorreu um erro durante a atualização.'
      default:
        return 'Processando atualização...'
    }
  }

  const lower = message.toLowerCase()
  if (lower.includes('initiated') || lower.includes('iniciando') || stage === 'starting') {
    return 'Iniciando o processo de atualização...'
  }
  if (lower.includes('pulling') || lower.includes('baixando') || stage === 'pulling') {
    return 'Baixando pacotes e imagens mais recentes...'
  }
  if (lower.includes('pulled') || lower.includes('baixadas') || stage === 'pulled') {
    return 'Download concluído com sucesso! Iniciando instalação...'
  }
  if (lower.includes('recreating') || lower.includes('recriando') || lower.includes('instalando') || stage === 'recreating') {
    if (lower.includes('mysql') || lower.includes('banco de dados')) return 'Instalando componentes do banco de dados (MySQL)...'
    if (lower.includes('redis') || lower.includes('cache')) return 'Instalando componentes de cache (Redis)...'
    if (lower.includes('dozzle') || lower.includes('monitor')) return 'Instalando monitor de logs (Dozzle)...'
    if (lower.includes('admin') || lower.includes('painel')) return 'Instalando nova versão do Nexus NOMAD...'
    return 'Instalando a nova versão e inicializando serviços...'
  }
  if (lower.includes('completed') || lower.includes('concluída') || stage === 'complete') {
    return 'Atualização concluída com sucesso! Recarregando sistema...'
  }
  if (stage === 'error') {
    return `Erro na atualização: ${message}`
  }
  return message
}

const ADVANCED_STAGES: ReadonlySet<SystemUpdateStatus['stage']> = new Set([
  'pulling',
  'pulled',
  'recreating',
  'complete',
])

export default function SystemUpdatePage(props: { system: Props }) {
  const { addNotification } = useNotifications()

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<SystemUpdateStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string>('')
  const [email, setEmail] = useState('')
  const [versionInfo, setVersionInfo] = useState<Omit<Props, 'earlyAccess'>>(props.system)
  const [showConnectionLostNotice, setShowConnectionLostNotice] = useState(false)
  // Tracks whether this update session has progressed past 'idle'/'starting'.
  // The sidecar sits on 'complete' for ~5s before resetting to 'idle' (see
  // install/sidecar-updater/update-watcher.sh), and the SPA can miss that
  // window across the admin container restart. If we resurface to 'idle'
  // after seeing an advanced stage, treat it as the missed completion.
  const seenAdvancedStageRef = useRef(false)

  const earlyAccessSetting = useSystemSetting({
    key: 'system.earlyAccess', initialData: {
      key: 'system.earlyAccess',
      value: props.system.earlyAccess,
    }
  })

  useEffect(() => {
    if (!isUpdating) return

    const interval = setInterval(async () => {
      try {
        const response = await api.getSystemUpdateStatus()
        if (!response) {
          // Servidor temporariamente offline reiniciando com a nova imagem.
          // Avança a barra suavemente entre 70% e 94% mostrando que está instalando.
          setUpdateStatus((prev) => {
            const currentProgress = prev ? prev.progress : 65
            const nextProgress = Math.min(Math.max(currentProgress + 4, 72), 94)
            return {
              stage: 'recreating',
              progress: nextProgress,
              message: 'Instalando a nova versão e inicializando serviços...',
              timestamp: new Date().toISOString(),
            }
          })
          return
        }

        setUpdateStatus(response)

        if (ADVANCED_STAGES.has(response.stage)) {
          seenAdvancedStageRef.current = true
        }

        // Check if update is complete or errored. We also treat a return to
        // 'idle' as completion if we previously saw an advanced stage — this
        // catches the race where the sidecar's brief 'complete' window passes
        // while we're disconnected during the admin container restart.
        const isComplete =
          response.stage === 'complete' ||
          (response.stage === 'idle' && seenAdvancedStageRef.current)

        if (isComplete) {
          setUpdateStatus({
            stage: 'complete',
            progress: 100,
            message: 'Atualização concluída com sucesso! Recarregando sistema...',
            timestamp: new Date().toISOString(),
          })
          // Re-check version so the KV store clears the stale "update available" flag
          // before we reload, otherwise the banner shows "current → current"
          try {
            await api.checkLatestVersion(true)
          } catch {
            // Non-critical - page reload will still work
          }
          setTimeout(() => {
            window.location.reload()
          }, 2500)
        } else if (response.stage === 'error') {
          setIsUpdating(false)
          setError(response.message)
        }
      } catch (err) {
        // Durante o reinício, mantemos a barra avançando na etapa de instalação
        setUpdateStatus((prev) => {
          const currentProgress = prev ? prev.progress : 65
          const nextProgress = Math.min(Math.max(currentProgress + 4, 72), 94)
          return {
            stage: 'recreating',
            progress: nextProgress,
            message: 'Instalando a nova versão e inicializando serviços...',
            timestamp: new Date().toISOString(),
          }
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isUpdating])

  const handleStartUpdate = async () => {
    try {
      setError(null)
      seenAdvancedStageRef.current = false
      setIsUpdating(true)
      setUpdateStatus({
        stage: 'starting',
        progress: 10,
        message: 'Iniciando atualização do Nexus NOMAD...',
        timestamp: new Date().toISOString(),
      })
      const response = await api.startSystemUpdate()
      if (!response || !response.success) {
        throw new Error('Falha ao iniciar a atualização')
      }
    } catch (err: any) {
      setIsUpdating(false)
      setError(err.response?.data?.error || err.message || 'Falha ao iniciar a atualização')
    }
  }

  const handleViewLogs = async () => {
    try {
      const response = await api.getSystemUpdateLogs()
      if (!response) {
        throw new Error('Falha ao obter os logs da atualização')
      }
      setLogs(response.logs)
      setShowLogs(true)
    } catch (err) {
      setError('Falha ao obter os logs da atualização')
    }
  }

  const checkVersionMutation = useMutation({
    mutationKey: ['checkLatestVersion'],
    mutationFn: () => api.checkLatestVersion(true),
    onSuccess: (data) => {
      if (data) {
        if (data.success === false) {
          const msg = data.message || 'Falha ao consultar o GitHub para verificar atualizações'
          setError(msg)
          addNotification({ type: 'error', message: msg })
          return
        }
        setVersionInfo({
          updateAvailable: data.updateAvailable,
          latestVersion: data.latestVersion,
          currentVersion: data.currentVersion,
        })
        if (data.updateAvailable) {
          addNotification({
            type: 'success',
            message: `Atualização disponível: ${data.latestVersion}`,
          })
        } else {
          addNotification({ type: 'success', message: 'O sistema está atualizado' })
        }
        setError(null)
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Falha ao verificar atualizações'
      setError(errorMessage)
      addNotification({ type: 'error', message: errorMessage })
    },
  })

  const getProgressBarColor = () => {
    if (updateStatus?.stage === 'error') return 'bg-desert-red'
    if (updateStatus?.stage === 'complete') return 'bg-desert-olive'
    return 'bg-desert-green'
  }

  const getStatusIcon = () => {
    if (updateStatus?.stage === 'complete')
      return <IconCheck className="h-12 w-12 text-desert-olive" />
    if (updateStatus?.stage === 'error')
      return <IconAlertCircle className="h-12 w-12 text-desert-red" />
    if (isUpdating) return <IconReload className="h-12 w-12 text-desert-green animate-spin" />
    if (versionInfo.updateAvailable)
      return <IconArrowBigUpLines className="h-16 w-16 text-desert-green" />
    return <IconCircleCheck className="h-16 w-16 text-desert-olive" />
  }

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      return await api.updateSetting(key, value)
    },
    onSuccess: () => {
      addNotification({ message: 'Configuração atualizada com sucesso.', type: 'success' })
      earlyAccessSetting.refetch()
      // Toggling Early Access changes which versions are eligible, so re-evaluate
      // immediately rather than making the user click Check Again.
      checkVersionMutation.mutate()
    },
    onError: (error) => {
      console.error('Error updating setting:', error)
      addNotification({ message: 'Ocorreu um erro ao atualizar a configuração. Tente novamente.', type: 'error' })
    },
  })

  const subscribeToReleaseNotesMutation = useMutation({
    mutationKey: ['subscribeToReleaseNotes'],
    mutationFn: (email: string) => api.subscribeToReleaseNotes(email),
    onSuccess: (data) => {
      if (data && data.success) {
        addNotification({ type: 'success', message: 'Inscrição nas notas de lançamento realizada com sucesso!' })
        setEmail('')
      } else {
        addNotification({
          type: 'error',
          message: `Falha ao se inscrever: ${data?.message || 'Erro desconhecido'}`,
        })
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: `Erro ao se inscrever nas notas de lançamento: ${error.message || 'Erro desconhecido'}`,
      })
    },
  })

  return (
    <SettingsLayout>
      <Head title="Atualização do Sistema | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-desert-green mb-2">Atualização do Sistema</h1>
            <p className="text-desert-stone-dark">
              Mantenha sua instância do Project NOMAD atualizada com os recursos e melhorias mais
              recentes.
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert
                type="error"
                title="Falha na Atualização"
                message={error}
                variant="bordered"
                dismissible
                onDismiss={() => setError(null)}
              />
            </div>
          )}
          <div className="bg-surface-primary rounded-lg border shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">{getStatusIcon()}</div>

              {!isUpdating && (
                <>
                  <h2 className="text-2xl font-bold text-desert-green mb-2">
                    {versionInfo.updateAvailable ? 'Atualização Disponível' : 'Sistema Atualizado'}
                  </h2>
                  <p className="text-desert-stone-dark mb-6">
                    {versionInfo.updateAvailable
                      ? `Uma nova versão (${versionInfo.latestVersion}) está disponível para sua instância do Project NOMAD.`
                      : 'Seu sistema está executando a versão mais recente!'}
                  </p>
                </>
              )}

              {isUpdating && updateStatus && (
                <>
                  <h2 className="text-2xl font-bold text-desert-green mb-2">
                    {STAGE_LABELS[updateStatus.stage] ?? updateStatus.stage}
                  </h2>
                  <p className="text-desert-stone-dark mb-6">
                    {translateUpdateMessage(updateStatus.stage, updateStatus.message)}
                  </p>
                </>
              )}

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-sm text-desert-stone mb-1">Versão Atual</p>
                  <p className="text-xl font-bold text-desert-green">
                    {versionInfo.currentVersion}
                  </p>
                </div>
                {versionInfo.updateAvailable && (
                  <>
                    <div className="flex items-center">
                      <svg
                        className="h-6 w-6 text-desert-stone"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-desert-stone mb-1">Versão Mais Recente</p>
                      <p className="text-xl font-bold text-desert-olive">
                        {versionInfo.latestVersion}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {isUpdating && updateStatus && (
                <div className="mb-4">
                  <div className="w-full bg-desert-stone-light rounded-full h-3 overflow-hidden">
                    <div
                      className={`${getProgressBarColor()} h-full transition-all duration-500 ease-out`}
                      style={{ width: `${updateStatus.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-desert-stone mt-2">
                    {updateStatus.progress}% concluído
                  </p>
                </div>
              )}
              {!isUpdating && (
                <div className="flex justify-center gap-4">
                  <StyledButton
                    variant="primary"
                    size="lg"
                    icon="IconDownload"
                    onClick={handleStartUpdate}
                    disabled={!versionInfo.updateAvailable}
                  >
                    {versionInfo.updateAvailable ? 'Iniciar Atualização' : 'Nenhuma Atualização Disponível'}
                  </StyledButton>
                  <StyledButton
                    variant="ghost"
                    size="lg"
                    icon="IconRefresh"
                    onClick={() => checkVersionMutation.mutate()}
                    loading={checkVersionMutation.isPending}
                  >
                    Verificar Novamente
                  </StyledButton>
                </div>
              )}
            </div>
            <div className="border-t bg-surface-primary p-6">
              <h3 className="text-lg font-semibold text-desert-green mb-4">
                O que acontece durante uma atualização?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-desert-green text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-desert-stone-dark">Baixar Imagens Mais Recentes</p>
                    <p className="text-sm text-desert-stone">
                      Baixa as imagens Docker mais novas para todos os contêineres principais
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-desert-green text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-desert-stone-dark">Recriar Contêineres</p>
                    <p className="text-sm text-desert-stone">
                      Para e recria com segurança todos os contêineres principais com as novas imagens
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-desert-green text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-desert-stone-dark">Recarregamento Automático</p>
                    <p className="text-sm text-desert-stone">
                      Esta página será recarregada automaticamente assim que a atualização terminar
                    </p>
                  </div>
                </div>
              </div>

              {isUpdating && (
                <div className="mt-6 pt-6 border-t border-desert-stone-light">
                  <StyledButton
                    variant="ghost"
                    size="sm"
                    icon="IconLogs"
                    onClick={handleViewLogs}
                    fullWidth
                  >
                    Ver Logs da Atualização
                  </StyledButton>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert
              type="info"
              title="Lembrete de Backup"
              message="Embora as atualizações sejam projetadas para serem seguras, é sempre recomendável fazer backup de dados importantes antes de prosseguir."
              variant="solid"
            />
            <Alert
              type="warning"
              title="Indisponibilidade Temporária"
              message="Os serviços ficarão brevemente indisponíveis durante o processo de atualização. Isso geralmente leva de 2 a 5 minutos, dependendo da sua conexão com a internet."
              variant="solid"
            />
          </div>
          <StyledSectionHeader title="Acesso Antecipado" className="mt-8" />
          <div className="bg-surface-primary rounded-lg border shadow-md overflow-hidden mt-6 p-6">
            <Switch
              checked={earlyAccessSetting.data?.value || false}
              onChange={(newVal) => {
                updateSettingMutation.mutate({ key: 'system.earlyAccess', value: newVal })
              }}
              disabled={updateSettingMutation.isPending}
              label="Ativar Acesso Antecipado"
              description="Receba versões candidatas a lançamento (RC) antes de serem lançadas oficialmente. Nota: versões RC podem conter bugs e não são recomendadas para ambientes onde estabilidade e integridade de dados sejam críticas."
            />
          </div>
          <CoreAutoUpdateSection />
          <AppAutoUpdateSection />
          <ContentAutoUpdateSection />
          <ContentUpdatesSection />
          <div className="bg-surface-primary rounded-lg border shadow-md overflow-hidden py-6 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center p-8 gap-y-8 md:gap-y-0 gap-x-8">
              <div>
                <h2 className="max-w-xl text-lg font-bold text-desert-green sm:text-xl lg:col-span-7">
                  Quer ficar por dentro das novidades do Project NOMAD? Inscreva-se para receber as
                  notas de lançamento diretamente no seu e-mail. Cancele quando quiser.
                </h2>
              </div>
              <div className="flex flex-col">
                <div className="flex gap-x-3">
                  <Input
                    name="email"
                    label=""
                    type="email"
                    placeholder="Seu endereço de e-mail"
                    disabled={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    containerClassName="!mt-0"
                  />
                  <StyledButton
                    variant="primary"
                    disabled={!email}
                    onClick={() => subscribeToReleaseNotesMutation.mutateAsync(email)}
                    loading={subscribeToReleaseNotesMutation.isPending}
                  >
                    Inscrever-se
                  </StyledButton>
                </div>
                <p className="mt-2 text-sm text-desert-stone-dark">
                  Nós nos importamos com a sua privacidade. O Project NOMAD nunca compartilhará seu
                  e-mail com terceiros nem enviará spam.
                </p>
              </div>
            </div>
          </div>

          {showLogs && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-surface-primary rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-desert-stone-light flex justify-between items-center">
                  <h3 className="text-xl font-bold text-desert-green">Logs da Atualização</h3>
                  <button
                    onClick={() => setShowLogs(false)}
                    className="text-desert-stone hover:text-desert-green transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-auto flex-1">
                  <pre className="bg-black text-green-400 p-4 rounded text-xs font-mono whitespace-pre-wrap">
                    {logs || 'Nenhum log disponível ainda...'}
                  </pre>
                </div>
                <div className="p-6 border-t border-desert-stone-light">
                  <StyledButton variant="secondary" onClick={() => setShowLogs(false)} fullWidth>
                    Fechar
                  </StyledButton>
                </div>
              </div>
            </div>
          )}
        </main>
      </div >
    </SettingsLayout >
  )
}
