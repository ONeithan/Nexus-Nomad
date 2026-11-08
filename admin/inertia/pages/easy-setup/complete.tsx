import { Head, router } from '@inertiajs/react'
import AppLayout from '~/layouts/AppLayout'
import StyledButton from '~/components/StyledButton'
import Alert from '~/components/Alert'
import useInternetStatus from '~/hooks/useInternetStatus'
import useServiceInstallationActivity from '~/hooks/useServiceInstallationActivity'
import InstallActivityFeed from '~/components/InstallActivityFeed'
import ActiveDownloads from '~/components/ActiveDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'

export default function EasySetupWizardComplete() {
  const { isOnline } = useInternetStatus()
  const installActivity = useServiceInstallationActivity()

  return (
    <AppLayout>
      <Head title="Configuração Rápida Concluída" />
      {!isOnline && (
        <Alert
          title="Sem Conexão com a Internet"
          message="Parece que você não está conectado à internet. Instalar aplicativos e baixar conteúdos exigirá uma conexão com a internet."
          type="warning"
          variant="solid"
          className="mb-8"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-surface-primary rounded-md shadow-md p-6">
          <StyledSectionHeader title="Atividade de Instalação de Aplicativos" className=" mb-4" />
          <InstallActivityFeed
            activity={installActivity}
            className="!shadow-none border-desert-stone-light border"
          />
          <ActiveDownloads withHeader />
          <Alert
            title="Executando em Segundo Plano"
            message="Fique à vontade para sair desta página a qualquer momento — as instalações de aplicativos e os downloads continuarão em segundo plano! Observe que a Biblioteca Offline (se instalada) pode ficar indisponível até que todos os downloads iniciais sejam concluídos."
            type="info"
            variant="solid"
            className='mt-12'
          />
          <div className="flex justify-center mt-8 pt-4 border-t border-desert-stone-light">
            <div className="flex space-x-4">
              <StyledButton onClick={() => router.visit('/home')} icon="IconHome">
                Ir ao Início
              </StyledButton>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
