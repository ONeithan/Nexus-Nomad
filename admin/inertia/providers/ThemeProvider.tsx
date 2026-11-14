import { createContext, useContext } from 'react'
import {
  useTheme,
  Theme,
  HomeLayoutMode,
  ThemeDefinition,
  THEME_DEFINITIONS,
} from '~/hooks/useTheme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  homeLayout: HomeLayoutMode
  setHomeLayout: (mode: HomeLayoutMode) => void
  currentThemeDef: ThemeDefinition
  effectiveTacticalHome: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'tactical',
  setTheme: () => {},
  toggleTheme: () => {},
  homeLayout: 'auto',
  setHomeLayout: () => {},
  currentThemeDef: THEME_DEFINITIONS[0],
  effectiveTacticalHome: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeState = useTheme()
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  return useContext(ThemeContext)
}
