export interface DownloadErrorDiagnosis {
  code: string
  category:
    | 'storage'
    | 'timeout'
    | 'dns'
    | 'network'
    | 'http_transient'
    | 'http_not_found'
    | 'auth'
    | 'disk_full'
    | 'mime'
    | 'cancelled'
    | 'unknown'
  summaryPt: string
  explanationPt: string
  actionHintPt: string
  retryable: boolean
  autoReparable: boolean
  rawMessage: string
}

/**
 * Classifies any raw download error (Axios, Node fs/net, HTTP status, BullMQ stall)
 * into clear Brazilian Portuguese root-cause diagnostics, recovery flags, and hints.
 */
export function diagnoseDownloadError(
  error: unknown,
  filepath?: string
): DownloadErrorDiagnosis {
  const errObj = error as any
  const rawMessage =
    (error instanceof Error ? error.message : typeof error === 'string' ? error : String(error || 'Erro desconhecido')) ||
    'Erro desconhecido'
  const errCode = String(errObj?.code || '').toUpperCase()
  const status = Number(errObj?.response?.status || 0)
  const lower = rawMessage.toLowerCase()
  const targetHint = filepath ? ` (${filepath})` : ''

  if (
    lower.includes('download cancelled') ||
    lower.includes('user-cancel') ||
    lower.includes('cancelado pelo operador')
  ) {
    return {
      code: 'USER_CANCELLED',
      category: 'cancelled',
      summaryPt: 'Download cancelado manualmente pelo operador',
      explanationPt:
        'A transferência foi interrompida a pedido do operador na interface.',
      actionHintPt: 'Inicie novamente no catálogo caso ainda precise deste arquivo.',
      retryable: false,
      autoReparable: false,
      rawMessage,
    }
  }

  if (
    errObj?.name === 'GatedContentAuthError' ||
    status === 401 ||
    status === 403 ||
    lower.includes('rejected this install') ||
    lower.includes('entitlement')
  ) {
    return {
      code: status ? `HTTP_${status}` : 'AUTH_REJECTED',
      category: 'auth',
      summaryPt: `Acesso negado pelo servidor de origem (HTTP ${status || '401/403'})`,
      explanationPt:
        'O servidor remoto rejeitou a autorização ou chave de acesso desta compilação/requisição.',
      actionHintPt:
        'Verifique se o servidor de origem exige imagem oficial ou chave de autorização válida.',
      retryable: false,
      autoReparable: false,
      rawMessage,
    }
  }

  if (errCode === 'ENOSPC' || lower.includes('enospc') || lower.includes('no space left')) {
    return {
      code: 'DISK_ENOSPC',
      category: 'disk_full',
      summaryPt: 'Espaço em disco esgotado no HD de destino (ENOSPC)',
      explanationPt: `Não há espaço físico livre suficiente na partição de gravação${targetHint} para continuar salvando o arquivo.`,
      actionHintPt:
        'Libere espaço ou mova a pasta do módulo para o HD secundário em Armazenamento & Samba antes de tentar novamente.',
      retryable: false,
      autoReparable: false,
      rawMessage,
    }
  }

  if (
    errCode === 'ENOTDIR' ||
    lower.includes('enotdir') ||
    lower.includes('not a directory') ||
    lower.includes('eloop')
  ) {
    return {
      code: 'STORAGE_ENOTDIR',
      category: 'storage',
      summaryPt: 'Conflito de diretório ou link simbólico na pasta de destino (ENOTDIR)',
      explanationPt: `O sistema encontrou um link simbólico pendente ou bloqueio ao preparar a pasta de destino${targetHint} (ex.: pasta apontando para HD secundário).`,
      actionHintPt:
        'O N.O.M.A.D. resolve automaticamente o caminho real no HD de destino, repara o link simbólico e reenvia o download para o final da fila.',
      retryable: true,
      autoReparable: true,
      rawMessage,
    }
  }

  if (errCode === 'EACCES' || errCode === 'EPERM' || lower.includes('eacces') || lower.includes('permission denied')) {
    return {
      code: errCode || 'STORAGE_EACCES',
      category: 'storage',
      summaryPt: 'Permissão de gravação negada na pasta/HD de destino',
      explanationPt: `O processo do servidor não conseguiu gravar na pasta configurada${targetHint}.`,
      actionHintPt:
        'O N.O.M.A.D. tentará reparar as permissões/pasta do link de armazenamento e reenviará ao final da fila.',
      retryable: true,
      autoReparable: true,
      rawMessage,
    }
  }

  if (
    errCode === 'ETIMEDOUT' ||
    errCode === 'ESOCKETTIMEDOUT' ||
    lower.includes('timeout of') ||
    lower.includes('etimedout') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return {
      code: 'TIMEOUT',
      category: 'timeout',
      summaryPt: 'Tempo limite de resposta esgotado no servidor remoto',
      explanationPt:
        'O servidor/espelho remoto demorou mais do que a janela de espera para responder (muito comum quando vários downloads simultâneos ou redirecionamentos disputam banda). O que já foi gravado no .tmp não é perdido.',
      actionHintPt:
        'Margem de tempo ampliada automaticamente (>= 120s) e download enviado ao final da fila para dar vez aos demais itens.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  if (
    errCode === 'ENOTFOUND' ||
    errCode === 'EAI_AGAIN' ||
    lower.includes('enotfound') ||
    lower.includes('eai_again') ||
    lower.includes('getaddrinfo')
  ) {
    return {
      code: errCode || 'DNS_ENOTFOUND',
      category: 'dns',
      summaryPt: 'Falha de DNS ou conexão com o servidor remoto de origem',
      explanationPt:
        'Não foi possível resolver o endereço do espelho de download (ex.: lb.download.kiwix.org) devido a oscilação de DNS, ausência momentânea de internet ou roteamento.',
      actionHintPt:
        'Download movido para o final da fila (mantendo dados parciais em disco) para nova tentativa automática.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  if (
    errCode === 'ECONNRESET' ||
    errCode === 'ECONNREFUSED' ||
    errCode === 'EPIPE' ||
    errCode === 'EHOSTUNREACH' ||
    errCode === 'ENETUNREACH' ||
    lower.includes('econnreset') ||
    lower.includes('econnrefused') ||
    lower.includes('socket hang up') ||
    lower.includes('stalled') ||
    lower.includes('aborted') ||
    lower.includes('premature close')
  ) {
    return {
      code: errCode || 'NET_INTERRUPTED',
      category: 'network',
      summaryPt: 'Conexão interrompida ou congelada durante a transferência',
      explanationPt:
        'A conexão TCP com o servidor caiu no meio do download ou ficou sem tráfego por mais de 5 minutos. Os bytes já gravados no arquivo temporário .tmp permanecem preservados para retomada.',
      actionHintPt:
        'Reenviado para o final da fila com retomada automática a partir do último byte salvo.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  if (status === 429 || (status >= 500 && status <= 599) || /\b(429|500|502|503|504)\b/.test(lower)) {
    return {
      code: status ? `HTTP_${status}` : 'HTTP_TRANSIENT',
      category: 'http_transient',
      summaryPt: 'Espelho remoto temporariamente sobrecarregado ou indisponível',
      explanationPt:
        'O servidor de arquivos limitou conexões simultâneas ou retornou instabilidade temporária (HTTP 429 / 5xx).',
      actionHintPt:
        'Movido para o final da fila para reduzir a carga simultânea sobre o espelho remoto.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  if (status === 404 || status === 410 || /\bhttp 404\b|\bstatus code 404\b/.test(lower)) {
    return {
      code: 'HTTP_404',
      category: 'http_not_found',
      summaryPt: 'Arquivo não encontrado no servidor remoto (HTTP 404)',
      explanationPt:
        'O espelho remoto respondeu que este arquivo ou versão datada não está mais disponível nesta URL.',
      actionHintPt:
        'Tentará até o limite de 3 tentativas; se persistir, atualize o catálogo remoto (ZIM / Mapas) para obter a versão mais recente.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  if (lower.includes('mime type') && lower.includes('not allowed')) {
    return {
      code: 'INVALID_MIME',
      category: 'mime',
      summaryPt: 'O servidor retornou um tipo de arquivo inválido em vez do pacote esperado',
      explanationPt:
        'Em vez do binário (.zim / .pmtiles), o espelho respondeu com uma página HTML de erro ou manutenção.',
      actionHintPt:
        'Enviado ao final da fila; caso o espelho continue em manutenção após 3 tentativas, tente outro espelho/horário.',
      retryable: true,
      autoReparable: false,
      rawMessage,
    }
  }

  return {
    code: errCode || 'DOWNLOAD_ERROR',
    category: 'unknown',
    summaryPt: `Falha na transferência: ${rawMessage}`,
    explanationPt: `Ocorreu um erro técnico durante o processamento do download${targetHint}: ${rawMessage}.`,
    actionHintPt:
      'O arquivo será validado e enviado ao final da fila até atingir o limite de 3 tentativas.',
    retryable: true,
    autoReparable: true,
    rawMessage,
  }
}
