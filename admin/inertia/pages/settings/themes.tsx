import { Head, Link } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import { useThemeContext } from '~/providers/ThemeProvider'
import { THEME_DEFINITIONS, HomeLayoutMode, UiScaleMode } from '~/hooks/useTheme'
import { getThemeIcon } from '~/components/ThemeToggle'
import {
  IconCheck,
  IconPalette,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconSparkles,
  IconArrowLeft,
  IconShieldCheck,
} from '@tabler/icons-react'

const HOME_LAYOUT_OPTIONS: Array<{
  id: HomeLayoutMode
  title: string
  subtitle: string
  description: string
}> = [
  {
    id: 'auto',
    title: 'Painel Completo N.O.M.A.D. (Todos os 5 Temas)',
    subtitle: 'Recomendado • Padrão',
    description:
      'Exibe o Centro de Comando moderno completo (Armazenamento, CPU, RAM, Log ao Vivo e Centrais de Operação) aplicando a paleta de cores de qualquer um dos 5 temas escolhidos.',
  },
  {
    id: 'tactical',
    title: 'Forçar HUD Completo N.O.M.A.D.',
    subtitle: 'Sempre Completo',
    description:
      'Mantém sempre o painel completo com telemetria de discos, processador, memória e navegações em qualquer tema selecionado.',
  },
  {
    id: 'classic',
    title: 'Grade Simples Clássica (Legado)',
    subtitle: 'Visual Antigo em Blocos',
    description:
      'Exibe apenas os blocos grandes tradicionais originais na tela inicial em vez do painel completo com telemetria.',
  },
]

const UI_SCALE_OPTIONS: Array<{
  id: UiScaleMode
  title: string
  subtitle: string
  description: string
}> = [
  {
    id: '130',
    title: '130% Amplo (Conforto Visual)',
    subtitle: 'Recomendado • Padrão',
    description:
      'Exibe textos, cards, medidores e botões ampliados em 130% naturalmente em monitores Full HD+, eliminando sobras laterais e melhorando a leitura à distância sem precisar dar zoom no navegador.',
  },
  {
    id: '115',
    title: '115% Intermediário',
    subtitle: 'Equilibrado',
    description:
      'Aumenta levemente a legibilidade geral em 15% mantendo mais linhas visíveis simultaneamente em listas extensas.',
  },
  {
    id: '100',
    title: '100% Original Compacto',
    subtitle: 'Escala Clássica',
    description:
      'Usa o tamanho base padrão (16px) de navegador para telas pequenas ou quem prefere elementos menores.',
  },
]

