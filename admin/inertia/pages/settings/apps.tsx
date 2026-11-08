import { Head } from '@inertiajs/react'
import StyledTable from '~/components/StyledTable'
import SettingsLayout from '~/layouts/SettingsLayout'
import { ServiceSlim } from '../../../types/services'
import { getServiceLink } from '~/lib/navigation'
import StyledButton from '~/components/StyledButton'
import { useModals } from '~/context/ModalContext'
import StyledModal from '~/components/StyledModal'
import api from '~/lib/api'
import { useEffect, useState } from 'react'
import InstallActivityFeed from '~/components/InstallActivityFeed'
import LoadingSpinner from '~/components/LoadingSpinner'
import useErrorNotification from '~/hooks/useErrorNotification'
import useInternetStatus from '~/hooks/useInternetStatus'
import useServiceInstallationActivity from '~/hooks/useServiceInstallationActivity'
import { useTransmit } from 'react-adonis-transmit'
import { BROADCAST_CHANNELS } from '../../../constants/broadcast'
import { IconArrowUp, IconCheck, IconDownload } from '@tabler/icons-react'
import UpdateServiceModal from '~/components/UpdateServiceModal'

function extractTag(containerImage: string): string {
  if (!containerImage) return ''
  const parts = containerImage.split(':')
  return parts.length > 1 ? parts[parts.length - 1] : 'latest'
}

