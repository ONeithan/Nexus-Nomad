import { computeJobHealth, type JobHealthStatus } from '../../app/utils/kb_job_health.js'

export { computeJobHealth, type JobHealthStatus } from '../../app/utils/kb_job_health.js'

/**
 * Visual presentation for each health status — pill color, dot color, and the
 * short label rendered alongside the dot. Kept in one place so backend health
 * decisions (`computeJobHealth`) and frontend rendering stay in sync.
 */
export const JOB_HEALTH_DISPLAY: Record<
  JobHealthStatus,
  { dot: string; label: string; ariaLabel: string }
> = {
  waiting: {
    dot: 'bg-gray-400 dark:bg-gray-500',
    label: 'Aguardando',
    ariaLabel: 'A tarefa está na fila aguardando início',
  },
  healthy: {
    dot: 'bg-green-500',
    label: 'Ativo',
    ariaLabel: 'A tarefa está indexando em ritmo normal',
  },
  slow: {
    dot: 'bg-yellow-500',
    label: 'Lento',
    ariaLabel: 'A tarefa não avançou nos últimos 2 minutos',
  },
  stalled: {
    dot: 'bg-red-500',
    label: 'Travado',
    ariaLabel: 'A tarefa não avançou nos últimos 5 minutos',
  },
  failed: {
    dot: 'bg-red-700',
    label: 'Falhou',
    ariaLabel: 'A tarefa falhou',
  },
}

/**
 * Format a relative timestamp as "Xs ago", "Xm ago", "Xh ago" with sensible
 * thresholds for the KB Processing Queue's "Last activity" line.
 */
export function formatTimeAgo(timestampMs: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - timestampMs) / 1000))
  if (seconds < 5) return 'agora mesmo'
  if (seconds < 60) return `há ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}

/**
 * Convenience wrapper that resolves a job's health status without the caller
 * having to remember to pass `now`. Mostly for ergonomic frontend use.
 */
export function computeJobHealthNow(
  input: Omit<Parameters<typeof computeJobHealth>[0], 'now'>
): JobHealthStatus {
  return computeJobHealth({ ...input, now: Date.now() })
}
