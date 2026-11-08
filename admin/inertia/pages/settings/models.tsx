import { Head, router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'
import StyledTable from '~/components/StyledTable'
import SettingsLayout from '~/layouts/SettingsLayout'
import { NomadOllamaModel } from '../../../types/ollama'
import StyledButton from '~/components/StyledButton'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import Alert from '~/components/Alert'
import { useNotifications } from '~/context/NotificationContext'
import api from '~/lib/api'
import { useModals } from '~/context/ModalContext'
import StyledModal from '~/components/StyledModal'
import type { NomadInstalledModel } from '../../../types/ollama'
import { SERVICE_NAMES } from '../../../constants/service_names'
import { RAG_MIN_RELEVANCE_PRESETS, RESPONSE_STYLE_PRESETS } from '../../../constants/ollama'
import Switch from '~/components/inputs/Switch'
import Select from '~/components/inputs/Select'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Input from '~/components/inputs/Input'
import { IconSearch, IconRefresh } from '@tabler/icons-react'
import { formatBytes } from '~/lib/util'
import useDebounce from '~/hooks/useDebounce'
import ActiveModelDownloads from '~/components/ActiveModelDownloads'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import GpuPassthroughAlert from '~/components/GpuPassthroughAlert'

export default function ModelsPage(props: {
  models: {
    availableModels: NomadOllamaModel[]
    installedModels: NomadInstalledModel[]
    settings: { chatSuggestionsEnabled: boolean; aiAssistantCustomName: string; remoteOllamaUrl: string; ollamaFlashAttention: boolean; autoThinking: boolean; tasksModel: string; ragEnabled: boolean; contextWindow: string; minRelevance: number; relevanceCheck: boolean; responseStyle: string }
    /** Effective window per installed model, as resolved by ContextWindowService. */
    resolvedContextWindows?: Record<string, number>
  }
}) {
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const { isInstalled } = useServiceInstalledStatus(SERVICE_NAMES.OLLAMA)
  const { addNotification } = useNotifications()
  const { openModal, closeAllModals } = useModals()
  const { debounce } = useDebounce()
  const { data: systemInfo } = useSystemInfo({})
  const queryClient = useQueryClient()

  const [chatSuggestionsEnabled, setChatSuggestionsEnabled] = useState(
    props.models.settings.chatSuggestionsEnabled
  )
  const [ollamaFlashAttention, setOllamaFlashAttention] = useState(
    props.models.settings.ollamaFlashAttention
  )
  const [autoThinking, setAutoThinking] = useState(props.models.settings.autoThinking)
  const [ragEnabled, setRagEnabled] = useState(props.models.settings.ragEnabled)
  const [tasksModel, setTasksModel] = useState(props.models.settings.tasksModel)
  const [contextWindow, setContextWindow] = useState(props.models.settings.contextWindow)
  const [minRelevance, setMinRelevance] = useState(String(props.models.settings.minRelevance))
  const [relevanceCheck, setRelevanceCheck] = useState(props.models.settings.relevanceCheck)
  const [responseStyle, setResponseStyle] = useState(props.models.settings.responseStyle)
  const [aiAssistantCustomName, setAiAssistantCustomName] = useState(
    props.models.settings.aiAssistantCustomName
  )
  const [remoteOllamaUrl, setRemoteOllamaUrl] = useState(props.models.settings.remoteOllamaUrl)
  const [remoteOllamaError, setRemoteOllamaError] = useState<string | null>(null)
  const [remoteOllamaSaving, setRemoteOllamaSaving] = useState(false)

  async function handleSaveRemoteOllama() {
    setRemoteOllamaError(null)
    setRemoteOllamaSaving(true)
    try {
      const res = await api.configureRemoteOllama(remoteOllamaUrl || null)
      if (res?.success) {
        addNotification({ message: res.message, type: 'success' })
        router.reload()
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to configure remote Ollama.'
      setRemoteOllamaError(msg)
    } finally {
      setRemoteOllamaSaving(false)
    }
  }

  async function handleClearRemoteOllama() {
    setRemoteOllamaError(null)
    setRemoteOllamaSaving(true)
    try {
      const res = await api.configureRemoteOllama(null)
      if (res?.success) {
        setRemoteOllamaUrl('')
        addNotification({ message: 'Remote Ollama configuration cleared.', type: 'success' })
        router.reload()
      }
    } catch (error: any) {
      setRemoteOllamaError(error?.message || 'Failed to clear remote Ollama.')
    } finally {
      setRemoteOllamaSaving(false)
    }
  }

  const [query, setQuery] = useState('')
  const [queryUI, setQueryUI] = useState('')
  const [limit, setLimit] = useState(15)

  const debouncedSetQuery = debounce((val: string) => {
    setQuery(val)
  }, 300)

  const forceRefreshRef = useRef(false)
  const [isForceRefreshing, setIsForceRefreshing] = useState(false)

  const { data: availableModelData, isFetching, refetch } = useQuery({
    queryKey: ['ollama', 'availableModels', query, limit],
    queryFn: async () => {
      const force = forceRefreshRef.current
      forceRefreshRef.current = false
      const res = await api.getAvailableModels({
        query,
        recommendedOnly: false,
        limit,
        force: force || undefined,
      })
      if (!res) {
        return {
          models: [],
          hasMore: false,
        }
      }
      return res
    },
    initialData: { models: props.models.availableModels, hasMore: false },
  })

  async function handleForceRefresh() {
    forceRefreshRef.current = true
    setIsForceRefreshing(true)
    await refetch()
    setIsForceRefreshing(false)
    addNotification({ message: 'Model list refreshed from remote.', type: 'success' })
  }

  async function handleInstallModel(modelName: string) {
    try {
      const res = await api.downloadModel(modelName)
      if (res.success) {
        addNotification({
          message: `Model download initiated for ${modelName}. It may take some time to complete.`,
          type: 'success',
        })
      }
    } catch (error) {
      console.error('Error installing model:', error)
      addNotification({
        message: `Ocorreu um erro ao instalar o modelo ${modelName}. Tente novamente.`,
        type: 'error',
      })
    }
  }

  async function handleDeleteModel(modelName: string) {
    try {
      const res = await api.deleteModel(modelName)
      if (res.success) {
        addNotification({
          message: `Modelo excluído: ${modelName}.`,
          type: 'success',
        })
      }
      closeAllModals()
      router.reload()
    } catch (error) {
      console.error('Error deleting model:', error)
      addNotification({
        message: `Ocorreu um erro ao excluir o modelo ${modelName}. Tente novamente.`,
        type: 'error',
      })
    }
  }

  async function confirmDeleteModel(model: string) {
    openModal(
      <StyledModal
        title="Excluir Modelo?"
        onConfirm={() => {
          handleDeleteModel(model)
        }}
        onCancel={closeAllModals}
        open={true}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="primary"
      >
        <p className="text-text-primary">
          Tem certeza de que deseja excluir este modelo? Você precisará baixá-lo novamente caso deseje
          utilizá-lo no futuro.
        </p>
      </StyledModal>,
      'confirm-delete-model-modal'
    )
  }

  // A model can be deleted after being picked here. Surface the stale name as a
  // disabled option instead of letting the select silently render empty — the
  // backend already falls back to the chat model at call time.
  const contextWindowOptions = [
    { value: 'auto', label: 'Automático (recomendado)' },
    { value: '4096', label: '4K tokens' },
    { value: '8192', label: '8K tokens' },
    { value: '16384', label: '16K tokens' },
    { value: '32768', label: '32K tokens' },
    { value: '65536', label: '64K tokens' },
    { value: '131072', label: '128K tokens' },
  ]

  const minRelevanceOptions = [
    ...RAG_MIN_RELEVANCE_PRESETS.map((preset) => ({
      value: String(preset.value),
      label: preset.label,
    })),
    ...(RAG_MIN_RELEVANCE_PRESETS.some((p) => String(p.value) === minRelevance)
      ? []
      : [{ value: minRelevance, label: `Personalizado (${minRelevance})`, disabled: true }]),
  ]

  const responseStyleOptions = RESPONSE_STYLE_PRESETS.map((preset) => ({
    value: preset.value,
    label: preset.label,
  }))

  const resolvedWindows = props.models.resolvedContextWindows ?? {}
  const formatWindow = (tokens: number) =>
    tokens >= 1024 ? `${Math.round(tokens / 1024)}K` : String(tokens)

  const tasksModelOptions = [
    { value: '', label: 'Usar o modelo do chat' },
    ...props.models.installedModels.map((model) => ({ value: model.name, label: model.name })),
    ...(tasksModel && !props.models.installedModels.some((m) => m.name === tasksModel)
      ? [{ value: tasksModel, label: `${tasksModel} (não instalado)`, disabled: true }]
      : []),
  ]

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean | string }) => {
      return await api.updateSetting(key, value)
    },
    onSuccess: (_data, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['system-setting', key] })
      addNotification({
        message: 'Configuração atualizada com sucesso.',
        type: 'success',
      })
    },
    onError: (error) => {
      console.error('Error updating setting:', error)
      addNotification({
        message: 'Ocorreu um erro ao atualizar a configuração. Tente novamente.',
        type: 'error',
      })
    },
  })

  return (
    <SettingsLayout>
      <Head title="Modelos & IA Remota | Nexus NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6">
          <h1 className="text-4xl font-semibold text-desert-green mb-3">
            {aiAssistantName && aiAssistantName !== 'AI Assistant'
              ? aiAssistantName
              : 'Assistente de IA & Modelos'}
          </h1>
          <p className="text-text-muted mb-6">
            Gerencie modelos locais do Ollama, ajuste a Base de Conhecimento (RAG) ou conecte o
            NOMAD a qualquer servidor compatível com Ollama ou API OpenAI na sua rede.
          </p>

          <StyledSectionHeader title="Conexão Remota (Opcional — Ollama / API OpenAI)" className="mt-4 mb-4" />
          <div className="bg-surface-primary rounded-lg border-2 border-border-subtle p-6 mb-8 shadow-sm">
            <p className="text-sm text-text-secondary mb-4">
              Conecte a qualquer servidor compatível com Ollama ou API OpenAI (Ollama remoto, LM
              Studio, llama.cpp e outros). Para instâncias remotas do Ollama, inicie o servidor com{' '}
              <code className="bg-surface-secondary px-1.5 py-0.5 rounded font-mono">
                OLLAMA_HOST=0.0.0.0
              </code>
              .
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <Input
                  name="remoteOllamaUrl"
                  label="URL do Servidor Remoto Ollama / OpenAI na LAN"
                  placeholder="http://192.168.1.100:11434  (ou :1234 para LM Studio / API OpenAI)"
                  value={remoteOllamaUrl}
                  onChange={(e) => {
                    setRemoteOllamaUrl(e.target.value)
                    setRemoteOllamaError(null)
                  }}
                />
                {remoteOllamaError && (
                  <p className="text-sm text-red-600 mt-1">{remoteOllamaError}</p>
                )}
              </div>
              <StyledButton
                variant="primary"
                onClick={handleSaveRemoteOllama}
                loading={remoteOllamaSaving}
                disabled={remoteOllamaSaving || !remoteOllamaUrl}
                className="mb-0.5"
              >
                Salvar e Testar
              </StyledButton>
              {props.models.settings.remoteOllamaUrl && (
                <StyledButton
                  variant="danger"
                  onClick={handleClearRemoteOllama}
                  loading={remoteOllamaSaving}
                  disabled={remoteOllamaSaving}
                  className="mb-0.5"
                >
                  Desconectar
                </StyledButton>
              )}
            </div>
          </div>

          {!isInstalled && !props.models.settings.remoteOllamaUrl && (
            <Alert
              title="Nenhum servidor de IA conectado ainda. Informe acima a URL do seu Ollama remoto na LAN e clique em 'Salvar e Testar'."
              type="warning"
              variant="solid"
              className="!mt-2 !mb-6"
            />
          )}
          {isInstalled && (
            <GpuPassthroughAlert
              gpuHealth={systemInfo?.gpuHealth}
              assistantName={aiAssistantName}
              className="!mt-6"
            />
          )}

          <StyledSectionHeader title="Ajustes do Assistente e Base de Conhecimento (RAG)" className="mt-8 mb-4" />
          <div className="bg-surface-primary rounded-lg border-2 border-border-subtle p-6">
            <div className="space-y-4">
              <Switch
                checked={chatSuggestionsEnabled}
                onChange={(newVal) => {
                  setChatSuggestionsEnabled(newVal)
                  updateSettingMutation.mutate({ key: 'chat.suggestionsEnabled', value: newVal })
                }}
                label="Sugestões de Conversa"
                description="Exibe tópicos sugeridos pela IA para iniciar conversas na interface de chat"
              />
              <Switch
                checked={ollamaFlashAttention}
                onChange={(newVal) => {
                  setOllamaFlashAttention(newVal)
                  updateSettingMutation.mutate({ key: 'ai.ollamaFlashAttention', value: newVal })
                }}
                label="Flash Attention"
                description="Ativa OLLAMA_FLASH_ATTENTION=1 para maior eficiência de memória. Desative se notar instabilidade. Entra em vigor após reiniciar o Assistente de IA."
              />
              <Switch
                checked={autoThinking}
                onChange={(newVal) => {
                  setAutoThinking(newVal)
                  updateSettingMutation.mutate({ key: 'ai.autoThinking', value: newVal })
                }}
                label="Usar raciocínio automaticamente quando o modelo suportar"
                description="Define o padrão para modelos que suportam pensamento/raciocínio. Você ainda pode ativar ou desativar o raciocínio individualmente na janela do chat."
              />
              <Switch
                checked={ragEnabled}
                onChange={(newVal) => {
                  setRagEnabled(newVal)
                  updateSettingMutation.mutate({ key: 'rag.enabled', value: newVal })
                }}
                label="Busca na Base de Conhecimento (RAG)"
                description="Pesquisa documentos relevantes na sua base de conhecimento antes de responder. Desative para economizar memória e acelerar respostas caso sua base seja pequena ou vazia."
              />
              <Input
                name="aiAssistantCustomName"
                label="Nome do Assistente"
                helpText="Dê um nome personalizado ao seu assistente de IA para ser exibido na interface de chat e no sistema."
                placeholder="Assistente de IA"
                value={aiAssistantCustomName}
                onChange={(e) => setAiAssistantCustomName(e.target.value)}
                onBlur={() =>
                  updateSettingMutation.mutate({
                    key: 'ai.assistantCustomName',
                    value: aiAssistantCustomName,
                  })
                }
              />
              <Select
                name="tasksModel"
                label="Modelo de Tarefas (Background)"
                helpText="Modelo leve e rápido usado para tarefas secundárias em segundo plano, como gerar títulos de chat e sugestões. Deixe configurado para usar o modelo do chat para seguir o mesmo modelo ativo."
                value={tasksModel}
                options={tasksModelOptions}
                onChange={(newVal) => {
                  setTasksModel(newVal)
                  updateSettingMutation.mutate({ key: 'ai.tasksModel', value: newVal })
                }}
              />
              <Select
                name="minRelevance"
                label="Relevância da Base de Conhecimento"
                helpText="Quão estritamente um trecho da base deve corresponder à sua pergunta para ser usado na resposta. Ajustes mais estritos evitam trechos não relacionados; se for estrito demais, informações úteis podem ser descartadas."
                value={minRelevance}
                options={minRelevanceOptions}
                disabled={!ragEnabled}
                onChange={(newVal) => {
                  setMinRelevance(newVal)
                  updateSettingMutation.mutate({ key: 'rag.minRelevance', value: newVal })
                }}
              />
              <Switch
                checked={relevanceCheck}
                disabled={!ragEnabled}
                onChange={(newVal) => {
                  setRelevanceCheck(newVal)
                  updateSettingMutation.mutate({ key: 'rag.relevanceCheck', value: newVal })
                }}
                label="Verificação dupla de correspondência da base"
                description="Antes de responder, consulta o Modelo de Tarefas se os trechos encontrados realmente respondem à pergunta, descartando o que não for pertinente. Ajuda bastante em acervos grandes como Wikipédia ou Gutenberg."
              />
              <Select
                name="responseStyle"
                label="Estilo de Resposta"
                helpText="Define o comportamento criativo ou factual do assistente ao formular respostas. Automático segue a recomendação do autor do modelo. Focado produz respostas mais diretas e repetíveis. Criativo varia mais o vocabulário."
                value={responseStyle}
                options={responseStyleOptions}
                onChange={(newVal) => {
                  setResponseStyle(newVal)
                  updateSettingMutation.mutate({ key: 'ai.responseStyle', value: newVal })
                }}
              />
              <Select
                name="contextWindow"
                label="Janela de Contexto"
                helpText="Quantidade de contexto da conversa e documentos que cada resposta pode considerar. Automático dimensiona por modelo a partir do limite treinado e da memória disponível."
                value={contextWindow}
                options={contextWindowOptions}
                onChange={(newVal) => {
                  setContextWindow(newVal)
                  updateSettingMutation.mutate({ key: 'ai.contextWindow', value: newVal })
                }}
              />
              {Object.keys(resolvedWindows).length > 0 && (
                <p className="text-xs text-text-muted">
                  Atualmente em vigor:{' '}
                  {Object.entries(resolvedWindows)
                    .map(([name, tokens]) => `${name} → ${formatWindow(tokens)}`)
                    .join(', ')}
                  . As alterações entram em vigor para novas conversas.
                </p>
              )}
            </div>
          </div>

          <StyledSectionHeader title="Modelos Instalados" className="mt-12 mb-4" />
          <div className="bg-surface-primary rounded-lg border-2 border-border-subtle p-6">
            {props.models.installedModels.length === 0 ? (
              <p className="text-text-muted">
                Nenhum modelo instalado. Explore o catálogo abaixo para começar.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-border-subtle">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Parâmetros
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Tamanho no Disco
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {props.models.installedModels.map((model) => (
                    <tr key={model.name} className="hover:bg-surface-secondary">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-text-primary">{model.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">
                          {model.details?.parameter_size || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">
                          {formatBytes(model.size)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StyledButton
                          variant="danger"
                          size="sm"
                          onClick={() => confirmDeleteModel(model.name)}
                          icon="IconTrash"
                        >
                          Excluir
                        </StyledButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <ActiveModelDownloads withHeader />

          <StyledSectionHeader title="Catálogo de Modelos" className="mt-12 mb-4" />
          <Alert
            type="info"
            variant="bordered"
            title="O download de modelos é suportado ao usar o backend Ollama."
            message="Se você estiver conectado a um host de API OpenAI (ex: LM Studio), baixe os modelos diretamente nesse aplicativo."
            className="mb-4"
          />
          <div className="flex justify-start items-center gap-3 mt-4">
            <Input
              name="search"
              label=""
              placeholder="Pesquisar modelos de linguagem..."
              value={queryUI}
              onChange={(e) => {
                setQueryUI(e.target.value)
                debouncedSetQuery(e.target.value)
              }}
              className="w-1/3"
              leftIcon={<IconSearch className="w-5 h-5 text-text-muted" />}
            />
            <StyledButton
              variant="secondary"
              onClick={handleForceRefresh}
              icon="IconRefresh"
              loading={isForceRefreshing}
              className='mt-1'
            >
              Atualizar Catálogo
            </StyledButton>
          </div>
          <StyledTable<NomadOllamaModel>
            className="font-semibold mt-4"
            rowLines={true}
            columns={[
              {
                accessor: 'name',
                title: 'Nome',
                render(record) {
                  return (
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold">{record.name}</p>
                      <p className="text-sm text-text-muted">{record.description}</p>
                    </div>
                  )
                },
              },
              {
                accessor: 'estimated_pulls',
                title: 'Downloads Estimados',
              },
              {
                accessor: 'model_last_updated',
                title: 'Última Atualização',
              },
            ]}
            data={availableModelData?.models || []}
            loading={isFetching}
            expandable={{
              expandedRowRender: (record) => (
                <div className="pl-14">
                  <div className="bg-surface-primary overflow-hidden">
                    <table className="min-w-full divide-y divide-border-subtle">
                      <thead className="bg-surface-primary">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                            Tag
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                            Tipo de Entrada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                            Tamanho de Contexto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                            Tamanho do Modelo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface-primary divide-y divide-border-subtle">
                        {record.tags.map((tag, tagIndex) => {
                          const isInstalled = props.models.installedModels.some(
                            (mod) => mod.name === tag.name
                          )
                          return (
                            <tr key={tagIndex} className="hover:bg-surface-secondary">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-text-primary">
                                  {tag.name}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-text-secondary">{tag.input || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-text-secondary">
                                  {tag.context || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-text-secondary">{tag.size || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StyledButton
                                  variant={isInstalled ? 'danger' : 'primary'}
                                  onClick={() => {
                                    if (!isInstalled) {
                                      handleInstallModel(tag.name)
                                    } else {
                                      confirmDeleteModel(tag.name)
                                    }
                                  }}
                                  icon={isInstalled ? 'IconTrash' : 'IconDownload'}
                                >
                                  {isInstalled ? 'Excluir' : 'Instalar'}
                                </StyledButton>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            }}
          />
          <div className="flex justify-center mt-6">
            {availableModelData?.hasMore && (
              <StyledButton
                variant="primary"
                onClick={() => {
                  setLimit((prev) => prev + 15)
                }}
              >
                Carregar Mais
              </StyledButton>
            )}
          </div>
        </main>
      </div>
    </SettingsLayout>
  )
}
