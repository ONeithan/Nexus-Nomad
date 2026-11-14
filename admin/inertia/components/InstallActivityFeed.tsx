import { useEffect, useRef } from 'react'
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import classNames from '~/lib/classNames'

export type InstallActivityFeedProps = {
  activity: Array<{
    service_name: string
    type:
      | 'initializing'
      | 'pulling'
      | 'pulled'
      | 'creating'
      | 'created'
      | 'preinstall'
      | 'preinstall-complete'
      | 'preinstall-error'
      | 'starting'
      | 'started'
      | 'finalizing'
      | 'completed'
      | 'checking-dependencies'
      | 'dependency-installed'
      | 'image-exists'
      | 'gpu-config'
      | 'stopping'
      | 'removing'
      | 'recreating'
      | 'cleanup-warning'
      | 'no-volumes'
      | 'volume-removed'
      | 'volume-cleanup-warning'
      | 'error'
      | 'update-pulling'
      | 'update-stopping'
      | 'update-creating'
      | 'update-starting'
      | 'update-complete'
      | 'update-rollback'
      | (string & {})
    timestamp: string
    message: string
  }>
  className?: string
  withHeader?: boolean
}

const InstallActivityFeed: React.FC<InstallActivityFeedProps> = ({ activity, className, withHeader = false }) => {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [activity])

  return (
    <div className={classNames('bg-surface-primary shadow-sm rounded-lg p-6 border border-border-subtle', className)}>
      {withHeader && <h2 className="text-lg font-semibold text-text-primary">Progresso da Instalação</h2>}
      <ul ref={listRef} role="list" className={classNames("space-y-4 text-desert-green max-h-[320px] overflow-y-auto scroll-smooth", withHeader ? 'mt-4' : '')}>
        {activity.map((activityItem, activityItemIdx) => {
          const formattedTime = (() => {
            try {
              return new Date(activityItem.timestamp).toLocaleTimeString('pt-BR')
            } catch {
              return activityItem.timestamp
            }
          })()
          return (
          <li key={`${activityItem.service_name}-${activityItem.timestamp}-${activityItemIdx}`} className="relative flex gap-x-4">
            <div
              className={classNames(
                activityItemIdx === activity.length - 1 ? 'h-6' : '-bottom-4',
                'absolute left-0 top-0 flex w-6 justify-center'
              )}
            >
              <div className="w-px bg-border-subtle" />
            </div>
            <>
              <div className="relative flex size-6 flex-none items-center justify-center bg-transparent">
                {activityItem.type === 'completed' || activityItem.type === 'update-complete' ? (
                  <IconCircleCheck aria-hidden="true" className="size-6 text-emerald-500" />
                ) : activityItem.type === 'error' || activityItem.type === 'update-rollback' || activityItem.type === 'preinstall-error' ? (
                  <IconCircleX aria-hidden="true" className="size-6 text-red-500" />
                ) : (
                  <div className="size-2 rounded-full bg-desert-orange ring-2 ring-desert-orange/30" />
                )}
              </div>
              <p className="flex-auto py-0.5 text-xs/5 text-text-muted">
                <span className="font-semibold text-text-primary">{activityItem.service_name}</span> -{' '}
                {activityItem.message || activityItem.type.charAt(0).toUpperCase() + activityItem.type.slice(1)}
              </p>
              <time
                dateTime={activityItem.timestamp}
                className="flex-none py-0.5 text-xs/5 text-text-muted font-mono"
              >
                {formattedTime}
              </time>
            </>
          </li>
          )
        })}
      </ul>
    </div>
  )
}

export default InstallActivityFeed
