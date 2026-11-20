export interface LiveInstallProgress {
  service_name: string
  status: string
  message: string
  updatedAt: string
}

const liveProgressMap = new Map<string, LiveInstallProgress>()

export function setInstallProgress(serviceName: string, status: string, message: string): void {
  if (!serviceName) return
  liveProgressMap.set(serviceName, {
    service_name: serviceName,
    status,
    message,
    updatedAt: new Date().toISOString(),
  })
}

export function clearInstallProgress(serviceName: string): void {
  if (!serviceName) return
  liveProgressMap.delete(serviceName)
}

export function getInstallProgress(serviceName: string): LiveInstallProgress | undefined {
  return liveProgressMap.get(serviceName)
}

/**
 * Normalizes raw Docker / Portainer / Registry errors into concise PT-BR guidance.
 */
export function translateDockerDeployErrorPtBr(rawError: unknown): string {
  const raw = String(rawError ?? '').trim()
  const lower = raw.toLowerCase()

  if (!raw) {
    return 'Falha desconhecida durante a implantação do contêiner.'
  }
  if (lower.includes('manifest unknown') || lower.includes('not found') && lower.includes('manifest')) {
    return `Imagem ou tag inexistente no registro Docker: ${raw}`
  }
  if (lower.includes('pull access denied') || lower.includes('unauthorized') || lower.includes('requested access to the resource is denied')) {
    return `Acesso negado ao baixar a imagem no registro remoto (imagem removida ou privada): ${raw}`
  }
  if (lower.includes('port is already allocated') || lower.includes('address already in use')) {
    return `Conflito de porta no servidor: ${raw}`
  }
  if (lower.includes('no space left on device')) {
    return `Espaço em disco esgotado no servidor Docker: ${raw}`
  }
  if (lower.includes('oomkilled') || lower.includes('exit code 137')) {
    return `Contêiner encerrado por falta de memória RAM (OOMKilled): ${raw}`
  }
  if (lower.includes('timeout') || lower.includes('econnaborted') || lower.includes('etimedout')) {
    return `Tempo limite excedido na comunicação/download com o servidor Docker: ${raw}`
  }
  if (lower.includes('econnrefused') || lower.includes('econnreset') || lower.includes('socket hang up')) {
    return `Conexão recusada ou interrompida com o Portainer/Docker: ${raw}`
  }
  return raw
}
