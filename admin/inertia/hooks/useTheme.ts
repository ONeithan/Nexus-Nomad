import { useState, useEffect, useCallback } from 'react'
import api from '~/lib/api'

export type Theme = 'tactical' | 'light' | 'dark' | 'survival' | 'stealth'
export type HomeLayoutMode = 'auto' | 'tactical' | 'classic'

export interface ThemeDefinition {
  id: Theme
  name: string
  shortName: string
  badge: string
  subtitle: string
  description: string
  isDark: boolean
  isTacticalHud: boolean
  swatches: {
    bg: string
    panel: string
    primary: string
    accent: string
    text: string
  }
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'tactical',
    name: 'Militar Tático (MIL-STD-810H)',
    shortName: 'Militar Tático',
    badge: 'DESTAQUE // PADRÃO MILITAR',
    subtitle: 'Olive Drab • Coyote Tan • Ranger Green',
    description:
      'Chassi blindado fosco em Olive Drab (#1e2520) e Chumbo (#141715), destaques em Coyote Tan (#c2a677) e Ranger Green (#7d9680), cantos chanfrados em 45° e rebites industriais.',
    isDark: true,
    isTacticalHud: true,
    swatches: {
      bg: '#141715',
      panel: '#1e2520',
      primary: '#7d9680',
      accent: '#c2a677',
      text: '#e2e6e3',
    },
  },
  {
    id: 'light',
    name: 'Padrão NOMAD (Modo Claro)',
    shortName: 'Padrão NOMAD',
    badge: 'CLÁSSICO OFICIAL',
    subtitle: 'Areia do Deserto • Verde Oliva • Terracota',
    description:
      'Visual original do Project NOMAD com fundo claro em areia (#f7eedc), cartões brancos de alto contraste diurno, verde oliva clássico (#424420) e terracota (#a84a12).',
    isDark: false,
    isTacticalHud: false,
    swatches: {
      bg: '#f7eedc',
      panel: '#ffffff',
      primary: '#424420',
      accent: '#a84a12',
      text: '#111827',
    },
  },
  {
    id: 'dark',
    name: 'Padrão NOMAD Noturno (Night Ops)',
    shortName: 'NOMAD Noturno',
    badge: 'CLÁSSICO ESCURO',
    subtitle: 'Carvão Quente • Oliva Escuro • Creme',
    description:
      'Modo noturno clássico do NOMAD com fundo carvão quente (#1c1b16), painéis em oliva escuro (#2a2918) e tipografia creme suave (#f7eedc) para uso prolongado.',
    isDark: true,
    isTacticalHud: false,
    swatches: {
      bg: '#1c1b16',
      panel: '#2a2918',
      primary: '#525530',
      accent: '#c85815',
      text: '#f7eedc',
    },
  },
  {
    id: 'survival',
    name: 'Sobrevivência em Campo (Rugged Âmbar)',
    shortName: 'Sobrevivência',
    badge: 'BAIXA EMISSÃO NOTURNA',
    subtitle: 'Carbono Fosco • Camurça • Âmbar Tático',
    description:
      'Inspirado em terminais de emergência e equipamentos de campo off-grid, com baixa emissão de luz azul, tons terrosos (#211d18) e indicadores em âmbar tático (#d97706).',
    isDark: true,
    isTacticalHud: true,
    swatches: {
      bg: '#141210',
      panel: '#211d18',
      primary: '#b89f7d',
      accent: '#d97706',
      text: '#ede4d7',
    },
  },
  {
    id: 'stealth',
    name: 'Operações Navais / Stealth (Aço Ártico)',
    shortName: 'Naval Stealth',
    badge: 'CHASSI TITÂNIO',
    subtitle: 'Ardósia Profunda • Titânio • Azul Aço',
    description:
      'Estética de centro de comando naval e aeroespacial com chassi em azul-ardósia (#0f1419), painéis de titânio (#18212b), aço tático (#5b82a6) e alerta laranja SAR.',
    isDark: true,
    isTacticalHud: true,
    swatches: {
      bg: '#0f1419',
      panel: '#18212b',
      primary: '#5b82a6',
      accent: '#8fb3d9',
      text: '#e2e8f0',
    },
  },
]

const VALID_THEMES: Theme[] = ['tactical', 'light', 'dark', 'survival', 'stealth']
const STORAGE_KEY = 'nomad:theme'
const LAYOUT_STORAGE_KEY = 'nomad:home_layout'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'tactical'
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && VALID_THEMES.includes(stored)) return stored
  } catch {}
  return 'tactical'
}

function getInitialHomeLayout(): HomeLayoutMode {
  if (typeof window === 'undefined') return 'auto'
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY) as HomeLayoutMode | null
    if (stored === 'auto' || stored === 'tactical' || stored === 'classic') return stored
  } catch {}
  return 'auto'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [homeLayout, setHomeLayoutState] = useState<HomeLayoutMode>(getInitialHomeLayout)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {}
    // Fire-and-forget KV store sync for cross-device persistence
    api.updateSetting('ui.theme', newTheme).catch(() => {})
  }, [])

  const setHomeLayout = useCallback((newLayout: HomeLayoutMode) => {
    setHomeLayoutState(newLayout)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-home-layout', newLayout)
    }
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout)
    } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = VALID_THEMES.indexOf(prev)
      const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length]
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next)
      }
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      api.updateSetting('ui.theme', next).catch(() => {})
      return next
    })
  }, [])

  // Apply theme on mount and sync across tabs
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-home-layout', homeLayout)

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && VALID_THEMES.includes(e.newValue as Theme)) {
        setThemeState(e.newValue as Theme)
        document.documentElement.setAttribute('data-theme', e.newValue)
      }
      if (
        e.key === LAYOUT_STORAGE_KEY &&
        (e.newValue === 'auto' || e.newValue === 'tactical' || e.newValue === 'classic')
      ) {
        setHomeLayoutState(e.newValue as HomeLayoutMode)
        document.documentElement.setAttribute('data-home-layout', e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [theme, homeLayout])

  const currentThemeDef =
    THEME_DEFINITIONS.find((t) => t.id === theme) || THEME_DEFINITIONS[0]

  const effectiveTacticalHome =
    homeLayout === 'tactical' ||
    (homeLayout === 'auto' && currentThemeDef.isTacticalHud)

  return {
    theme,
    setTheme,
    toggleTheme,
    homeLayout,
    setHomeLayout,
    currentThemeDef,
    effectiveTacticalHome,
  }
}
