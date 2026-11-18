export type RoleLevel = 1 | 2 | 3 | 4 | 5

export interface RoleLevelDefinition {
  level: RoleLevel
  shortLabel: string
  badgeLabel: string
  title: string
  description: string
  capabilities: string[]
}

export const ROLE_LEVEL_DEFINITIONS: RoleLevelDefinition[] = [
  {
    level: 5,
    shortLabel: 'Admin Total',
    badgeLabel: 'NÍVEL 05 // ADMIN TOTAL',
    title: 'Nível 5 — Admin Total (Comando-Geral)',
    description:
      'Controle absoluto do servidor: cria/edita/remove operadores, atualiza o N.O.M.A.D., altera configurações de rede/discos/Samba, instala e exclui qualquer app ou arquivo.',
    capabilities: [
      'Gerenciar operadores e permissões',
      'Atualizar e reiniciar o sistema N.O.M.A.D.',
      'Instalar, controlar e excluir apps/arquivos',
      'Alterar discos, Samba, servidores remotos e IA',
    ],
  },
  {
    level: 4,
    shortLabel: 'Instalar & Excluir',
    badgeLabel: 'NÍVEL 04 // INSTALAR & EXCLUIR',
    title: 'Nível 4 — Operador Avançado (Instalar & Excluir)',
    description:
      'Pode instalar, reiniciar e desinstalar aplicativos, baixar conteúdos e excluir arquivos ZIM, mapas ou modelos de IA. Não pode gerenciar usuários nem alterar o núcleo do sistema.',
    capabilities: [
      'Instalar, atualizar e desinstalar apps',
      'Baixar e excluir ZIMs, Mapas e Modelos IA',
      'Sem acesso ao cadastro de operadores ou updates do núcleo',
    ],
  },
  {
    level: 3,
    shortLabel: 'Instalar (Sem Excluir)',
    badgeLabel: 'NÍVEL 03 // INSTALAR (SEM EXCLUIR)',
    title: 'Nível 3 — Operador de Campo (Instala, Não Exclui)',
    description:
      'Pode instalar novos aplicativos, iniciar/parar módulos e baixar ZIMs, mapas ou modelos IA, porém fica bloqueado de excluir aplicativos, ZIMs, mapas ou dados armazenados.',
    capabilities: [
      'Instalar, iniciar e parar aplicativos',
      'Baixar ZIMs, Mapas, Coleções e Modelos IA',
      'Bloqueado de desinstalar ou excluir arquivos',
    ],
  },
  {
    level: 2,
    shortLabel: 'Observador',
    badgeLabel: 'NÍVEL 02 // OBSERVADOR',
    title: 'Nível 2 — Observador (Consulta & Uso)',
    description:
      'Acesso de leitura e uso operacional: pode ver métricas, abrir Mapas, Kiwix e usar o Chat de IA, mas não pode instalar, desinstalar, baixar nem excluir nada.',
    capabilities: [
      'Visualizar painel, logs, discos e aplicativos',
      'Usar Chat de IA, Mapas Offline e Kiwix',
      'Bloqueado de instalar, baixar, modificar ou excluir',
    ],
  },
  {
    level: 1,
    shortLabel: 'Restrito',
    badgeLabel: 'NÍVEL 01 // RESTRITO',
    title: 'Nível 1 — Restrito (Somente Tela Inicial)',
    description:
      'Acesso mínimo para visitantes ou estações compartilhadas: visualiza o Painel Inicial para abrir apps liberados, sem acesso às páginas de configurações ou gerenciamento.',
    capabilities: [
      'Visualizar apenas o Painel Inicial (/home)',
      'Abrir links de apps disponíveis',
      'Sem acesso a configurações, instalações ou exclusões',
    ],
  },
]

export function getRoleDefinition(level?: number | null): RoleLevelDefinition {
  const num = Number(level) as RoleLevel
  return (
    ROLE_LEVEL_DEFINITIONS.find((r) => r.level === num) ||
    ROLE_LEVEL_DEFINITIONS[ROLE_LEVEL_DEFINITIONS.length - 1]
  )
}

export interface OperatorPublic {
  id: number
  username: string
  roleLevel: RoleLevel
  shortLabel: string
  badgeLabel: string
  isActive: boolean
  createdBy: string | null
  lastLoginAt: string | null
  createdAt: string
}

export interface AuthSessionSummary {
  id: number
  operatorId: number
  username: string
  roleLevel: RoleLevel
  ipAddress: string | null
  userAgent: string | null
  isLocked: boolean
  lastSeenAt: string | null
  expiresAt: string
}

export interface AuthStatusPayload {
  needsOnboarding: boolean
  hasOperators: boolean
  authenticated: boolean
  locked: boolean
  lockedUsername: string | null
  lockedRoleLabel: string | null
  operator: OperatorPublic | null
  currentIp?: string | null
}