export default function SettingsPage(props: { system: { services: ServiceSlim[] } }) {
  const { openModal, closeAllModals } = useModals()
  const { showError } = useErrorNotification()
  const { isOnline } = useInternetStatus()
  const { subscribe } = useTransmit()
  const installActivity = useServiceInstallationActivity()

  const [isInstalling, setIsInstalling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  // Services with an update in flight. Seeded optimistically on click so the button disables
  // instantly, and reconciled with the durable `installation_status` from the server so the
  // disabled state survives a page reload or a second open tab while the pull runs.
  const [updatingServices, setUpdatingServices] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (installActivity.length === 0) return
    if (
      installActivity.some(
        (activity) => activity.type === 'completed' || activity.type === 'update-complete'
      )
    ) {
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  }, [installActivity])

  // Listen for service update check completion
  useEffect(() => {
    const unsubscribe = subscribe(BROADCAST_CHANNELS.SERVICE_UPDATES, () => {
      setCheckingUpdates(false)
      window.location.reload()
    })
    return () => { unsubscribe() }
  }, [])

  async function handleCheckUpdates() {
    try {
      if (!isOnline) {
        showError('Você precisa estar conectado à internet para verificar atualizações.')
        return
      }
      setCheckingUpdates(true)
      const response = await api.checkServiceUpdates()
      if (!response?.success) {
        throw new Error('Falha ao iniciar a verificação de atualizações')
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      showError(`Falha ao verificar atualizações: ${error.message || 'Erro desconhecido'}`)
      setCheckingUpdates(false)
    }
  }

  const handleInstallService = (service: ServiceSlim) => {
    openModal(
      <StyledModal
        title="Instalar Serviço?"
        onConfirm={() => {
          installService(service.service_name)
          closeAllModals()
        }}
        onCancel={closeAllModals}
        open={true}
        confirmText="Instalar"
        cancelText="Cancelar"
        confirmVariant="primary"
        icon={<IconDownload className="h-12 w-12 text-desert-green" />}
      >
        <p className="text-text-primary">
          Tem certeza de que deseja instalar {service.friendly_name || service.service_name}? Isso
          iniciará o serviço e o tornará disponível na sua instância do Project NOMAD. A instalação
          pode levar algum tempo para ser concluída.
        </p>
      </StyledModal>,
      'install-service-modal'
    )
  }

  async function installService(serviceName: string) {
    try {
      if (!isOnline) {
        showError('Você precisa estar conectado à internet para instalar serviços.')
        return
      }

      setIsInstalling(true)
      const response = await api.installService(serviceName)
      if (!response) {
        throw new Error('Ocorreu um erro interno ao tentar instalar o serviço.')
      }
      if (!response.success) {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('Error installing service:', error)
      showError(`Falha ao instalar o serviço: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setIsInstalling(false)
    }
  }

  async function handleAffectAction(record: ServiceSlim, action: 'start' | 'stop' | 'restart') {
    const actionVerb =
      action === 'start' ? 'iniciar' : action === 'stop' ? 'parar' : 'reiniciar'
    try {
      setLoading(true)
      const response = await api.affectService(record.service_name, action)
      if (!response) {
        throw new Error('Ocorreu um erro interno ao tentar controlar o serviço.')
      }
      if (!response.success) {
        throw new Error(response.message)
      }

      closeAllModals()

      setTimeout(() => {
        setLoading(false)
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error(`Error affecting service ${record.service_name}:`, error)
      showError(`Falha ao ${actionVerb} o serviço: ${error.message || 'Erro desconhecido'}`)
    }
  }

  async function handleForceReinstall(record: ServiceSlim) {
    try {
      setLoading(true)
      const response = await api.forceReinstallService(record.service_name)
      if (!response) {
        throw new Error('Ocorreu um erro interno ao tentar forçar a reinstalação do serviço.')
      }
      if (!response.success) {
        throw new Error(response.message)
      }

      closeAllModals()

      setTimeout(() => {
        setLoading(false)
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error(`Error force reinstalling service ${record.service_name}:`, error)
      showError(`Falha ao forçar a reinstalação do serviço: ${error.message || 'Erro desconhecido'}`)
    }
  }

  function handleUpdateService(record: ServiceSlim) {
    const currentTag = extractTag(record.container_image)
    const latestVersion = record.available_update_version!

    openModal(
      <UpdateServiceModal
        record={record}
        currentTag={currentTag}
        latestVersion={latestVersion}
        onCancel={closeAllModals}
        onUpdate={async (targetVersion: string) => {
          closeAllModals()
          // Mark this service as updating instead of showing the fullscreen spinner, so the table
          // and the activity feed stay visible (the feed streams live pull/stop/start progress)
          // while the button shows "Updating..." and is disabled.
          setUpdatingServices((prev) => new Set(prev).add(record.service_name))
          try {
            const response = await api.updateService(record.service_name, targetVersion)
            if (!response?.success) {
              throw new Error(response?.message || 'Falha na atualização')
            }
            // On success the backend broadcasts `update-complete`, which triggers the reload effect
            // above and refreshes the version + status. Leave the button disabled until then.
          } catch (error) {
            console.error(`Error updating service ${record.service_name}:`, error)
            showError(`Falha ao atualizar o serviço: ${error.message || 'Erro desconhecido'}`)
            setUpdatingServices((prev) => {
              const next = new Set(prev)
              next.delete(record.service_name)
              return next
            })
          }
        }}
        showError={showError}
      />,
      `${record.service_name}-update-modal`
    )
  }

  const AppActions = ({ record }: { record: ServiceSlim }) => {
    const ForceReinstallButton = () => (
      <StyledButton
        icon="IconDownload"
        variant="action"
        onClick={() => {
          openModal(
            <StyledModal
              title={'Forçar Reinstalação?'}
              onConfirm={() => handleForceReinstall(record)}
              onCancel={closeAllModals}
              open={true}
              confirmText={'Forçar Reinstalação'}
              cancelText="Cancelar"
            >
              <p className="text-text-primary">
                Tem certeza de que deseja forçar a reinstalação de {record.service_name}? Isso irá{' '}
                <strong>APAGAR TODOS OS DADOS</strong> deste serviço e não pode ser desfeito. Faça
                isso apenas se o serviço estiver apresentando falhas e outras etapas de solução de
                problemas tiverem falhado.
              </p>
            </StyledModal>,
            `${record.service_name}-force-reinstall-modal`
          )
        }}
        disabled={isInstalling}
      >
        Forçar Reinstalação
      </StyledButton>
    )

    if (!record) return null
    if (!record.installed) {
      return (
        <div className="flex flex-wrap gap-2">
          <StyledButton
            icon={'IconDownload'}
            variant="primary"
            onClick={() => handleInstallService(record)}
            disabled={isInstalling || !isOnline}
            loading={isInstalling}
          >
            Instalar
          </StyledButton>
          <ForceReinstallButton />
        </div>
      )
    }

    return (
      <div className="flex flex-wrap gap-2">
        <StyledButton
          icon={'IconExternalLink'}
          onClick={() => {
            window.open(getServiceLink(record.ui_location || 'unknown', record.custom_url), '_blank')
          }}
        >
          Abrir
        </StyledButton>
        {record.available_update_version && (() => {
          const isUpdating =
            updatingServices.has(record.service_name) || record.installation_status === 'installing'
          return (
            <StyledButton
              icon="IconArrowUp"
              variant="primary"
              onClick={() => handleUpdateService(record)}
              disabled={isInstalling || !isOnline || isUpdating}
              loading={isUpdating}
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </StyledButton>
          )
        })()}
        {record.status && record.status !== 'unknown' && (
          <>
            <StyledButton
              icon={record.status === 'running' ? 'IconPlayerStop' : 'IconPlayerPlay'}
              variant={record.status === 'running' ? 'action' : undefined}
              onClick={() => {
                openModal(
                  <StyledModal
                    title={`${record.status === 'running' ? 'Parar' : 'Iniciar'} Serviço?`}
                    onConfirm={() =>
                      handleAffectAction(record, record.status === 'running' ? 'stop' : 'start')
                    }
                    onCancel={closeAllModals}
                    open={true}
                    confirmText={record.status === 'running' ? 'Parar' : 'Iniciar'}
                    cancelText="Cancelar"
                  >
                    <p className="text-text-primary">
                      Tem certeza de que deseja {record.status === 'running' ? 'parar' : 'iniciar'}{' '}
                      {record.service_name}?
                    </p>
                  </StyledModal>,
                  `${record.service_name}-affect-modal`
                )
              }}
              disabled={isInstalling}
            >
              {record.status === 'running' ? 'Parar' : 'Iniciar'}
            </StyledButton>
            {record.status === 'running' && (
              <StyledButton
                icon="IconRefresh"
                variant="action"
                onClick={() => {
                  openModal(
                    <StyledModal
                      title={'Reiniciar Serviço?'}
                      onConfirm={() => handleAffectAction(record, 'restart')}
                      onCancel={closeAllModals}
                      open={true}
                      confirmText={'Reiniciar'}
                      cancelText="Cancelar"
                    >
                      <p className="text-text-primary">
                        Tem certeza de que deseja reiniciar {record.service_name}?
                      </p>
                    </StyledModal>,
                    `${record.service_name}-affect-modal`
                  )
                }}
                disabled={isInstalling}
              >
                Reiniciar
              </StyledButton>
            )}
            <ForceReinstallButton />
          </>
        )}
      </div>
    )
  }

  return (
    <SettingsLayout>
      <Head title="Configurações de Aplicativos | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-semibold">Aplicativos</h1>
              <p className="text-text-muted mt-1">
                Gerencie os aplicativos disponíveis na sua instância do Project NOMAD. Verificações noturnas automáticas detectarão quando novas versões desses aplicativos estiverem disponíveis.
              </p>
            </div>
            <StyledButton
              icon="IconRefreshAlert"
              onClick={handleCheckUpdates}
              disabled={checkingUpdates || !isOnline}
              loading={checkingUpdates}
            >
              Verificar Atualizações
            </StyledButton>
          </div>
          {loading && <LoadingSpinner fullscreen />}
          {!loading && (
            <StyledTable<ServiceSlim & { actions?: any }>
              className="font-semibold !overflow-x-auto"
              rowLines={true}
              columns={[
                {
                  accessor: 'friendly_name',
                  title: 'Nome',
                  render(record) {
                    return (
                      <div className="flex flex-col">
                        <p>{record.friendly_name || record.service_name}</p>
                        <p className="text-sm text-text-muted">{record.description}</p>
                      </div>
                    )
                  },
                },
                {
                  accessor: 'ui_location',
                  title: 'Localização',
                  render: (record) => (
                    <a
                      href={getServiceLink(record.ui_location || 'unknown', record.custom_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-desert-green hover:underline font-semibold"
                    >
                      {record.ui_location}
                    </a>
                  ),
                },
                {
                  accessor: 'installed',
                  title: 'Instalado',
                  render: (record) =>
                    record.installed ? <IconCheck className="h-6 w-6 text-desert-green" /> : '',
                },
                {
                  accessor: 'container_image',
                  title: 'Versão',
                  render: (record) => {
                    if (!record.installed) return null
                    const currentTag = extractTag(record.container_image)
                    if (record.available_update_version) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-muted">{currentTag}</span>
                          <IconArrowUp className="h-4 w-4 text-desert-green" />
                          <span className="text-desert-green font-semibold">
                            {record.available_update_version}
                          </span>
                        </div>
                      )
                    }
                    return <span className="text-text-secondary">{currentTag}</span>
                  },
                },
                {
                  accessor: 'actions',
                  title: 'Ações',
                  className: '!whitespace-normal',
                  render: (record) => <AppActions record={record} />,
                },
              ]}
              data={props.system.services}
            />
          )}
          {installActivity.length > 0 && (
            <InstallActivityFeed activity={installActivity} className="mt-8" withHeader />
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}

