import StyledSectionHeader from '~/components/StyledSectionHeader'
import Switch from '~/components/inputs/Switch'
import api from '~/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '~/context/NotificationContext'
import { useAppAutoUpdateStatus } from '~/hooks/useAppAutoUpdateStatus'

export default function AppAutoUpdateSection() {
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()
  const { data: status, isLoading } = useAppAutoUpdateStatus()

  const enabled = status?.enabled ?? false

  const toggleMutation = useMutation({
    mutationFn: (value: boolean) => api.updateSetting('appAutoUpdate.enabled', value),
    onSuccess: (_data, value) => {
      queryClient.invalidateQueries({ queryKey: ['app-auto-update-status'] })
      addNotification({
        type: 'success',
        message: value ? 'App automatic updates enabled.' : 'App automatic updates disabled.',
      })
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update app auto-update setting.' })
    },
  })

  return (
    <>
      <StyledSectionHeader title="Atualização Automática de Aplicativos" className="mt-8" />
      <div className="bg-surface-primary rounded-lg border shadow-md overflow-hidden mt-6 p-6">
        <Switch
          checked={enabled}
          onChange={(value) => toggleMutation.mutate(value)}
          disabled={toggleMutation.isPending || isLoading}
          label="Ativar Atualizações Automáticas de Aplicativos"
          description="Instala automaticamente atualizações de versão menor e correções dos aplicativos selecionados (ative individualmente em cada app na Central de Aplicativos). Versões maiores sempre exigem atualização manual."
        />

        {enabled && status && (
          <div className="mt-6 pt-4 border-t border-desert-stone-light text-sm">
            <p className="text-desert-stone mb-3">
              <span className="font-medium">Janela de atualização: </span>
              {status.windowStart}–{status.windowEnd} (
              {status.withinWindow ? 'dentro da janela' : 'fora da janela'}); intervalo de resfriamento{' '}
              {status.cooloffHours}h.
              {status.lastResult && (
                <>
                  {' '}
                  <span className="font-medium">Última execução: </span>
                  {status.lastResult}
                  {status.lastAttemptAt
                    ? ` (${new Date(status.lastAttemptAt).toLocaleString('pt-BR')})`
                    : ''}
                </>
              )}
            </p>

            {status.apps.length === 0 ? (
              <p className="text-desert-stone-dark">
                Nenhum aplicativo ativado ainda. Ative a atualização automática individualmente nos apps na Central de Aplicativos.
              </p>
            ) : (
              <ul className="space-y-2">
                {status.apps.map((app) => (
                  <li
                    key={app.service_name}
                    className="flex items-start justify-between gap-4 rounded-md bg-surface-secondary px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {app.friendly_name || app.service_name}
                      </p>
                      <p className="text-desert-stone">
                        {app.current_version}
                        {app.available_update_version
                          ? ` → ${app.available_update_version}`
                          : ' (up to date)'}
                      </p>
                      {app.auto_disabled_reason && (
                        <p className="text-desert-red mt-0.5">{app.auto_disabled_reason}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        app.eligible ? 'text-desert-green' : 'text-desert-stone'
                      }`}
                    >
                      {app.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  )
}
