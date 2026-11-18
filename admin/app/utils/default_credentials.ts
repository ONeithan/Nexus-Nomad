import KVStore from '#models/kv_store'
import { SERVICE_NAMES } from '../../constants/service_names.js'

export interface ConfiguredDefaultCredentials {
  enabled: boolean
  username: string
  password: string
}

/**
 * Loads the server-wide default credential policy saved in KVStore.
 */
export async function getConfiguredDefaultCredentials(): Promise<ConfiguredDefaultCredentials> {
  const [enabledRaw, userRaw, passRaw] = await Promise.all([
    KVStore.getValue('portainer.autoApplyCredentials').catch(() => false),
    KVStore.getValue('portainer.defaultUsername').catch(() => ''),
    KVStore.getValue('portainer.defaultPassword').catch(() => ''),
  ])

  return {
    enabled: Boolean(enabledRaw),
    username: String(userRaw || '').trim() || 'admin',
    password: String(passRaw || ''),
  }
}

/**
 * Injects container environment variables for applications that support initial
 * administrator credentials via environment variables.
 */
export function injectDefaultCredentialEnv(
  serviceName: string,
  baseEnv: string[],
  creds: ConfiguredDefaultCredentials
): string[] {
  if (!creds.enabled || !creds.password) {
    return baseEnv
  }

  const additions: Record<string, string> = {}
  const user = creds.username || 'admin'
  const pass = creds.password

  switch (serviceName) {
    case SERVICE_NAMES.PAPERLESS:
      additions.PAPERLESS_ADMIN_USER = user
      additions.PAPERLESS_ADMIN_PASSWORD = pass
      break
    case SERVICE_NAMES.PIHOLE:
      additions.WEBPASSWORD = pass
      additions.FTLCONF_webserver_api_password = pass
      break
    case SERVICE_NAMES.VAULTWARDEN:
      additions.ADMIN_TOKEN = pass
      break
    case SERVICE_NAMES.DUPLICATI:
      additions.DUPLICATI__WEBSERVICE_PASSWORD = pass
      additions.SETTINGS_ENCRYPTION_KEY = pass
      break
    case SERVICE_NAMES.DIRECTUS:
      additions.ADMIN_EMAIL = user.includes('@') ? user : `${user}@nomad.local`
      additions.ADMIN_PASSWORD = pass
      break
    case SERVICE_NAMES.TUBEARCHIVIST:
      additions.TA_USERNAME = user
      additions.TA_PASSWORD = pass
      break
    default:
      return baseEnv
  }

  const merged = [...baseEnv]
  for (const [key, val] of Object.entries(additions)) {
    const prefix = `${key}=`
    const existingIdx = merged.findIndex((entry) => entry.startsWith(prefix))
    if (existingIdx >= 0) {
      merged[existingIdx] = `${prefix}${val}`
    } else {
      merged.push(`${prefix}${val}`)
    }
  }

  return merged
}
