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
  IconWand,
  IconZoom
} from '@tabler/icons-react'
import { usePage } from '@inertiajs/react'
import StyledSidebar from '~/components/StyledSidebar'
import { getServiceLink } from '~/lib/navigation'
import useCreatorPacks from '~/hooks/useCreatorPacks'
import TacticalBootGate from '~/components/TacticalBootGate'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const { configured: creatorPacksConfigured } = useCreatorPacks()

  const aiLabel =
    aiAssistantName && aiAssistantName !== 'AI Assistant' && aiAssistantName !== 'Assistente de IA'
      ? aiAssistantName
      : 'Assistente de IA'

  const navigation = [
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
        <StyledSidebar title="Configurações" items={navigation} />
        {children}
      </div>
    </TacticalBootGate>
  )
}
