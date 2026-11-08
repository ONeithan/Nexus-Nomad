import { Head } from '@inertiajs/react'
import { useState } from 'react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import Alert from '~/components/Alert'
import Input from '~/components/inputs/Input'
import { useNotifications } from '~/context/NotificationContext'
import { useMutation } from '@tanstack/react-query'
import api from '~/lib/api'

export default function AdvancedPage(props: {
  advanced: {
    internetStatusTestUrl: string
    internetStatusTestUrlEnvOverride: boolean
  }
}) {
  const { addNotification } = useNotifications()
  const { internetStatusTestUrlEnvOverride } = props.advanced

  const [internetStatusTestUrl, setInternetStatusTestUrl] = useState(
    props.advanced.internetStatusTestUrl ?? ''
  )
  const [testUrlError, setTestUrlError] = useState<string | null>(null)

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
          <div className="bg-surface-primary rounded-lg border-2 border-border-subtle p-6">
            <p className="text-sm text-text-secondary mb-4">
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
                className="!mb-4"
              />
            )}

            <div className="flex items-end gap-3">
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
              <StyledButton
                variant="primary"
                onClick={handleSaveTestUrl}
                loading={updateTestUrlMutation.isPending}
                disabled={updateTestUrlMutation.isPending || internetStatusTestUrlEnvOverride}
                className="mb-0.5"
              >
                Salvar
              </StyledButton>
            </div>
          </div>
        </main>
      </div>
    </SettingsLayout>
  )
}
