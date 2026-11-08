import { useState } from 'react'
import { IconMovie } from '@tabler/icons-react'
import api from '~/lib/api'
import useCreatorPacks from '~/hooks/useCreatorPacks'
import useDownloads from '~/hooks/useDownloads'
import { useNotifications } from '~/context/NotificationContext'
import CreatorPackCard from '~/components/CreatorPackCard'
import StyledModal from '~/components/StyledModal'
import { formatBytes } from '~/lib/util'
import type { CreatorPackWithStatus } from '../../types/collections'

// Canonical Creator Pack License (one license across the seed packs). Opened in a
// new tab from the install modal; install is an online action so an external link
// is fine. A per-pack catalog `license_url` can supersede this later if needed.
const LICENSE_URL =
  'https://github.com/Crosstalk-Solutions/project-nomad/blob/main/collections/creator-pack-license.md'

export interface CreatorPacksSectionProps {
  /** Show uninstall controls on installed packs (the settings "manage" surface). */
  allowUninstall?: boolean
}

/**
 * Install-on-click grid of Creator Packs + confirm modals. Shared by the Content
 * Explorer block and the /settings/creator-packs page. Renders NOTHING when the
 * build isn't configured (fork / key unset) — a fork never sees a broken install
 * button. The Easy Setup wizard does NOT use this (it needs selection semantics,
 * not install-on-click) and drives CreatorPackCard itself.
 */
const CreatorPacksSection: React.FC<CreatorPacksSectionProps> = ({ allowUninstall }) => {
  const { configured, packs, invalidate: invalidateCreatorPacks } = useCreatorPacks()
  const { invalidate: invalidateDownloads } = useDownloads({ filetype: 'zim' })
  const { addNotification } = useNotifications()

  const [packToInstall, setPackToInstall] = useState<CreatorPackWithStatus | null>(null)
  const [installing, setInstalling] = useState(false)
  const [packToUninstall, setPackToUninstall] = useState<CreatorPackWithStatus | null>(null)
  const [uninstalling, setUninstalling] = useState(false)

  if (!configured) return null

  const handleConfirmInstall = async () => {
    if (!packToInstall) return
    setInstalling(true)
    try {
      await api.installCreatorPack(packToInstall.id)
      addNotification({ message: `Iniciando instalação de "${packToInstall.name}"`, type: 'success' })
      invalidateCreatorPacks()
      invalidateDownloads()
      setPackToInstall(null)
    } catch (error) {
      console.error('Error installing creator pack:', error)
      addNotification({ message: 'Ocorreu um erro ao iniciar a instalação.', type: 'error' })
    } finally {
      setInstalling(false)
    }
  }

  const handleConfirmUninstall = async () => {
    if (!packToUninstall) return
    setUninstalling(true)
    try {
      await api.uninstallCreatorPack(packToUninstall.id)
      addNotification({ message: `"${packToUninstall.name}" desinstalado`, type: 'success' })
      invalidateCreatorPacks()
      invalidateDownloads()
      setPackToUninstall(null)
    } catch (error) {
      console.error('Error uninstalling creator pack:', error)
      addNotification({ message: 'Ocorreu um erro ao desinstalar.', type: 'error' })
    } finally {
      setUninstalling(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mt-8 mb-4">
        <div className="w-10 h-10 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center shadow-sm">
          <IconMovie className="w-6 h-6 text-text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-text-primary">Pacotes de Criadores</h3>
          <p className="text-sm text-text-muted">
            Coleções de vídeos de criadores de conteúdo para reprodução offline
          </p>
        </div>
      </div>

      {packs.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packs.map((pack) => (
            <CreatorPackCard
              key={pack.id}
              pack={pack}
              onClick={setPackToInstall}
              onUninstall={allowUninstall ? setPackToUninstall : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-text-muted mt-4">Nenhum pacote de criadores disponível.</p>
      )}

      <StyledModal
        open={!!packToInstall}
        title={packToInstall ? `Instalar ${packToInstall.name}?` : 'Instalar Pacote de Criador'}
        onClose={() => !installing && setPackToInstall(null)}
        onCancel={() => setPackToInstall(null)}
        onConfirm={handleConfirmInstall}
        confirmText={packToInstall?.available_update_version ? 'Atualizar pacote' : 'Instalar pacote'}
        cancelText="Cancelar"
        confirmIcon="IconDownload"
        confirmLoading={installing}
        icon={<IconMovie className="w-6 h-6" />}
      >
        {packToInstall && (
          <div className="space-y-3 text-text-secondary">
            <p>
              {packToInstall.video_count} vídeos de {packToInstall.creator}, cerca de{' '}
              {formatBytes(packToInstall.size_mb * 1024 * 1024, 0)}. O download será feito em
              segundo plano e aparecerá no Kiwix quando estiver pronto.
            </p>
            <p className="text-sm text-text-muted">
              Conteúdo licenciado — uso pessoal, vedada a redistribuição.{' '}
              <a
                href={LICENSE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-desert-green underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                Ver licença
              </a>
            </p>
          </div>
        )}
      </StyledModal>

      <StyledModal
        open={!!packToUninstall}
        title={packToUninstall ? `Desinstalar ${packToUninstall.name}?` : 'Desinstalar Pacote de Criador'}
        onClose={() => !uninstalling && setPackToUninstall(null)}
        onCancel={() => setPackToUninstall(null)}
        onConfirm={handleConfirmUninstall}
        confirmText="Desinstalar pacote"
        cancelText="Cancelar"
        confirmIcon="IconTrash"
        confirmVariant="danger"
        confirmLoading={uninstalling}
        icon={<IconMovie className="w-6 h-6" />}
      >
        {packToUninstall && (
          <p className="text-text-secondary">
            Isso removerá os vídeos baixados (
            {formatBytes(packToUninstall.size_mb * 1024 * 1024, 0)}) deste NOMAD. Você pode
            reinstalar o pacote a qualquer momento.
          </p>
        )}
      </StyledModal>
    </>
  )
}

export default CreatorPacksSection
