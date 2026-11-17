import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  IconArrowRight,
  IconCheck,
  IconDatabase,
  IconFolder,
  IconFolderPlus,
  IconFile,
  IconLink,
  IconRefresh,
  IconServer,
  IconTrash,
  IconArrowUp,
  IconAlertTriangle,
  IconLoader2,
  IconX,
  IconRotateClockwise,
} from '@tabler/icons-react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import StyledButton from '~/components/StyledButton'
import StyledModal from '~/components/StyledModal'
import Alert from '~/components/Alert'
import { useNotifications } from '~/context/NotificationContext'
import { formatBytes } from '~/lib/util'
import { rebootNomadSystem } from '~/components/TacticalBootGate'

interface FolderUsageItem {
  name: string
  label: string
  path: string
  sizeBytes: number
  fileCount: number
}

interface MountTarget {
  label: string
  path: string
  freeBytes: number
  totalBytes: number
}

interface StorageFileEntry {
  name: string
  path: string
  isDirectory: boolean
  isSymlink: boolean
  sizeBytes: number
  modifiedAt: string
}

interface ConfirmMoveModalState {
  isOpen: boolean
  type: 'all' | 'single'
  targetDisk: MountTarget
  moduleKey?: string
  moduleName?: string
  sourcePath?: string
}

