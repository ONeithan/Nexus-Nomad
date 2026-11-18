/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import ModalsProvider from '~/providers/ModalProvider'
import { TransmitProvider } from 'react-adonis-transmit'
import { generateUUID } from '~/lib/util'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import NotificationsProvider from '~/providers/NotificationProvider'
import { ThemeProvider } from '~/providers/ThemeProvider'
import { UsePageProps } from '../../types/system'

const appName = import.meta.env.VITE_APP_NAME || 'Nexus Project NOMAD'
const queryClient = new QueryClient()

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Erro inesperado de renderização.' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Erro capturado na interface:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-desert-sand text-text-primary">
          <div className="w-full max-w-lg rounded-xl border border-desert-red/50 bg-surface-primary p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-desert-red uppercase tracking-wide">
              Falha temporária ao renderizar esta tela
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Ocorreu um erro na interface ou durante uma reconexão do servidor. Use uma das ações abaixo para recuperar imediatamente:
            </p>
            {this.state.errorMessage && (
              <pre className="p-3 rounded bg-surface-secondary border border-border-default text-[0.6875rem] font-mono text-text-muted overflow-x-auto whitespace-pre-wrap">
                {this.state.errorMessage}
              </pre>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/home'
                }}
                className="px-4 py-2 rounded-lg bg-desert-green text-white text-xs font-bold cursor-pointer hover:opacity-90"
              >
                Ir para o Início
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.reload()
                }}
                className="px-4 py-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary text-xs font-semibold cursor-pointer hover:border-desert-tan"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Patch the global crypto object for non-HTTPS/localhost contexts
if (!window.crypto?.randomUUID) {
  // @ts-ignore
  if (!window.crypto) window.crypto = {}
  // @ts-ignore
  window.crypto.randomUUID = generateUUID
}

createInertiaApp({
  progress: { color: '#424420' },

  title: (title) => (title ? `${title} - ${appName}` : appName),

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    const environment = (props.initialPage.props as unknown as UsePageProps).environment
    const showDevtools = ['development', 'staging'].includes(environment)
    createRoot(el).render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TransmitProvider baseUrl={window.location.origin} enableLogging={environment === 'development'}>
            <NotificationsProvider>
              <ModalsProvider>
                <AppErrorBoundary>
                  <App {...props} />
                </AppErrorBoundary>
                {showDevtools && <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />}
              </ModalsProvider>
            </NotificationsProvider>
          </TransmitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  },
})
