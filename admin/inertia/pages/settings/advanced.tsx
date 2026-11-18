import { Head } from '@inertiajs/react'
import { useState } from 'react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import Alert from '~/components/Alert'
import Input from '~/components/inputs/Input'
import { useNotifications } from '~/context/NotificationContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '~/lib/api'
import {
  IconCheck,
  IconInfoCircle,
  IconRefresh,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react'

export default function AdvancedPage(props: {
  advanced: {
    internetStatusTestUrl: string
    internetStatusTestUrlEnvOverride: boolean
  }
}) {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { internetStatusTestUrlEnvOverride } = props.advanced

  const [internetStatusTestUrl, setInternetStatusTestUrl] = useState(
    props.advanced.internetStatusTestUrl ?? ''
  )
  const [testUrlError, setTestUrlError] = useState<string | null>(null)
  const [connectivityResult, setConnectivityResult] = useState<{
    checked: boolean
    online: boolean
  } | null>(null)

  // Mirror the backend validation (admin/app/validators/settings.ts) for instant
  // feedback. The backend remains the source of truth and returns 422 on failure.
  function validateTestUrl(value: string): string | null {
    if (value.trim() === '') return null // empty clears the setting
    try {
      const url = new URL(value)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'A URL de teste deve usar http ou https.'
      }
    } catch {
      return 'A URL de teste deve ser uma URL válida (ex.: "https://exemplo.com").'
    }
    return null
  }

  const updateTestUrlMutation = useMutation({
    mutationFn: async (value: string) => {
      return await api.updateSetting('system.internetStatusTestUrl', value)
    },
    onSuccess: () => {
      setConnectivityResult(null)
      queryClient.invalidateQueries({ queryKey: ['internetStatus'] })
      addNotification({ message: 'Configuração atualizada com sucesso.', type: 'success' })
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Ocorreu um erro ao atualizar a configuração. Tente novamente.'
      setTestUrlError(msg)
      addNotification({ message: msg, type: 'error' })
    },
  })

  const testConnectivityMutation = useMutation({
    mutationFn: async () => {
      const res = await api.getInternetStatus()
      return Boolean(res)
    },
    onSuccess: (online) => {
      setConnectivityResult({ checked: true, online })
      queryClient.setQueryData(['internetStatus'], online)
      addNotification({
        message: online
          ? 'Conectividade confirmada: o servidor está alcançando a URL configurada.'
          : 'Sem resposta HTTP do endpoint de teste. Verifique sua rede ou a URL informada.',
        type: online ? 'success' : 'error',
      })
    },
  })

  function handleSaveTestUrl() {
    const trimmed = internetStatusTestUrl.trim()
    const validationError = validateTestUrl(trimmed)
    if (validationError) {
      setTestUrlError(validationError)
      return
    }
    setTestUrlError(null)
    updateTestUrlMutation.mutate(trimmed)
  }

  function handleRestoreDefault() {
    setInternetStatusTestUrl('')
    setTestUrlError(null)
    updateTestUrlMutation.mutate('')
  }

  return (
    <SettingsLayout>
      <Head title="Configurações Avançadas | Project NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <h1 className="text-4xl font-semibold mb-4">Configurações Avançadas</h1>
          <p className="text-text-muted mb-4">
            Configurações avançadas para operadores. Estas opções são opcionais — os padrões
            funcionam para a maioria das instalações.
          </p>

          <StyledSectionHeader title="Conectividade" className="mt-8 mb-4" />
          <div className="bg-surface-primary rounded-lg border-2 border-border-subtle p-6 space-y-5">
            <p className="text-sm text-text-secondary">
              O NOMAD verifica periodicamente se consegue acessar a internet. Por padrão, ele
              consulta o endpoint utilitário da Cloudflare com algumas alternativas de fallback.
              Defina um endpoint personalizado abaixo caso sua rede bloqueie os padrões. Deixe em
              branco para usar os padrões integrados.
            </p>

            {internetStatusTestUrlEnvOverride && (
              <Alert
                type="info"
                variant="bordered"
                title="Gerenciado por variável de ambiente"
                message="A variável de ambiente INTERNET_STATUS_TEST_URL está definida e tem prioridade sobre esta configuração. Remova-a para gerenciar a URL de teste por aqui."
              />
            )}

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <Input
                  name="internetStatusTestUrl"
                  label="URL de Teste de Conexão com a Internet"
                  helpText="Uma única URL http(s) usada para verificar a conectividade. Qualquer resposta HTTP conta como online."
                  placeholder="https://1.1.1.1/cdn-cgi/trace"
                  value={internetStatusTestUrl}
                  disabled={internetStatusTestUrlEnvOverride}
                  error={Boolean(testUrlError)}
                  onChange={(e) => {
                    setInternetStatusTestUrl(e.target.value)
                    setTestUrlError(null)
                  }}
                />
                {testUrlError && <p className="text-sm text-red-600 mt-1">{testUrlError}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5 shrink-0">
                <StyledButton
                  variant="primary"
                  onClick={handleSaveTestUrl}
                  loading={updateTestUrlMutation.isPending}
                  disabled={updateTestUrlMutation.isPending || internetStatusTestUrlEnvOverride}
                >
                  Salvar
                </StyledButton>
                {internetStatusTestUrl.trim() !== '' && !internetStatusTestUrlEnvOverride && (
                  <StyledButton
                    variant="secondary"
                    onClick={handleRestoreDefault}
                    disabled={updateTestUrlMutation.isPending}
                  >
                    Restaurar Padrão
                  </StyledButton>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2.5 text-xs">
                <StyledButton
                  variant="secondary"
                  icon="IconRefresh"
                  loading={testConnectivityMutation.isPending}
                  onClick={() => testConnectivityMutation.mutate()}
                >
                  Testar Conexão Agora
                </StyledButton>
                {connectivityResult?.checked && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${
                      connectivityResult.online
                        ? 'bg-desert-green/15 text-desert-green border-desert-green/30'
                        : 'bg-desert-red/15 text-desert-red border-desert-red/30'
                    }`}
                  >
                    {connectivityResult.online ? (
                      <>
                        <IconWifi className="size-3.5" />
                        Online — Endpoint respondendo
                      </>
                    ) : (
                      <>
                        <IconWifiOff className="size-3.5" />
                        Offline / Bloqueado no momento
                      </>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted font-mono">
                Modo ativo:{' '}
                {internetStatusTestUrlEnvOverride
                  ? 'Variável de ambiente'
                  : internetStatusTestUrl.trim()
                    ? 'URL personalizada exclusiva'
                    : 'Padrões integrados (3 endpoints)'}
              </span>
            </div>
          </div>

          <StyledSectionHeader title="Como Funciona e Quando Usar" className="mt-8 mb-4" />
          <div className="bg-surface-primary rounded-lg border border-border-default p-6 space-y-5 text-sm text-text-secondary">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="size-5 text-desert-orange shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold text-text-primary">
                  O que essa configuração controla na prática?
                </h3>
                <p>
                  Sempre que você acessa o <strong>Depósito de Suprimentos</strong> ou gera um
                  pacote de diagnóstico em <strong>Sistema &amp; Discos</strong>, o servidor do
                  N.O.M.A.D. testa rapidamente se há saída para a internet antes de liberar ações
                  online (como o botão <em>Verificar Atualizações</em> dos aplicativos).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-lg border border-border-default bg-surface-secondary p-4 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-desert-green">
                  <IconCheck className="size-4" />
                  1. Uso Comum (Recomendado)
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Deixe o campo em branco</strong> e clique em Salvar se já estiver vazio.
                  Sem URL personalizada, o N.O.M.A.D. testa em paralelo 3 endereços confiáveis (
                  <code className="font-mono">1.1.1.1/cdn-cgi/trace</code>,{' '}
                  <code className="font-mono">api.github.com</code> e{' '}
                  <code className="font-mono">api.projectnomad.us</code>). Basta qualquer um deles
                  responder para constar como <strong>Online</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-border-default bg-surface-secondary p-4 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-desert-orange">
                  <IconRefresh className="size-4" />
                  2. Rede Restrita / VPN / Firewall
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Se sua rede ou provedor bloqueia Cloudflare e GitHub (fazendo o Depósito avisar
                  que está sem internet mesmo conectado), informe acima uma{' '}
                  <strong>URL http(s) liberada</strong> na sua rede (ex.:{' '}
                  <code className="font-mono">https://www.google.com/generate_204</code> ou um
                  endereço interno de verificação HTTP), salve e clique em{' '}
                  <em>Testar Conexão Agora</em>.
                </p>
              </div>

              <div className="rounded-lg border border-border-default bg-surface-secondary p-4 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-primary">
                  <IconWifiOff className="size-4" />
                  3. Operação 100% Off-Grid
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Em servidor desconectado da internet, <strong>não precisa configurar nada aqui</strong>.
                  O aviso de offline no Depósito apenas evita tentativas inúteis de atualização online
                  — seus ZIMs, mapas offline, livros e IA local continuam funcionando normalmente.
                </p>
              </div>
            </div>

            <p className="text-xs text-text-muted pt-1 border-t border-border-subtle">
              <strong>Atenção:</strong> Ao salvar uma URL personalizada, o N.O.M.A.D. consulta{' '}
              <strong>exclusivamente</strong> esse endereço (os 3 fallbacks padrão deixam de ser
              usados até que você apague o campo ou clique em <em>Restaurar Padrão</em>).
            </p>
          </div>
        </main>
      </div>
    </SettingsLayout>
  )
}
