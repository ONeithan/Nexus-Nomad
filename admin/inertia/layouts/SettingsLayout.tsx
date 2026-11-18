import {
  IconAdjustments,
  IconArrowBigUpLines,
  IconBox,
  IconChartBar,
  IconCode,
  IconDashboard,
  IconDatabase,
  IconDownload,
  IconFolder,
  IconGavel,
  IconHeart,
  IconMapRoute,
  IconMovie,
  IconPalette,
  IconServer,
  IconSettings,
  IconShieldCheck,
  IconWand,
  IconZoom
} from '@tabler/icons-react'
import { useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import StyledSidebar from '~/components/StyledSidebar'
import { getServiceLink } from '~/lib/navigation'
import useCreatorPacks from '~/hooks/useCreatorPacks'
import TacticalBootGate from '~/components/TacticalBootGate'
import type { AuthStatusPayload } from '../../types/auth'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { aiAssistantName, authUser } = usePage<{
    aiAssistantName: string
    authUser?: AuthStatusPayload | null
  }>().props
  const { configured: creatorPacksConfigured } = useCreatorPacks()
  const isLevel1Restricted =
    authUser?.authenticated && authUser?.operator && authUser.operator.roleLevel <= 1
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const blockSettingsForLevel1 = isLevel1Restricted && currentPath !== '/settings/profile'

  useEffect(() => {
    const root = document.documentElement
    root.dataset.uiContext = 'settings'
    return () => {
      if (root.dataset.uiContext === 'settings') {
        delete root.dataset.uiContext
      }
    }
  }, [])

  const aiLabel =
    aiAssistantName && aiAssistantName !== 'AI Assistant' && aiAssistantName !== 'Assistente de IA'
      ? aiAssistantName
      : 'Assistente de IA'

  const navigation = [
    { name: 'Perfil & Operadores', href: '/settings/profile', icon: IconShieldCheck, current: false },
    { name: 'Sistema & Discos', href: '/settings/system', icon: IconSettings, current: false },
    { name: 'Armazenamento & Samba', href: '/settings/storage', icon: IconDatabase, current: false },
    { name: 'Downloads Ativos', href: '/settings/downloads', icon: IconDownload, current: false },
    { name: 'Temas & Interface', href: '/settings/themes', icon: IconPalette, current: false },
    { name: 'Servidores Remotos', href: '/settings/servers', icon: IconServer, current: false },
    { name: aiLabel, href: '/settings/models', icon: IconWand, current: false },
    { name: 'Central de Aplicativos', href: '/supply-depot', icon: IconBox, current: false },
    { name: 'Explorador de Conteúdo ZIM', href: '/settings/zim/remote-explorer', icon: IconZoom, current: false },
    { name: 'Gerenciador de ZIMs', href: '/settings/zim', icon: IconFolder, current: false },
    ...(creatorPacksConfigured ? [{ name: 'Pacotes de Criadores', href: '/settings/creator-packs', icon: IconMovie, current: false }] : []),
    { name: 'Gerenciador de Mapas', href: '/settings/maps', icon: IconMapRoute, current: false },
    { name: 'Benchmark de Hardware', href: '/settings/benchmark', icon: IconChartBar, current: false },
    {
      name: 'Logs e Métricas (Dozzle)',
      href: getServiceLink('9999'),
      icon: IconDashboard,
      current: false,
      target: '_blank',
    },
    {
      name: 'Verificar Atualizações',
      href: '/settings/update',
      icon: IconArrowBigUpLines,
      current: false,
    },
    { name: 'Avançado', href: '/settings/advanced', icon: IconAdjustments, current: false },
    { name: 'Referência da API', href: '/reference', icon: IconCode, current: false },
    { name: 'Apoie o Projeto', href: '/settings/support', icon: IconHeart, current: false },
    { name: 'Avisos Legais', href: '/settings/legal', icon: IconGavel, current: false },
  ]

  return (
    <TacticalBootGate>
      <div className="min-h-screen flex flex-row bg-surface-secondary/90">
        <StyledSidebar
          title="Configurações"
          items={isLevel1Restricted ? navigation.slice(0, 1) : navigation}
        />
        {blockSettingsForLevel1 ? (
          <div className="xl:pl-72 w-full flex items-center justify-center p-8">
            <div className="max-w-md w-full chamfer-box p-6 text-center space-y-4">
              <h2 className="text-xl font-bold text-desert-orange">
                Acesso Restrito (Nível 1)
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Sua conta possui autorização{' '}
                <strong>{authUser?.operator?.badgeLabel}</strong> (somente Painel Inicial e
                Perfil). Para liberar acesso às configurações, solicite ao Administrador Nível 5.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/home"
                  className="px-4 py-2 rounded-lg bg-desert-green text-white text-xs font-bold hover:opacity-90"
                >
                  Voltar ao Início
                </Link>
                <Link
                  href="/settings/profile"
                  className="px-4 py-2 rounded-lg border border-border-default bg-surface-primary text-xs font-semibold text-text-primary hover:border-desert-green"
                >
                  Abrir Meu Perfil
                </Link>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </TacticalBootGate>
  )
}
