import { useState, useRef, useEffect } from 'react'
import {
  IconPalette,
  IconCheck,
  IconChevronDown,
  IconShield,
  IconSun,
  IconMoon,
  IconFlame,
  IconCompass,
} from '@tabler/icons-react'
import { Link } from '@inertiajs/react'
import { useThemeContext } from '~/providers/ThemeProvider'
import { THEME_DEFINITIONS, Theme } from '~/hooks/useTheme'

interface ThemeToggleProps {
  compact?: boolean
  direction?: 'up' | 'down'
}

export function getThemeIcon(id: Theme, className = 'size-4') {
  switch (id) {
    case 'tactical':
      return <IconShield className={className} />
    case 'light':
      return <IconSun className={className} />
    case 'dark':
      return <IconMoon className={className} />
    case 'survival':
      return <IconFlame className={className} />
    case 'stealth':
      return <IconCompass className={className} />
  }
}

export default function ThemeToggle({ compact = false, direction = 'up' }: ThemeToggleProps) {
  const { theme, setTheme, currentThemeDef } = useThemeContext()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:border-desert-green transition-colors cursor-pointer"
        aria-label="Selecionar Tema da Interface"
        title="Trocar tema visual instantaneamente"
      >
        <IconPalette className="size-4 text-desert-green" />
        {!compact && <span>Tema: {currentThemeDef.shortName}</span>}
        <span
          className="h-2.5 w-2.5 rounded-full border border-white/20"
          style={{ backgroundColor: currentThemeDef.swatches.accent }}
        />
        <IconChevronDown className="size-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          className={`absolute ${
            direction === 'down' ? 'top-full mt-2 right-0' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          } z-50 w-72 rounded-lg border border-border-default bg-surface-primary p-2 shadow-2xl`}
        >
          <div className="px-2 py-1.5 border-b border-border-subtle mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Troca Instantânea de Tema
            </span>
            <span className="text-[10px] text-desert-green font-semibold">Tempo Real</span>
          </div>

          <div className="space-y-1">
            {THEME_DEFINITIONS.map((t) => {
              const isSelected = t.id === theme
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-desert-green text-white font-semibold'
                      : 'text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getThemeIcon(t.id, 'size-4 shrink-0')}
                    <div className="truncate">
                      <div className="truncate leading-tight">{t.shortName}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-white/80' : 'text-text-muted'
                        }`}
                      >
                        {t.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center -space-x-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/40"
                        style={{ backgroundColor: t.swatches.bg }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/40"
                        style={{ backgroundColor: t.swatches.primary }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/40"
                        style={{ backgroundColor: t.swatches.accent }}
                      />
                    </div>
                    {isSelected && <IconCheck className="size-4 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-2 pt-1.5 border-t border-border-subtle">
            <Link
              href="/settings/themes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full rounded-md bg-surface-secondary hover:bg-desert-green hover:text-white px-2.5 py-1.5 text-xs font-semibold text-desert-green transition-colors"
            >
              <IconPalette className="size-3.5" />
              <span>Abrir Painel Completo de Temas</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
