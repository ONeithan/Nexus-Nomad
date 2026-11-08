import { useEffect } from 'react'
import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import { NomadDiskInfo, SystemInformationResponse } from '../../../types/system'
import { formatBytes } from '~/lib/util'
import { getAllDiskDisplayItems } from '~/hooks/useDiskDisplayData'
import CircularGauge from '~/components/systeminfo/CircularGauge'
import HorizontalBarChart from '~/components/HorizontalBarChart'
import InfoCard from '~/components/systeminfo/InfoCard'
import Alert from '~/components/Alert'
import GpuPassthroughAlert from '~/components/GpuPassthroughAlert'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import StatusCard from '~/components/systeminfo/StatusCard'
import {
  IconCpu,
  IconDatabase,
  IconServer,
  IconDeviceDesktop,
  IconComponents,
  IconWorld,
} from '@tabler/icons-react'

const NETWORK_FS_TYPES = new Set(['nfs', 'nfs4', 'cifs', 'smbfs', 'smb2', 'smb3'])

function getDiskTypeLabel(disk: NomadDiskInfo): string {
  const tran = (disk.tran || '').toLowerCase()
  if (tran === 'nvme' || disk.name.startsWith('nvme')) return 'NVMe M.2 SSD'
  if (tran === 'usb') return 'Unidade USB Externa'
  if (tran === 'mmc' || disk.name.startsWith('mmcblk')) return 'eMMC / SD'
  if (!disk.rota) return 'SSD SATA'
  return 'HDD SATA 2.5" / 3.5" (Rotacional)'
}

function getMountRoleLabel(mount: string): string {
  if (mount === '/') return 'Sistema Operacional & Banco de Dados'
  if (mount === '/storage' || mount === '/app/storage' || mount === '/mnt/nomad_storage') {
    return 'Armazenamento Principal do NOMAD'
  }
  if (mount.startsWith('/boot')) return 'Inicialização UEFI / Boot'
  if (mount.includes('nfs') || mount.includes('nas')) return 'Volume de Rede (NFS / SMB)'
  return 'Partição Montada'
}

