import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface StorageMountTarget {
  label: string
  path: string
  freeBytes: number
  totalBytes: number
  usedBytes?: number
  isPrimary?: boolean
  diskType?: string
  realHostPath?: string
  quotaEnabled?: boolean
  quotaLimitBytes?: number
  effectiveFreeBytes?: number
}

export interface StorageModuleLocationSummary {
  key: string
  containerPath: string
  exists: boolean
  isSymlink: boolean
  realPath: string
  realHostPath: string
  currentDiskPath: string
  currentDiskLabel: string
  sizeBytes: number
  fileCount: number
}

export interface StorageOverviewResponse {
  storageRoot: string
  preferredDownloadDisk: string
  mountTargets: StorageMountTarget[]
  moduleLocations?: Record<string, StorageModuleLocationSummary>
}

export function getDiskAvailableBytes(disk: StorageMountTarget): number {
  if (disk.quotaEnabled && typeof disk.effectiveFreeBytes === 'number') {
    return disk.effectiveFreeBytes
  }
  return disk.freeBytes
}

export function useStorageOverview() {
  return useQuery<StorageOverviewResponse>({
    queryKey: ['storage-overview'],
    queryFn: async () => {
      const res = await axios.get<StorageOverviewResponse>('/api/system/storage/overview')
      return res.data
    },
    staleTime: 30_000,
  })
}
