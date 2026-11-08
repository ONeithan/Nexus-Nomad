import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import CreatorPacksSection from '~/components/CreatorPacksSection'
import ActiveDownloads from '~/components/ActiveDownloads'
import useCreatorPacks from '~/hooks/useCreatorPacks'

export default function CreatorPacksPage() {
  const { configured } = useCreatorPacks()

  return (
    <SettingsLayout>
      <Head title="Pacotes de Criadores | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <h1 className="text-4xl font-semibold mb-2">Pacotes de Criadores</h1>
          <p className="text-text-muted mb-4">
            Instale coleções de vídeos selecionadas de criadores de conteúdo. Os pacotes são
            baixados em segundo plano e reproduzidos offline pelo Kiwix.
          </p>

          {configured ? (
            <>
              <CreatorPacksSection allowUninstall />
              <div className="mt-10">
                <ActiveDownloads filetype="zim" withHeader />
              </div>
            </>
          ) : (
            <p className="text-text-muted mt-4">
              Os Pacotes de Criadores não estão disponíveis nesta compilação.
            </p>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