export default function SettingsStorage() {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()

  const [browsePath, setBrowsePath] = useState<string>('')
  const [moveModalFile, setMoveModalFile] = useState<StorageFileEntry | null>(null)
  const [moveDestDir, setMoveDestDir] = useState<string>('')
  const [keepSymlink, setKeepSymlink] = useState<boolean>(true)
  const [moving, setMoving] = useState<boolean>(false)
  const [movingItem, setMovingItem] = useState<string | null>(null)
  const [confirmMoveModal, setConfirmMoveModal] = useState<ConfirmMoveModalState | null>(null)
  const [newFolderName, setNewFolderName] = useState<string>('')

  // Samba state
  const [sambaEnabled, setSambaEnabled] = useState(false)
  const [sambaShareName, setSambaShareName] = useState('nomad-biblioteca')
  const [sambaUsername, setSambaUsername] = useState('nomad')
  const [sambaPassword, setSambaPassword] = useState('')
  const [sambaHostPath, setSambaHostPath] = useState('')
  const [sambaSaving, setSambaSaving] = useState(false)
  const [rebootModalOpen, setRebootModalOpen] = useState(false)

  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['storage-overview'],
    queryFn: async () => {
      const res = await axios.get<{
        storageRoot: string
        preferredDownloadDisk: string
        folderUsage: FolderUsageItem[]
        mountTargets: MountTarget[]
        unmountedDisks?: Array<{ name: string; size: string; model: string; vendor: string }>
      }>('/api/system/storage/overview')
      return res.data
    },
  })

  const { data: sambaStatus, refetch: refetchSamba } = useQuery({
    queryKey: ['samba-status'],
    queryFn: async () => {
      const res = await axios.get<{
        enabled: boolean
        containerRunning: boolean
        shareName: string
        username: string
        hostPath: string
      }>('/api/system/samba/status')
      return res.data
    },
  })

  useEffect(() => {
    if (sambaStatus) {
      setSambaEnabled(sambaStatus.enabled)
      setSambaShareName(sambaStatus.shareName || 'nomad-biblioteca')
      setSambaUsername(sambaStatus.username || 'nomad')
      setSambaHostPath(sambaStatus.hostPath || overview?.storageRoot || '')
    }
  }, [sambaStatus, overview?.storageRoot])

  useEffect(() => {
    if (overview?.storageRoot && !browsePath) {
      setBrowsePath(overview.storageRoot)
    }
  }, [overview?.storageRoot, browsePath])

  const {
    data: browseData,
    isLoading: browseLoading,
    refetch: refetchBrowse,
  } = useQuery({
    queryKey: ['storage-browse', browsePath],
    queryFn: async () => {
      const res = await axios.get<{
        currentPath: string
        parentPath: string | null
        entries: StorageFileEntry[]
      }>('/api/system/storage/browse', {
        params: browsePath ? { path: browsePath } : undefined,
      })
      return res.data
    },
    enabled: Boolean(browsePath || overview?.storageRoot),
  })

  const handleSetPreferredDisk = async (path: string) => {
    try {
      await axios.post('/api/system/storage/preferred-disk', { path })
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
      addNotification({ message: `Disco preferencial definido para: ${path}`, type: 'success' })
    } catch (err: any) {
      addNotification({ message: err?.response?.data?.error || 'Erro ao salvar preferência.', type: 'error' })
    }
  }

  const handleMoveConfirm = async () => {
    if (!moveModalFile || !moveDestDir) return
    setMoving(true)
    try {
      await axios.post('/api/system/storage/move', {
        sourcePath: moveModalFile.path,
        destDir: moveDestDir,
        createSymlink: keepSymlink,
      })
      addNotification({
        message: `"${moveModalFile.name}" movido para ${moveDestDir}${keepSymlink ? ' (link simbólico preservado para Kiwix/Kolibri)' : ''}.`,
        type: 'success',
      })
      setMoveModalFile(null)
      refetchBrowse()
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.error || 'Falha ao mover arquivo.',
        type: 'error',
      })
    } finally {
      setMoving(false)
    }
  }

  const executeConfirmedMove = async () => {
    if (!confirmMoveModal || !overview) return
    const { type, targetDisk, moduleKey, moduleName, sourcePath } = confirmMoveModal

    try {
      if (type === 'all') {
        setMovingItem(`all-${targetDisk.path}`)
        const MODULE_KEYS = ['zim', 'maps', 'kolibri-gen2', 'ollama', 'books', 'media', 'kb_uploads']
        let successCount = 0
        for (const k of MODULE_KEYS) {
          try {
            await axios.post('/api/system/storage/move', {
              sourcePath: `${overview.storageRoot}/${k}`,
              targetDiskPath: targetDisk.path,
            })
            successCount++
          } catch (e) {
            console.warn(`[Storage] Erro ao mover ${k}:`, e)
          }
        }
        addNotification({
          message: `${successCount} módulos de download mapeados para ${targetDisk.label}!`,
          type: 'success',
        })
      } else {
        if (!moduleKey || !sourcePath) return
        setMovingItem(moduleKey)
        const res = await axios.post('/api/system/storage/move', {
          sourcePath,
          targetDiskPath: targetDisk.path,
        })
        addNotification({
          message: res.data?.message || `${moduleName || moduleKey} mapeado com sucesso para ${targetDisk.label}!`,
          type: 'success',
        })
      }
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.error || `Falha ao mapear itens.`,
        type: 'error',
      })
    } finally {
      setMovingItem(null)
      setConfirmMoveModal(null)
      refetchOverview()
      refetchBrowse()
    }
  }

  const handleDeleteEntry = async (entry: StorageFileEntry) => {
    try {
      await axios.post('/api/system/storage/delete', { path: entry.path })
      addNotification({ message: `"${entry.name}" removido do disco.`, type: 'success' })
      refetchBrowse()
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] })
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.error || 'Falha ao remover item.',
        type: 'error',
      })
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !browseData?.currentPath) return
    try {
      await axios.post('/api/system/storage/mkdir', {
        parentDir: browseData.currentPath,
        name: newFolderName.trim(),
      })
      setNewFolderName('')
      refetchBrowse()
      addNotification({ message: 'Pasta criada com sucesso.', type: 'success' })
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.error || 'Falha ao criar pasta.',
        type: 'error',
      })
    }
  }

  const handleSaveSamba = async () => {
    setSambaSaving(true)
    try {
      const res = await axios.post('/api/system/samba/configure', {
        enabled: sambaEnabled,
        shareName: sambaShareName,
        username: sambaUsername,
        password: sambaPassword || 'nomad123',
        hostPath: sambaHostPath,
      })
      addNotification({
        message: res.data?.message || 'Configuração Samba atualizada.',
        type: res.data?.success ? 'success' : 'error',
      })
      refetchSamba()
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.error || 'Erro ao configurar servidor Samba.',
        type: 'error',
      })
    } finally {
      setSambaSaving(false)
    }
  }

  const hostIp = typeof window !== 'undefined' ? window.location.hostname : '192.168.x.x'

  return (
    <SettingsLayout>
      <Head title="Armazenamento, Arquivos & Samba — Nexus N.O.M.A.D." />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8 max-w-7xl space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <IconDatabase className="text-desert-tan" size={34} />
              <span>Armazenamento, Arquivos &amp; Samba</span>
            </h1>
            <p className="text-text-secondary">
              Inspecione o uso exato por pasta, mova bibliotecas entre discos (NVMe / HD externo) sem quebrar o Kiwix ou Kolibri, e compartilhe sua biblioteca via Samba (SMB) com o Portainer remoto.
            </p>
            <div className="mt-4 p-4 rounded-xl border border-desert-tan/30 bg-surface-secondary/70 text-xs text-text-secondary space-y-1.5">
              <p className="font-semibold text-text-primary">📌 Como usar esta central em 3 passos:</p>
              <p>1. <strong>Escolher onde baixar:</strong> Selecione o disco desejado em <em>Discos de Armazenamento</em> (NVMe ou HD secundário) para novos pacotes ZIM, mapas e conteúdos do Kolibri.</p>
              <p>2. <strong>Mover bibliotecas sem quebrar:</strong> No <em>Gerenciador de Arquivos</em> abaixo, clique em <strong>Mover para outro HD</strong> em qualquer pasta (<code className="text-desert-tan">/zim</code>, <code className="text-desert-tan">/kolibri-gen2</code>, <code className="text-desert-tan">/maps</code>). O NOMAD move os dados fisicamente e cria um link simbólico automático para o Kiwix e Kolibri continuarem lendo sem erro.</p>
              <p>3. <strong>Acessar pela rede / Portainer (Samba):</strong> Ative o Samba no final da página para montar <code className="text-desert-tan">\\{hostIp}\nomad</code> no Windows/Mac ou em containers remotos.</p>
            </div>
          </div>

          {/* 1. Raio-X de Uso por Pasta & Discos */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <StyledSectionHeader title="Raio-X de Uso de Disco &amp; Destino de Downloads" className="!mb-0" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRebootModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-desert-orange/50 bg-desert-orange/10 hover:bg-desert-orange hover:text-black text-xs font-bold text-desert-orange transition-colors cursor-pointer"
                >
                  <IconRotateClockwise size={14} />
                  <span>Reiniciar N.O.M.A.D.</span>
                </button>
                <StyledButton
                  size="sm"
                  icon="IconRefresh"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['storage-overview'] })}
                >
                  Atualizar
                </StyledButton>
              </div>
            </div>

            {overviewLoading ? (
              <p className="text-sm text-text-muted">Calculando tamanho das pastas...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unidades / Discos disponíveis */}
                <div className="p-4 rounded-xl border border-border-default bg-surface-primary space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Discos Disponíveis para Armazenamento
                  </h3>
                  <div className="space-y-2.5">
                    {overview?.mountTargets.map((disk) => {
                      const isPreferred = overview.preferredDownloadDisk === disk.path
                      return (
                        <div
                          key={disk.path}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                            isPreferred
                              ? 'border-desert-green bg-desert-green/10'
                              : 'border-border-subtle bg-surface-secondary'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-text-primary truncate">
                              {disk.label}
                            </div>
                            <div className="text-xs font-mono text-text-muted truncate">
                              {disk.path} • Livre: {formatBytes(disk.freeBytes, 1)} /{' '}
                              {formatBytes(disk.totalBytes, 1)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetPreferredDisk(disk.path)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 cursor-pointer ${
                              isPreferred
                                ? 'bg-desert-green text-white'
                                : 'border border-border-default bg-surface-primary text-text-primary hover:border-desert-orange'
                            }`}
                          >
                            {isPreferred ? 'Padrão Ativo' : 'Usar como Padrão'}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {overview?.unmountedDisks && overview.unmountedDisks.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg border border-desert-orange/40 bg-desert-orange/10 text-xs space-y-1.5">
                      <div className="font-bold text-desert-orange flex items-center gap-1.5">
                        <IconAlertTriangle size={15} />
                        <span>Discos Físicos Detectados no Host (Sem Partição Montada):</span>
                      </div>
                      {overview.unmountedDisks.map((ud) => (
                        <div key={ud.name} className="text-text-secondary pl-5">
                          • <strong className="text-text-primary">/dev/{ud.name}</strong> ({ud.size}) - {ud.vendor} {ud.model}
                          <span className="block text-[11px] text-text-muted mt-0.5">
                            Para usar este disco para downloads e dados, formate e monte-o no Linux do host (ex: <code className="text-desert-orange font-bold">/mnt/hd2</code>). Ele aparecerá como destino selecionável imediatamente.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ocupação por Pasta */}
                <div className="p-4 rounded-xl border border-border-default bg-surface-primary space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Ocupação por Pasta N.O.M.A.D.
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto themed-scrollbar pr-1">
                    {overview?.folderUsage.map((f) => (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => setBrowsePath(f.path)}
                        className="w-full text-left p-2.5 rounded-lg border border-border-subtle bg-surface-secondary hover:border-desert-tan flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text-primary truncate">
                            {f.label}
                          </div>
                          <div className="text-[11px] font-mono text-text-muted">
                            /{f.name} • {f.fileCount} arquivo(s)
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-desert-orange shrink-0">
                          {formatBytes(f.sizeBytes, 1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Central de Mapeamento de Discos de Download (Para TODOS os Módulos) */}
          {overview && overview.mountTargets.length > 0 && (
            <section className="rounded-xl border border-desert-green/40 bg-surface-primary p-6 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span className="text-xl">💾</span>
                    <span>Central de Mapeamento de Discos de Download (Para TODOS os Módulos)</span>
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Defina em qual HD cada categoria de download deve ser gravada (Kiwix/Wikipédia, Mapas, Kolibri, Modelos de IA, Livros, Mídia). O NOMAD move os dados e cria links simbólicos automáticos sem quebrar as aplicações.
                  </p>
                </div>

                {/* Ação Mestre: Mapear TUDO de uma vez */}
                <div className="flex items-center gap-2 shrink-0 bg-surface-secondary p-2.5 rounded-xl border border-border-default">
                  <span className="text-xs font-semibold text-text-primary">Mapear TUDO para:</span>
                  {overview.mountTargets.map((m) => {
                    const isThisAllMoving = movingItem === `all-${m.path}`
                    return (
                      <button
                        key={`map-all-${m.path}`}
                        type="button"
                        disabled={Boolean(movingItem)}
                        onClick={() => {
                          setConfirmMoveModal({
                            isOpen: true,
                            type: 'all',
                            targetDisk: m,
                          })
                        }}
                        className="px-3 py-1.5 rounded-lg bg-desert-green hover:bg-desert-green-dark text-white text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {isThisAllMoving ? (
                          <>
                            <IconLoader2 size={13} className="animate-spin" />
                            <span>Mapeando...</span>
                          </>
                        ) : (
                          <span>⚡ {m.label}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grade de Módulos Individuais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'zim', name: 'Biblioteca ZIM (Kiwix / Wikipédia)', icon: '📚', desc: 'Acervos offline e Wikipédia completa' },
                  { key: 'maps', name: 'Mapas Vetoriais Offline', icon: '🗺️', desc: 'Camadas e pacotes de mapas PMTiles' },
                  { key: 'kolibri-gen2', name: 'Plataforma Kolibri', icon: '🎓', desc: 'Cursos, videoaulas e canais educativos' },
                  { key: 'ollama', name: 'Modelos de IA Local (Ollama)', icon: '🤖', desc: 'Pesos GGUF e modelos de linguagem' },
                  { key: 'books', name: 'Livros & E-books (Calibre-Web)', icon: '📖', desc: 'Biblioteca digital e acervos EPUB/PDF' },
                  { key: 'media', name: 'Mídia & Vídeos (Jellyfin)', icon: '🎬', desc: 'Filmes, séries e documentários offline' },
                  { key: 'kb_uploads', name: 'Base de Conhecimento RAG', icon: '📄', desc: 'Documentos e PDFs indexados' },
                ].map((mod) => {
                  const currentFolder = overview.folderUsage.find((f) => f.name === mod.key)
                  const isMovingThis = movingItem === mod.key || Boolean(movingItem?.startsWith('all-'))
                  return (
                    <div
                      key={`module-card-${mod.key}`}
                      className="p-4 rounded-xl border border-border-default bg-surface-secondary/70 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base">{mod.icon}</span>
                          <span className="text-xs font-mono font-bold text-desert-orange">
                            {currentFolder ? formatBytes(currentFolder.sizeBytes, 1) : '0 B'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-text-primary mt-1">{mod.name}</h4>
                        <p className="text-[11px] text-text-muted mt-0.5">{mod.desc}</p>
                        <div className="text-[10px] font-mono text-text-secondary mt-1 truncate">
                          Pasta: /{mod.key} {currentFolder?.fileCount ? `(${currentFolder.fileCount} arq.)` : ''}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-subtle/50">
                        <div className="text-[10px] font-semibold text-text-secondary mb-1.5 uppercase">
                          Mapear para disco:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {overview.mountTargets.map((m) => (
                            <button
                              key={`btn-${mod.key}-${m.path}`}
                              type="button"
                              disabled={Boolean(movingItem)}
                              onClick={() => {
                                const targetFolder = currentFolder || { path: `${overview.storageRoot}/${mod.key}` }
                                setConfirmMoveModal({
                                  isOpen: true,
                                  type: 'single',
                                  targetDisk: m,
                                  moduleKey: mod.key,
                                  moduleName: mod.name,
                                  sourcePath: targetFolder.path,
                                })
                              }}
                              className="px-2.5 py-1 rounded border border-border-default bg-surface-primary hover:border-desert-tan text-[11px] font-medium text-text-primary cursor-pointer disabled:opacity-50"
                            >
                              {isMovingThis ? 'Mapeando...' : `→ ${m.label}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 2. Gerenciador de Arquivos Nativo + Mover entre Discos */}
          <section className="space-y-4">
            <StyledSectionHeader title="Gerenciador de Arquivos Nativo N.O.M.A.D." />
            <div className="rounded-xl border border-border-default bg-surface-primary overflow-hidden">
              <div className="px-4 py-3 bg-surface-secondary border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {browseData?.parentPath && (
                    <button
                      type="button"
                      onClick={() => setBrowsePath(browseData.parentPath!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-default bg-surface-primary text-xs font-medium text-text-primary hover:border-desert-orange cursor-pointer"
                    >
                      <IconArrowUp size={14} />
                      <span>Subir</span>
                    </button>
                  )}
                  <span className="text-xs font-mono text-text-primary bg-surface-primary px-2.5 py-1 rounded border border-border-subtle">
                    {browseData?.currentPath || browsePath}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {overview?.mountTargets.map((m) => (
                    <button
                      key={m.path}
                      type="button"
                      onClick={() => setBrowsePath(m.path)}
                      className="px-2.5 py-1 rounded text-[11px] font-mono border border-border-default bg-surface-primary hover:border-desert-green text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      {m.path.includes('/mnt/') ? m.path : 'storage/'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => refetchBrowse()}
                    className="p-1.5 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary cursor-pointer"
                    title="Recarregar pasta"
                  >
                    <IconRefresh size={14} />
                  </button>
                </div>
              </div>

              {/* Criar nova pasta */}
              <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2 bg-surface-primary">
                <input
                  type="text"
                  placeholder="Nova pasta neste diretório..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded border border-border-default bg-surface-secondary text-text-primary w-64 focus:outline-none focus:ring-1 focus:ring-desert-green"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-desert-green text-white text-xs font-semibold hover:bg-btn-green-hover disabled:opacity-40 cursor-pointer"
                >
                  <IconFolderPlus size={14} />
                  <span>Criar Pasta</span>
                </button>
              </div>

              <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto themed-scrollbar">
                {browseLoading ? (
                  <div className="p-6 text-center text-sm text-text-muted">Carregando arquivos...</div>
                ) : !browseData?.entries.length ? (
                  <div className="p-6 text-center text-sm text-text-muted">Diretório vazio.</div>
                ) : (
                  browseData.entries.map((entry) => (
                    <div
                      key={entry.path}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-surface-secondary/60"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.isDirectory) setBrowsePath(entry.path)
                        }}
                        className={`flex items-center gap-2.5 min-w-0 text-left ${
                          entry.isDirectory ? 'cursor-pointer hover:text-desert-orange' : 'cursor-default'
                        }`}
                      >
                        {entry.isDirectory ? (
                          <IconFolder size={18} className="text-desert-tan shrink-0" />
                        ) : (
                          <IconFile size={18} className="text-text-muted shrink-0" />
                        )}
                        <span className="text-sm font-medium text-text-primary truncate">
                          {entry.name}
                        </span>
                        {entry.isSymlink && (
                          <span
                            title="Link simbólico para outro disco (Kiwix/Kolibri lê normalmente)"
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-desert-green/15 text-desert-green border border-desert-green/30 shrink-0"
                          >
                            <IconLink size={11} /> Link Disco
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-text-muted">
                          {entry.isDirectory ? 'Pasta' : formatBytes(entry.sizeBytes, 1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMoveModalFile(entry)
                            const altDisk =
                              overview?.mountTargets.find((m) => !entry.path.startsWith(m.path))
                                ?.path || '/mnt/nomad_storage'
                            setMoveDestDir(altDisk)
                          }}
                          className="px-2.5 py-1 rounded border border-border-default bg-surface-secondary hover:border-desert-orange text-xs font-medium text-text-primary cursor-pointer"
                        >
                          Mover para outro HD
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry)}
                          title="Excluir arquivo/pasta"
                          className="p-1.5 rounded border border-border-subtle text-text-muted hover:text-desert-red hover:border-desert-red cursor-pointer"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* 3. Compartilhamento Samba (SMB) Nativo para Portainer Remoto */}
          <section className="space-y-4">
            <StyledSectionHeader title="Compartilhamento de Rede Samba (SMB) para Portainer Remoto" />
            <Alert
              type="info-inverted"
              variant="bordered"
              title="Acesso Unificado entre N.O.M.A.D. e Servidor Portainer em Outra Máquina"
              message="Se o seu Portainer roda em outro PC/servidor, ative o servidor Samba nativo abaixo para compartilhar a pasta do N.O.M.A.D. na rede local (portas 139/445). Assim os contêineres do Portainer (Kiwix, Jellyfin, Calibre-Web, Stirling PDF) poderão montar e acessar os arquivos baixados aqui."
            />

            <div className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <IconServer size={20} className="text-desert-tan" />
                  <div>
                    <div className="text-sm font-bold text-text-primary">
                      Servidor Samba N.O.M.A.D. (`nomad_samba`)
                    </div>
                    <div className="text-xs text-text-muted">
                      Status:{' '}
                      <strong
                        className={
                          sambaStatus?.containerRunning ? 'text-desert-green' : 'text-desert-orange'
                        }
                      >
                        {sambaStatus?.containerRunning ? 'ONLINE (Portas 139/445)' : 'INATIVO'}
                      </strong>
                    </div>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-text-primary">
                  <input
                    type="checkbox"
                    checked={sambaEnabled}
                    onChange={(e) => setSambaEnabled(e.target.checked)}
                    className="w-4 h-4 accent-desert-green"
                  />
                  <span>Ativar Compartilhamento Samba</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Nome do Compartilhamento SMB
                  </label>
                  <input
                    type="text"
                    value={sambaShareName}
                    onChange={(e) => setSambaShareName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border-default bg-surface-secondary text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Caminho no Host a Compartilhar
                  </label>
                  <input
                    type="text"
                    value={sambaHostPath}
                    onChange={(e) => setSambaHostPath(e.target.value)}
                    placeholder="/mnt/nomad_storage ou /storage"
                    className="w-full px-3 py-2 rounded-md border border-border-default bg-surface-secondary text-sm font-mono text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Usuário SMB
                  </label>
                  <input
                    type="text"
                    value={sambaUsername}
                    onChange={(e) => setSambaUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border-default bg-surface-secondary text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Senha SMB (deixe em branco para manter/padrão)
                  </label>
                  <input
                    type="password"
                    value={sambaPassword}
                    onChange={(e) => setSambaPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-border-default bg-surface-secondary text-sm text-text-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs font-mono space-y-1 text-text-secondary">
                <div className="font-bold text-text-primary">
                  Endereço de Rede / Montagem no Servidor Portainer:
                </div>
                <div>
                  Windows / SMB: <code>\\{hostIp}\{sambaShareName}</code>
                </div>
                <div>
                  Linux CIFS:{' '}
                  <code>
                    sudo mount -t cifs //{hostIp}/{sambaShareName} /mnt/nomad_share -o username=
                    {sambaUsername},password=SUA_SENHA,uid=1000,gid=1000
                  </code>
                </div>
              </div>

              <div className="flex justify-end">
                <StyledButton
                  variant="primary"
                  icon="IconCheck"
                  loading={sambaSaving}
                  onClick={handleSaveSamba}
                >
                  Salvar e Aplicar Samba
                </StyledButton>
              </div>
            </div>
          </section>

          {/* Modal Mover para outro HD */}
          <StyledModal
            title={`Mover "${moveModalFile?.name || ''}" para outro HD`}
            open={Boolean(moveModalFile)}
            onCancel={() => setMoveModalFile(null)}
            onConfirm={handleMoveConfirm}
            confirmText={moving ? 'Movendo...' : 'Mover Arquivo'}
            cancelText="Cancelar"
            confirmVariant="primary"
          >
            <div className="space-y-4 text-sm text-text-primary">
              <p className="text-xs text-text-secondary">
                Origem atual: <code className="font-mono">{moveModalFile?.path}</code>
              </p>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Pasta de destino no outro disco:
                </label>
                <input
                  type="text"
                  value={moveDestDir}
                  onChange={(e) => setMoveDestDir(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-surface-secondary text-sm font-mono text-text-primary"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {overview?.mountTargets.map((m) => (
                    <button
                      key={m.path}
                      type="button"
                      onClick={() => setMoveDestDir(`${m.path}/zim`)}
                      className="px-2 py-1 rounded text-[11px] font-mono border border-border-default bg-surface-secondary hover:border-desert-orange cursor-pointer"
                    >
                      <IconArrowRight size={11} className="inline mr-1" />
                      {m.path}/zim
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-desert-green/10 border border-desert-green/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSymlink}
                  onChange={(e) => setKeepSymlink(e.target.checked)}
                  className="mt-0.5 accent-desert-green"
                />
                <div className="text-xs">
                  <div className="font-bold text-text-primary">
                    Manter link simbólico no local original (Recomendado)
                  </div>
                  <div className="text-text-secondary">
                    Permite mover ZIMs/arquivos pesados para o outro HD mantendo o Kiwix, Kolibri e demais apps encontrando o arquivo automaticamente sem quebrar nada.
                  </div>
                </div>
              </label>
            </div>
          </StyledModal>

          {/* Modal Tático In-System de Confirmação de Mapeamento de Discos */}
          <Dialog
            open={Boolean(confirmMoveModal?.isOpen)}
            onClose={() => {
              if (!movingItem) setConfirmMoveModal(null)
            }}
            className="relative z-50"
          >
            <DialogBackdrop
              transition
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
              <DialogPanel
                transition
                className="relative bg-surface-primary border border-desert-green/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 data-[closed]:scale-95 data-[closed]:opacity-0 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-desert-green/15 border border-desert-green/30 flex items-center justify-center text-desert-green shrink-0">
                    <IconServer size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold font-mono-mil tracking-wide uppercase text-text-primary">
                      {confirmMoveModal?.type === 'all'
                        ? 'Mapeamento Geral de Armazenamento'
                        : `Mapear ${confirmMoveModal?.moduleName || 'Módulo'}`}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {confirmMoveModal?.type === 'all'
                        ? 'Deseja mover e mapear TODAS as pastas de downloads para este disco? O NOMAD criará links simbólicos automáticos sem quebrar as aplicações.'
                        : `Mover os arquivos deste módulo para o disco selecionado e criar atalhos transparentes no sistema.`}
                    </p>
                  </div>
                  {!movingItem && (
                    <button
                      onClick={() => setConfirmMoveModal(null)}
                      className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <IconX size={18} />
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-surface-secondary border border-border-default space-y-2">
                  <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Disco de Destino:
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                    <span className="text-desert-green font-mono">💾</span>
                    <span className="truncate">{confirmMoveModal?.targetDisk?.label}</span>
                  </div>
                  <div className="text-xs font-mono text-text-muted flex items-center gap-2">
                    <span className="truncate">Caminho: {confirmMoveModal?.targetDisk?.path}</span>
                    <span>•</span>
                    <span className="shrink-0">
                      Livre: {confirmMoveModal?.targetDisk?.freeBytes ? formatBytes(confirmMoveModal.targetDisk.freeBytes, 1) : 'Calculando...'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-desert-orange/10 border border-desert-orange/25 text-xs text-desert-orange leading-relaxed flex items-start gap-2.5">
                  <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>
                    Operação segura: os arquivos são movidos com verificação de integridade e o contêiner continua acessando os dados no mesmo caminho original através de links simbólicos.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={Boolean(movingItem)}
                    onClick={() => setConfirmMoveModal(null)}
                    className="px-4 py-2 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 border border-border-default text-xs font-semibold text-text-secondary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(movingItem)}
                    onClick={executeConfirmedMove}
                    className="px-4 py-2 rounded-lg bg-desert-green hover:bg-desert-green-dark text-white text-xs font-bold font-mono-mil flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {movingItem ? (
                      <>
                        <IconLoader2 size={16} className="animate-spin" />
                        <span>Mapeando arquivos...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={16} />
                        <span>Confirmar e Mapear</span>
                      </>
                    )}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

          {/* Modal Tático de Confirmação de Reinicialização */}
          <Dialog
            open={rebootModalOpen}
            onClose={() => setRebootModalOpen(false)}
            className="relative z-50"
          >
            <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-primary border border-desert-orange/60 p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex items-center gap-3 text-desert-orange mb-3">
                    <IconRotateClockwise size={26} className="shrink-0" />
                    <h3 className="text-base font-bold text-text-primary">
                      Reiniciar Nexus N.O.M.A.D.
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    Esta ação reinicia <strong>apenas o contêiner do Nexus N.O.M.A.D.</strong>. Suas aplicações ativas no Portainer/Docker (Kiwix, Ollama, Jellyfin, etc.) <strong>NÃO</strong> serão interrompidas.
                  </p>
                  <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle text-[11px] text-text-muted mb-5 space-y-1">
                    <div>• O sistema exibirá a tela de inicialização do N.O.M.A.D. enquanto o contêiner reinicia.</div>
                    <div>• Ao finalizar, reconectará automaticamente ao Centro de Comando.</div>
                  </div>
                  <div className="flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRebootModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-border-default bg-surface-secondary text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRebootModalOpen(false)
                        rebootNomadSystem()
                      }}
                      className="px-4 py-1.5 rounded-lg bg-desert-orange hover:bg-desert-orange-dark text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <IconRotateClockwise size={14} />
                      <span>Confirmar e Reiniciar</span>
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </Dialog>
        </main>
      </div>
    </SettingsLayout>
  )
}