export default function ThemesSettingsPage() {
  const { theme, setTheme, homeLayout, setHomeLayout, uiScale, setUiScale, currentThemeDef } =
    useThemeContext()

  return (
    <SettingsLayout>
      <Head title="Temas & Interface | Nexus NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-desert-green-lighter border border-border-default text-xs font-bold uppercase tracking-wider text-desert-green mb-2">
                <IconPalette className="size-4" />
                <span>Personalização Visual em Tempo Real</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-desert-green">
                Temas &amp; Interface do Sistema
              </h1>
              <p className="text-text-secondary mt-1">
                Escolha o tema visual que será aplicado instantaneamente a todas as páginas, módulos,
                mapas, assistente de IA e ferramentas do servidor — sem precisar recarregar.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-desert-green bg-desert-green text-white hover:opacity-90 text-sm font-semibold shadow-sm transition-opacity"
              >
                <IconArrowLeft className="size-4" />
                <span>Ver no Centro de Comando</span>
              </Link>
            </div>
          </div>

          {/* Active Theme Banner */}
          <div className="chamfer-box relative p-5 mb-8">
            <div className="rivet absolute top-2.5 left-2.5" />
            <div className="rivet absolute top-2.5 right-2.5" />
            <div className="rivet absolute bottom-2.5 left-2.5" />
            <div className="rivet absolute bottom-2.5 right-2.5" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-start sm:items-center gap-4">
                <div
                  className="p-3.5 rounded-lg border border-border-default flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: currentThemeDef.swatches.bg,
                    color: currentThemeDef.swatches.accent,
                  }}
                >
                  {getThemeIcon(currentThemeDef.id, 'size-8')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-desert-orange text-white">
                      TEMA ATIVO AGORA
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                      {currentThemeDef.badge}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mt-1">
                    {currentThemeDef.name}
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {currentThemeDef.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start md:self-center bg-surface-secondary px-3 py-2 rounded-md border border-border-subtle">
                <span className="text-xs font-semibold text-text-secondary mr-1">Paleta:</span>
                {Object.entries(currentThemeDef.swatches).map(([key, color]) => (
                  <div key={key} className="flex flex-col items-center" title={`${key}: ${color}`}>
                    <span
                      className="h-6 w-6 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[0.5625rem] font-mono text-text-muted mt-0.5 uppercase">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Selection Grid */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <IconSparkles className="size-5 text-desert-green" />
                <span>Selecione um Tema (Aplicação Imediata)</span>
              </h2>
              <span className="text-xs text-text-muted">
                Clique em qualquer cartão para ativar na hora
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {THEME_DEFINITIONS.map((t) => {
                const isSelected = t.id === theme
                return (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setTheme(t.id)
                      }
                    }}
                    className={`group relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-desert-orange ring-2 ring-desert-orange/30 shadow-xl'
                        : 'border-border-default hover:border-desert-green shadow-md'
                    }`}
                    style={{ backgroundColor: t.swatches.panel }}
                  >
                    {/* Visual Mini-Preview Header */}
                    <div>
                      <div
                        className="p-4 border-b"
                        style={{
                          backgroundColor: t.swatches.bg,
                          borderColor: 'rgba(150, 150, 150, 0.2)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[0.625rem] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: t.swatches.panel,
                              color: t.swatches.accent,
                              border: `1px solid ${t.swatches.primary}`,
                            }}
                          >
                            {t.badge}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-desert-orange text-white text-[0.6875rem] font-bold">
                              <IconCheck className="size-3.5" />
                              ATIVO
                            </span>
                          ) : (
                            <span
                              className="text-[0.6875rem] font-semibold opacity-75 group-hover:opacity-100"
                              style={{ color: t.swatches.text }}
                            >
                              Clicar para aplicar
                            </span>
                          )}
                        </div>

                        {/* Simulated UI Preview inside card */}
                        <div
                          className="rounded p-3 border"
                          style={{
                            backgroundColor: t.swatches.panel,
                            borderColor: t.swatches.primary,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: t.swatches.accent }}
                              />
                              <span
                                className="text-xs font-bold tracking-wider uppercase"
                                style={{ color: t.swatches.text }}
                              >
                                N.O.M.A.D. // COMANDO
                              </span>
                            </div>
                            <span
                              className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: t.swatches.bg,
                                color: t.swatches.primary,
                              }}
                            >
                              OFF-GRID
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 mt-2">
                            <div
                              className="h-7 rounded flex items-center justify-center text-[0.625rem] font-bold"
                              style={{
                                backgroundColor: t.swatches.bg,
                                color: t.swatches.accent,
                                border: `1px solid ${t.swatches.primary}55`,
                              }}
                            >
                              KIWIX
                            </div>
                            <div
                              className="h-7 rounded flex items-center justify-center text-[0.625rem] font-bold"
                              style={{
                                backgroundColor: t.swatches.bg,
                                color: t.swatches.primary,
                                border: `1px solid ${t.swatches.primary}55`,
                              }}
                            >
                              OLLAMA IA
                            </div>
                            <div
                              className="h-7 rounded flex items-center justify-center text-[0.625rem] font-bold"
                              style={{
                                backgroundColor: t.swatches.accent,
                                color: t.swatches.bg,
                              }}
                            >
                              MAPAS
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <span style={{ color: t.swatches.accent }}>
                            {getThemeIcon(t.id, 'size-5')}
                          </span>
                          <h3
                            className="text-lg font-bold leading-snug"
                            style={{ color: t.swatches.text }}
                          >
                            {t.name}
                          </h3>
                        </div>
                        <p
                          className="text-xs font-semibold mt-0.5"
                          style={{ color: t.swatches.accent }}
                        >
                          {t.subtitle}
                        </p>
                        <p
                          className="text-xs mt-2 leading-relaxed opacity-85"
                          style={{ color: t.swatches.text }}
                        >
                          {t.description}
                        </p>
                      </div>
                    </div>

                    {/* Swatches Footer */}
                    <div
                      className="px-4 py-3 border-t flex items-center justify-between"
                      style={{
                        backgroundColor: t.swatches.bg,
                        borderColor: 'rgba(150, 150, 150, 0.15)',
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {Object.values(t.swatches).map((hex, i) => (
                          <span
                            key={i}
                            className="h-4 w-4 rounded-full border border-white/25"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: isSelected ? t.swatches.accent : t.swatches.primary }}
                      >
                        {isSelected ? '✓ Selecionado' : 'Ativar Tema →'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Home Layout Style Selector */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
              <IconLayoutDashboard className="size-5 text-desert-green" />
              <span>Estrutura da Tela Inicial (Centro de Comando)</span>
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Defina como os módulos da página inicial (`/home`) são apresentados: no formato de
              Posto de Comando Tático (`MIL-STD-810H`) ou na Grade Clássica do NOMAD.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {HOME_LAYOUT_OPTIONS.map((opt) => {
                const active = homeLayout === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHomeLayout(opt.id)}
                    className={`text-left rounded-lg border-2 p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'border-desert-orange bg-surface-primary shadow-lg'
                        : 'border-border-default bg-surface-secondary hover:border-desert-green'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-desert-green">
                          {opt.subtitle}
                        </span>
                        {active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-desert-orange text-white text-[0.625rem] font-bold">
                            <IconCheck className="size-3" /> ATIVO
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        {opt.id === 'classic' ? (
                          <IconLayoutGrid className="size-4 text-desert-green shrink-0" />
                        ) : (
                          <IconShieldCheck className="size-4 text-desert-green shrink-0" />
                        )}
                        <span>{opt.title}</span>
                      </h3>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* UI Scale Selector */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
              <IconSparkles className="size-5 text-desert-green" />
              <span>Escala da Interface (Zoom Nativo do N.O.M.A.D.)</span>
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Controla o tamanho proporcional de todas as telas, fontes, ícones e cartões mesmo com o navegador em 100%.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {UI_SCALE_OPTIONS.map((opt) => {
                const active = uiScale === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUiScale(opt.id)}
                    className={`text-left rounded-lg border-2 p-4 transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'border-desert-orange bg-surface-primary shadow-lg'
                        : 'border-border-default bg-surface-secondary hover:border-desert-green'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-desert-green">
                          {opt.subtitle}
                        </span>
                        {active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-desert-orange text-white text-[0.625rem] font-bold">
                            <IconCheck className="size-3" /> ATIVO
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-text-primary">{opt.title}</h3>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </SettingsLayout>
  )
}

