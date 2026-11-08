import { IconSun, IconMoon } from '@tabler/icons-react'
import { useThemeContext } from '~/providers/ThemeProvider'

interface ThemeToggleProps {
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeContext()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors
                 text-desert-stone hover:text-desert-green-darker cursor-pointer"
      aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Noturno'}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Noturno'}
    >
      {isDark ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
      {!compact && <span>{isDark ? 'Modo Claro' : 'Modo Noturno'}</span>}
    </button>
  )
}