export default function SettingsPage(props: {
  system: { info: SystemInformationResponse | undefined }
}) {
  const { data: info } = useSystemInfo({
    initialData: props.system.info,
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#discos') {
      const el = document.getElementById('discos')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [])

  // Use (total - available) to reflect actual memory pressure on Linux
  const memoryUsed =
    info?.mem.total && info?.mem.available != null
      ? info.mem.total - info.mem.available
      : info?.mem.used || 0
  const memoryUsagePercent = info?.mem.total
    ? ((memoryUsed / info.mem.total) * 100).toFixed(1)
    : '0.0'

  const swapUsagePercent = info?.mem.swaptotal
    ? ((info.mem.swapused / info.mem.swaptotal) * 100).toFixed(1)
    : '0.0'

  const uptimeSeconds = info?.uptime.uptime || 0
  const uptimeDays = Math.floor(uptimeSeconds / 86400)
  const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600)
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)
  const uptimeDisplay =
    uptimeDays > 0
      ? `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
      : uptimeHours > 0
        ? `${uptimeHours}h ${uptimeMinutes}m`
        : `${uptimeMinutes}m`

  const validDisks = (info?.disk || []).filter((d) => d.totalSize > 0)
  const networkMounts = (info?.fsSize || []).filter(
    (fs) => fs.size > 0 && NETWORK_FS_TYPES.has((fs.type || '').toLowerCase())
  )
  const storageItems = getAllDiskDisplayItems(info?.disk, info?.fsSize)

  const totalRawBytes =
    validDisks.length > 0
      ? validDisks.reduce((sum, d) => sum + (d.totalSize || 0), 0)
      : storageItems.reduce((sum, item) => sum + (item.totalBytes || 0), 0)

  const totalUsedBytes =
    validDisks.length > 0
      ? validDisks.reduce((sum, d) => sum + (d.totalUsed || 0), 0)
      : storageItems.reduce((sum, item) => sum + (item.usedBytes || 0), 0)

  const totalFreeBytes = Math.max(0, totalRawBytes - totalUsedBytes)
  const detectedDiskCount = validDisks.length > 0 ? validDisks.length : storageItems.length

  return (
    <SettingsLayout>
      <Head title="Sistema & Discos | Nexus NOMAD" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-desert-green mb-2">
              Sistema &amp; Armazenamento
            </h1>
            <p className="text-desert-stone-dark">
              Monitoramento de discos conectados e telemetria em tempo real • Atualizado a cada 30
              segundos
            </p>
          </div>

          {Number(memoryUsagePercent) > 90 && (
            <div className="mb-6">
              <Alert
                type="error"
                title="Uso Elevado de Memória RAM Detectado"
                message="O consumo de memória ultrapassou 90%. Considere verificar os contêineres em execução."
                variant="bordered"
              />
            </div>
          )}

          {/* ── Topologia de Discos Conectados ─────────────────────────────────────── */}
          <section id="discos" className="mb-12 scroll-mt-6">
            <h2 className="text-2xl font-bold text-desert-green mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-desert-green" />
              Discos Físicos &amp; Pools Conectados
            </h2>

            {/* Barra de resumo global dos discos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-desert-white rounded-lg p-4 border border-desert-stone-light shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-desert-stone-dark">
                  Discos Físicos Detectados
                </div>
                <div className="text-2xl font-bold text-desert-green mt-1">
                  {detectedDiskCount} {detectedDiskCount === 1 ? 'Unidade' : 'Unidades'}
                </div>
              </div>
              <div className="bg-desert-white rounded-lg p-4 border border-desert-stone-light shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-desert-stone-dark">
                  Capacidade Total Conectada
                </div>
                <div className="text-2xl font-bold text-desert-green mt-1">
                  {formatBytes(totalRawBytes)}
                </div>
              </div>
              <div className="bg-desert-white rounded-lg p-4 border border-desert-stone-light shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-desert-stone-dark">
                  Espaço Alocado / Usado
                </div>
                <div className="text-2xl font-bold text-desert-orange mt-1">
                  {formatBytes(totalUsedBytes)}
                </div>
              </div>
              <div className="bg-desert-white rounded-lg p-4 border border-desert-stone-light shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-desert-stone-dark">
                  Espaço Livre Disponível
                </div>
                <div className="text-2xl font-bold text-desert-green mt-1">
                  {formatBytes(totalFreeBytes)}
                </div>
              </div>
            </div>

            {/* Cards individuais de cada disco físico conectado via lsblk */}
            {validDisks.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {validDisks.map((disk) => {
                  const pct = Math.min(100, Math.max(0, Number(disk.percentUsed || 0)))
                  const freeBytes = Math.max(0, (disk.totalSize || 0) - (disk.totalUsed || 0))
                  const barColor =
                    pct >= 90
                      ? 'bg-desert-red'
                      : pct >= 75
                        ? 'bg-desert-orange'
                        : 'bg-desert-green'
                  const statusBadge =
                    pct >= 90
                      ? {
                          text: 'CRÍTICO',
                          cls: 'bg-desert-red-lighter text-desert-red-dark border-desert-red-light',
                        }
                      : pct >= 75
                        ? {
                            text: 'ATENÇÃO',
                            cls: 'bg-desert-orange-lighter text-desert-orange-dark border-desert-orange-light',
                          }
                        : {
                            text: 'ONLINE • SAUDÁVEL',
                            cls: 'bg-desert-green-lighter text-desert-green-dark border-desert-green-light',
                          }
                  const modelTitle =
                    [disk.vendor, disk.model]
                      .map((s) => (s || '').trim())
                      .filter(Boolean)
                      .join(' ') || `Unidade /dev/${disk.name}`

                  return (
                    <div
                      key={disk.name}
                      className="bg-desert-white rounded-xl border border-desert-stone-light shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Cabeçalho da Unidade Física */}
                      <div className="px-6 py-4 bg-surface-secondary border-b border-desert-stone-lighter flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-desert-green-lighter border border-desert-green-light flex items-center justify-center text-desert-green">
                            <IconServer className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-desert-green text-white">
                                /dev/{disk.name}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-desert-stone-light bg-desert-white text-text-primary">
                                {getDiskTypeLabel(disk)}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-text-primary mt-1">
                              {modelTitle}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadge.cls}`}
                        >
                          ● {statusBadge.text}
                        </span>
                      </div>

                      {/* Barra de Capacidade do Disco */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                        <div>
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-sm font-semibold text-text-secondary">
                              Uso da Unidade Física
                            </span>
                            <span className="text-sm font-bold text-text-primary">
                              {pct.toFixed(1)}% utilizado
                            </span>
                          </div>
                          <div className="w-full h-4 bg-desert-stone-lighter rounded-full overflow-hidden border border-desert-stone-light">
                            <div
                              className={`h-full ${barColor} transition-all duration-700`}
                              style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-desert-stone-dark">
                            <div>
                              <span className="block uppercase opacity-75">Usado</span>
                              <strong className="text-sm text-text-primary">
                                {formatBytes(disk.totalUsed || 0)}
                              </strong>
                            </div>
                            <div className="text-center">
                              <span className="block uppercase opacity-75">Livre</span>
                              <strong className="text-sm text-desert-green">
                                {formatBytes(freeBytes)}
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="block uppercase opacity-75">Capacidade Bruta</span>
                              <strong className="text-sm text-text-primary">
                                {formatBytes(disk.totalSize || 0)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Partições e Pontos de Montagem deste disco */}
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-desert-stone-dark mb-2">
                            Partições &amp; Pontos de Montagem ({disk.filesystems?.length || 0})
                          </div>
                          {disk.filesystems && disk.filesystems.length > 0 ? (
                            <div className="rounded-lg border border-desert-stone-lighter overflow-hidden">
                              <table className="min-w-full divide-y divide-desert-stone-lighter text-xs">
                                <thead className="bg-surface-secondary">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">
                                      Partição
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">
                                      Montagem / Função
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold text-text-secondary">
                                      Alocado
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-desert-stone-lighter bg-desert-white">
                                  {disk.filesystems.map((fs) => (
                                    <tr key={`${fs.fs}-${fs.mount}`}>
                                      <td className="px-3 py-2 font-mono font-medium text-text-primary whitespace-nowrap">
                                        {fs.fs}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="font-mono font-semibold text-desert-green">
                                          {fs.mount === '/storage' ? '/mnt/nomad_storage (/storage)' : fs.mount}
                                        </div>
                                        <div className="text-[11px] text-desert-stone-dark">
                                          {getMountRoleLabel(fs.mount)}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right whitespace-nowrap">
                                        <div className="font-semibold text-text-primary">
                                          {formatBytes(fs.used)} / {formatBytes(fs.size)}
                                        </div>
                                        <div className="text-[11px] text-desert-stone-dark">
                                          {(fs.percentUsed || 0).toFixed(1)}%
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-desert-stone-light p-3 text-xs text-desert-stone-dark bg-surface-secondary/50">
                              Unidade física detectada no barramento, mas sem partições montadas no
                              momento.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : storageItems.length > 0 ? (
              <div className="bg-desert-white rounded-lg p-8 border border-desert-stone-light shadow-sm">
                <HorizontalBarChart
                  items={storageItems}
                  progressiveBarColor={true}
                  statuses={[
                    {
                      label: 'Normal',
                      min_threshold: 0,
                      color_class: 'bg-desert-olive',
                    },
                    {
                      label: 'Atenção — Uso Elevado',
                      min_threshold: 75,
                      color_class: 'bg-desert-orange',
                    },
                    {
                      label: 'Crítico — Disco Quase Cheio',
                      min_threshold: 90,
                      color_class: 'bg-desert-red',
                    },
                  ]}
                />
              </div>
            ) : (
              <div className="bg-desert-white rounded-lg p-8 border border-desert-stone-light text-center text-desert-stone-dark">
                Coletando informações dos discos físicos conectados... aguarde alguns segundos.
              </div>
            )}

            {/* Pools de Rede (NFS / SMB) */}
            {networkMounts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-desert-green mb-3 flex items-center gap-2">
                  <IconWorld className="w-5 h-5" />
                  Pools de Rede Conectados (NFS / SMB)
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {networkMounts.map((nfs) => {
                    const pct = Math.min(100, Math.max(0, Number(nfs.use || 0)))
                    return (
                      <div
                        key={`${nfs.fs}-${nfs.mount}`}
                        className="bg-desert-white rounded-xl border border-desert-green p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-desert-green text-white">
                              {(nfs.type || 'NFS').toUpperCase()}
                            </span>
                            <h4 className="font-mono font-bold text-base text-text-primary mt-1">
                              {nfs.fs}
                            </h4>
                            <p className="text-xs text-desert-stone-dark">Montado em: {nfs.mount}</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-desert-green-lighter text-desert-green-dark border border-desert-green-light">
                            ● CONECTADO
                          </span>
                        </div>
                        <div className="w-full h-3 bg-desert-stone-lighter rounded-full overflow-hidden border border-desert-stone-light">
                          <div
                            className="h-full bg-desert-green"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-desert-stone-dark mt-2">
                          <span>Usado: {formatBytes(nfs.used)}</span>
                          <span>Total do Dataset: {formatBytes(nfs.size)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ── Uso de Recursos em Tempo Real ─────────────────────────────────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-desert-green mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-desert-green" />
              Uso de Processador e Memória
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-desert-white rounded-lg p-6 border border-desert-stone-light shadow-sm hover:shadow-lg transition-shadow">
                <CircularGauge
                  value={info?.currentLoad.currentLoad || 0}
                  label="Uso de CPU"
                  size="lg"
                  variant="cpu"
                  subtext={`${info?.cpu.cores || 0} threads lógicas`}
                  icon={<IconCpu className="w-8 h-8" />}
                />
              </div>
              <div className="bg-desert-white rounded-lg p-6 border border-desert-stone-light shadow-sm hover:shadow-lg transition-shadow">
                <CircularGauge
                  value={Number(memoryUsagePercent)}
                  label="Memória RAM"
                  size="lg"
                  variant="memory"
                  subtext={`${formatBytes(memoryUsed)} / ${formatBytes(info?.mem.total || 0)}`}
                  icon={<IconDatabase className="w-8 h-8" />}
                />
              </div>
              <div className="bg-desert-white rounded-lg p-6 border border-desert-stone-light shadow-sm hover:shadow-lg transition-shadow">
                <CircularGauge
                  value={Number(swapUsagePercent)}
                  label="Uso de Swap"
                  size="lg"
                  variant="disk"
                  subtext={`${formatBytes(info?.mem.swapused || 0)} / ${formatBytes(info?.mem.swaptotal || 0)}`}
                  icon={<IconServer className="w-8 h-8" />}
                />
              </div>
            </div>
          </section>

          {/* ── Detalhes de Hardware & Sistema Operacional ────────────────────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-desert-green mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-desert-green" />
              Especificações do Servidor
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InfoCard
                title="Sistema Operacional"
                icon={<IconDeviceDesktop className="w-6 h-6" />}
                variant="elevated"
                data={[
                  { label: 'Distribuição', value: info?.os.distro },
                  { label: 'Versão do Kernel', value: info?.os.kernel },
                  { label: 'Arquitetura', value: info?.os.arch },
                  { label: 'Nome do Host (Hostname)', value: info?.os.hostname },
                  { label: 'Plataforma', value: info?.os.platform },
                ]}
              />
              <InfoCard
                title="Processador"
                icon={<IconCpu className="w-6 h-6" />}
                variant="elevated"
                data={[
                  { label: 'Fabricante', value: info?.cpu.manufacturer },
                  { label: 'Modelo', value: info?.cpu.brand },
                  { label: 'Threads Lógicas', value: info?.cpu.cores },
                  { label: 'Núcleos Físicos', value: info?.cpu.physicalCores },
                  {
                    label: 'Virtualização',
                    value: info?.cpu.virtualization ? 'Ativada' : 'Desativada',
                  },
                ]}
              />
              {info?.gpuHealth?.status === 'passthrough_failed' && (
                <div className="lg:col-span-2">
                  <GpuPassthroughAlert
                    gpuHealth={info.gpuHealth}
                    assistantName="Assistente de IA"
                  />
                </div>
              )}
              {info?.graphics?.controllers && info.graphics.controllers.length > 0 && (
                <InfoCard
                  title="Controlador Gráfico"
                  icon={<IconComponents className="w-6 h-6" />}
                  variant="elevated"
                  data={info.graphics.controllers
                    .map((gpu, i) => {
                      const prefix = info.graphics.controllers.length > 1 ? `GPU ${i + 1} ` : ''
                      return [
                        { label: `${prefix}Modelo`, value: gpu.model },
                        { label: `${prefix}Fabricante`, value: gpu.vendor },
                        {
                          label: `${prefix}VRAM`,
                          value: gpu.vram ? `${gpu.vram} MB` : 'Compartilhada',
                        },
                      ]
                    })
                    .flat()}
                />
              )}
            </div>
          </section>

          {/* ── Alocação de Memória RAM ───────────────────────────────────────────── */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-desert-green mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-desert-green" />
              Alocação de Memória RAM
            </h2>
            <div className="bg-desert-white rounded-lg p-8 border border-desert-stone-light shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-desert-green mb-1">
                    {formatBytes(info?.mem.total || 0)}
                  </div>
                  <div className="text-sm text-desert-stone-dark uppercase tracking-wide">
                    RAM Total Instalada
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-desert-green mb-1">
                    {formatBytes(memoryUsed)}
                  </div>
                  <div className="text-sm text-desert-stone-dark uppercase tracking-wide">
                    RAM em Uso Real
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-desert-green mb-1">
                    {formatBytes(info?.mem.available || 0)}
                  </div>
                  <div className="text-sm text-desert-stone-dark uppercase tracking-wide">
                    RAM Disponível
                  </div>
                </div>
              </div>
              <div className="relative h-12 bg-desert-stone-lighter rounded-lg overflow-hidden border border-desert-stone-light">
                <div
                  className="absolute left-0 top-0 h-full bg-desert-orange transition-all duration-1000"
                  style={{ width: `${memoryUsagePercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-md z-10">
                    {memoryUsagePercent}% Utilizada
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Resumo de Status ──────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold text-desert-green mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-desert-green" />
              Status Operacional
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard title="Tempo Ligado (Uptime)" value={uptimeDisplay} />
              <StatusCard title="Threads de CPU" value={info?.cpu.cores || 0} />
              <StatusCard title="Discos Detectados" value={detectedDiskCount} />
              <StatusCard title="Capacidade Total" value={formatBytes(totalRawBytes)} />
            </div>
          </section>
        </main>
      </div>
    </SettingsLayout>
  )
}
