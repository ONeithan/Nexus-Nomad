import { SERVICE_NAMES } from '../../constants/service_names.js'

export interface StackBlueprint {
  /** Additional env vars injected into the primary app container (resolved with hostIp/hostPort). */
  extraEnv: (hostIp: string, hostPort: string) => string[]
  /** Extra compose service definitions appended under top-level `services:`. */
  sidecarServicesYaml: (serviceName: string, hostIp: string, hostPort: string) => string
  /** Extra named volumes appended under top-level `volumes:`. */
  sidecarVolumeNames: (serviceName: string) => string[]
  /** Optional docker compose `depends_on` YAML lines for the primary app service. */
  dependsOnYaml?: string
  /** If true, primary app runs behind a proxy container (e.g. Nginx) which owns the published HTTP port. */
  proxyOwnsHostPort?: boolean
  /** Optional extra volume mounts added onto the primary app service itself. */
  extraAppVolumes?: (serviceName: string) => string[]
  /** Optional shared memory allocation (e.g. '256mb' for Frigate). */
  shmSize?: string
  /** Optional shell command wrapper executed before primary entrypoint (e.g. Synapse config gen). */
  composeEntrypointOverride?: string[]
}

export interface StarterConfigFile {
  relativeSubdir: string
  filename: string
  volumeTargetDir: string
  content: string
}

const pgHealthcheck = `      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U postgres"]
        interval: 5s
        timeout: 3s
        retries: 12`

const redisHealthcheck = `      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 5s
        timeout: 3s
        retries: 12`

const mariaHealthcheck = `      healthcheck:
        test: ["CMD-SHELL", "mariadb-admin ping -h localhost -pnomad_db_pass || mysqladmin ping -h localhost -pnomad_db_pass"]
        interval: 5s
        timeout: 3s
        retries: 15`

function buildPgService(
  serviceName: string,
  dbName: string,
  image = 'postgres:16-alpine',
  dbUser = 'postgres'
): string {
  return `  ${serviceName}-db:
    image: ${image}
    container_name: nomad-${serviceName}-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${dbUser}
      - POSTGRES_PASSWORD=nomad_db_pass
      - POSTGRES_DB=${dbName}
    volumes:
      - nomad-${serviceName}-pgdata:/var/lib/postgresql/data
${pgHealthcheck.replace('pg_isready -U postgres', `pg_isready -U ${dbUser} -d ${dbName}`)}`
}

function buildRedisService(serviceName: string): string {
  return `  ${serviceName}-redis:
    image: redis:7-alpine
    container_name: nomad-${serviceName}-redis
    restart: unless-stopped
    volumes:
      - nomad-${serviceName}-redis:/data
${redisHealthcheck}`
}

export const STACK_BLUEPRINTS: Record<string, StackBlueprint> = {
  [SERVICE_NAMES.OUTLINE]: {
    extraEnv: (hostIp, hostPort) => [
      `URL=http://${hostIp}:${hostPort}`,
      `DATABASE_URL=postgres://postgres:nomad_db_pass@${SERVICE_NAMES.OUTLINE}-db:5432/outline`,
      `REDIS_URL=redis://${SERVICE_NAMES.OUTLINE}-redis:6379`,
      'PGSSLMODE=disable',
      'FILE_STORAGE=local',
      'FILE_STORAGE_LOCAL_ROOT_DIR=/var/lib/outline/data',
      'FORCE_HTTPS=false',
      'ENABLE_UPDATES=false',
      'SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'UTILS_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.OUTLINE}-db:
        condition: service_healthy
      ${SERVICE_NAMES.OUTLINE}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => `${buildPgService(s, 'outline')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.DOCMOST]: {
    extraEnv: (hostIp, hostPort) => [
      `APP_URL=http://${hostIp}:${hostPort}`,
      'APP_SECRET=docmost-nomad-secret-key-32chars-minimum!',
      `DATABASE_URL=postgres://postgres:nomad_db_pass@${SERVICE_NAMES.DOCMOST}-db:5432/docmost?schema=public`,
      `REDIS_URL=redis://${SERVICE_NAMES.DOCMOST}-redis:6379`,
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.DOCMOST}-db:
        condition: service_healthy
      ${SERVICE_NAMES.DOCMOST}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => `${buildPgService(s, 'docmost')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.GHOSTFOLIO]: {
    extraEnv: () => [
      'NODE_ENV=production',
      `DATABASE_URL=postgresql://postgres:nomad_db_pass@${SERVICE_NAMES.GHOSTFOLIO}-db:5432/ghostfolio?connect_timeout=300&sslmode=prefer`,
      `REDIS_HOST=${SERVICE_NAMES.GHOSTFOLIO}-redis`,
      'REDIS_PORT=6379',
      'ACCESS_TOKEN_SALT=nomad-ghostfolio-salt-2026-secure',
      'JWT_SECRET_KEY=nomad-ghostfolio-jwt-secret-2026!',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.GHOSTFOLIO}-db:
        condition: service_healthy
      ${SERVICE_NAMES.GHOSTFOLIO}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => `${buildPgService(s, 'ghostfolio')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.MAYBE]: {
    extraEnv: () => [
      'SELF_HOSTED=true',
      'RAILS_FORCE_SSL=false',
      'RAILS_ASSUME_SSL=false',
      'GOOD_JOB_EXECUTION_MODE=async',
      'SECRET_KEY_BASE=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      `POSTGRES_HOST=${SERVICE_NAMES.MAYBE}-db`,
      'POSTGRES_USER=postgres',
      'POSTGRES_PASSWORD=nomad_db_pass',
      'POSTGRES_DB=maybe_production',
      `REDIS_URL=redis://${SERVICE_NAMES.MAYBE}-redis:6379/1`,
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.MAYBE}-db:
        condition: service_healthy
      ${SERVICE_NAMES.MAYBE}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => `${buildPgService(s, 'maybe_production')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.AUTHENTIK]: {
    extraEnv: () => [
      `AUTHENTIK_POSTGRESQL__HOST=${SERVICE_NAMES.AUTHENTIK}-db`,
      'AUTHENTIK_POSTGRESQL__USER=postgres',
      'AUTHENTIK_POSTGRESQL__NAME=authentik',
      'AUTHENTIK_POSTGRESQL__PASSWORD=nomad_db_pass',
      `AUTHENTIK_REDIS__HOST=${SERVICE_NAMES.AUTHENTIK}-redis`,
      'AUTHENTIK_SECRET_KEY=authentik-nomad-secret-key-50-chars-homelab-2026!',
      'AUTHENTIK_ERROR_REPORTING__ENABLED=false',
      'AUTHENTIK_DISABLE_STARTUP_CHECKS=true',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.AUTHENTIK}-db:
        condition: service_healthy
      ${SERVICE_NAMES.AUTHENTIK}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => `${buildPgService(s, 'authentik')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.MATTERMOST]: {
    extraEnv: (hostIp, hostPort) => [
      'MM_SQLSETTINGS_DRIVERNAME=postgres',
      `MM_SQLSETTINGS_DATASOURCE=postgres://postgres:nomad_db_pass@${SERVICE_NAMES.MATTERMOST}-db:5432/mattermost?sslmode=disable&connect_timeout=10`,
      'MM_BLEVESETTINGS_INDEXDIR=/mattermost/bleve-indexes',
      `MM_SERVICESETTINGS_SITEURL=http://${hostIp}:${hostPort}`,
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.MATTERMOST}-db:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => buildPgService(s, 'mattermost'),
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`],
  },

  [SERVICE_NAMES.PLANKA]: {
    extraEnv: (hostIp, hostPort) => [
      `BASE_URL=http://${hostIp}:${hostPort}`,
      `DATABASE_URL=postgresql://postgres:nomad_db_pass@${SERVICE_NAMES.PLANKA}-db:5432/planka`,
      'SECRET_KEY=nomad-planka-secret-key-64-chars-minimum-homelab-2026-offline',
      'TRUST_PROXY=0',
      'DEFAULT_ADMIN_EMAIL=admin@nomad.local',
      'DEFAULT_ADMIN_PASSWORD=nomad',
      'DEFAULT_ADMIN_NAME=Operador NOMAD',
      'DEFAULT_ADMIN_USERNAME=admin',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.PLANKA}-db:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) => buildPgService(s, 'planka'),
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`],
  },

  [SERVICE_NAMES.IMMICH]: {
    extraEnv: () => [
      `DB_HOSTNAME=${SERVICE_NAMES.IMMICH}-db`,
      'DB_USERNAME=postgres',
      'DB_PASSWORD=nomad_db_pass',
      'DB_DATABASE_NAME=immich',
      `REDIS_HOSTNAME=${SERVICE_NAMES.IMMICH}-redis`,
      'IMMICH_TELEMETRY_INCLUDE=',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.IMMICH}-db:
        condition: service_healthy
      ${SERVICE_NAMES.IMMICH}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s) =>
      `${buildPgService(s, 'immich', 'tensorchord/pgvecto-rs:pg16-v0.2.0')}\n${buildRedisService(s)}`,
    sidecarVolumeNames: (s) => [`nomad-${s}-pgdata`, `nomad-${s}-redis`],
  },

  [SERVICE_NAMES.BAR_ASSISTANT]: {
    extraEnv: (hostIp, hostPort) => [
      `APP_URL=http://${hostIp}:${hostPort}`,
      'APP_KEY=base64:c29tZXJhbmRvbXN0cmluZ2ZvcmJhcmFzc2lzdGFudA==',
      'DB_CONNECTION=sqlite',
      'DB_DATABASE=/var/www/cocktails/storage/bar-assistant/database.sqlite',
      'CACHE_DRIVER=file',
      'SESSION_DRIVER=file',
      `MEILISEARCH_HOST=http://${SERVICE_NAMES.BAR_ASSISTANT}-meili:7700`,
      'MEILISEARCH_KEY=nomadMeiliMasterKey2026',
    ],
    dependsOnYaml: `    depends_on:
      - ${SERVICE_NAMES.BAR_ASSISTANT}-meili\n`,
    sidecarServicesYaml: (s) => `  ${s}-meili:
    image: getmeili/meilisearch:v1.11
    container_name: nomad-${s}-meili
    restart: unless-stopped
    environment:
      - MEILI_MASTER_KEY=nomadMeiliMasterKey2026
      - MEILI_NO_ANALYTICS=true
    volumes:
      - nomad-${s}-meili:/meili_data`,
    sidecarVolumeNames: (s) => [`nomad-${s}-meili`],
  },

  [SERVICE_NAMES.TUBEARCHIVIST]: {
    extraEnv: (hostIp, hostPort) => [
      `ES_URL=http://${SERVICE_NAMES.TUBEARCHIVIST}-es:9200`,
      `REDIS_CON=redis://${SERVICE_NAMES.TUBEARCHIVIST}-redis:6379`,
      'TA_HOST=0.0.0.0:8000',
      `HOST_UID=1000`,
      `HOST_GID=1000`,
      'TA_USERNAME=admin',
      'TA_PASSWORD=nomad',
      'ELASTIC_PASSWORD=nomad_db_pass',
      `ORIGIN=http://${hostIp}:${hostPort}`,
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.TUBEARCHIVIST}-redis:
        condition: service_healthy
      - ${SERVICE_NAMES.TUBEARCHIVIST}-es\n`,
    sidecarServicesYaml: (s) => `${buildRedisService(s)}
  ${s}-es:
    image: elasticsearch:8.15.3
    container_name: nomad-${s}-es
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms256m -Xmx512m
    volumes:
      - nomad-${s}-esdata:/usr/share/elasticsearch/data`,
    sidecarVolumeNames: (s) => [`nomad-${s}-redis`, `nomad-${s}-esdata`],
  },

  [SERVICE_NAMES.INVOICE_NINJA]: {
    proxyOwnsHostPort: true,
    extraAppVolumes: (s) => [`nomad-${s}-public:/var/www/app/public`],
    extraEnv: (hostIp, hostPort) => [
      `APP_URL=http://${hostIp}:${hostPort}`,
      'APP_KEY=base64:c29tZXJhbmRvbXN0cmluZ2Zvcmludm9pY2VuaW5qYQ==',
      'APP_ENV=production',
      'APP_DEBUG=false',
      'REQUIRE_HTTPS=false',
      'DB_CONNECTION=mysql',
      `DB_HOST=${SERVICE_NAMES.INVOICE_NINJA}-db`,
      'DB_PORT=3306',
      'DB_DATABASE=ninja',
      'DB_USERNAME=ninja',
      'DB_PASSWORD=nomad_db_pass',
      `REDIS_HOST=${SERVICE_NAMES.INVOICE_NINJA}-redis`,
      'IS_DOCKER=true',
    ],
    dependsOnYaml: `    depends_on:
      ${SERVICE_NAMES.INVOICE_NINJA}-db:
        condition: service_healthy
      ${SERVICE_NAMES.INVOICE_NINJA}-redis:
        condition: service_healthy\n`,
    sidecarServicesYaml: (s, _hostIp, hostPort) => `  ${s}-db:
    image: mariadb:11
    container_name: nomad-${s}-db
    restart: unless-stopped
    environment:
      - MARIADB_ROOT_PASSWORD=nomad_db_pass
      - MARIADB_DATABASE=ninja
      - MARIADB_USER=ninja
      - MARIADB_PASSWORD=nomad_db_pass
    volumes:
      - nomad-${s}-mariadb:/var/lib/mysql
${mariaHealthcheck}
${buildRedisService(s)}
  ${s}-web:
    image: nginx:alpine
    container_name: nomad-${s}-web
    restart: unless-stopped
    depends_on:
      - ${s}
    ports:
      - "${hostPort}:80"
    volumes:
      - nomad-${s}-public:/var/www/app/public:ro
    entrypoint:
      - /bin/sh
      - -c
      - |
        cat <<'EOF' > /etc/nginx/conf.d/default.conf
        server {
            listen 80;
            root /var/www/app/public;
            index index.php index.html;
            location / { try_files $$uri $$uri/ /index.php?$$query_string; }
            location ~ \.php$$ {
                include fastcgi_params;
                fastcgi_param SCRIPT_FILENAME $$document_root$$fastcgi_script_name;
                fastcgi_pass ${s}:9000;
            }
        }
        EOF
        exec nginx -g 'daemon off;'`,
    sidecarVolumeNames: (s) => [`nomad-${s}-mariadb`, `nomad-${s}-redis`, `nomad-${s}-public`],
  },

  [SERVICE_NAMES.FRIGATE]: {
    shmSize: '256mb',
    extraEnv: () => [],
    sidecarServicesYaml: () => '',
    sidecarVolumeNames: () => [],
  },

  [SERVICE_NAMES.SYNAPSE]: {
    extraEnv: () => ['SYNAPSE_SERVER_NAME=nomad.local', 'SYNAPSE_REPORT_STATS=no'],
    composeEntrypointOverride: ['/bin/sh', '-c', '[ -f /data/homeserver.yaml ] || /start.py generate; exec /start.py'],
    sidecarServicesYaml: () => '',
    sidecarVolumeNames: () => [],
  },
}

export function getStackBlueprint(serviceName: string): StackBlueprint | undefined {
  return STACK_BLUEPRINTS[serviceName]
}

export function hasMultiServiceSidecars(serviceName: string): boolean {
  const bp = STACK_BLUEPRINTS[serviceName]
  return Boolean(bp && bp.sidecarVolumeNames(serviceName).length > 0)
}

export function getStarterConfigFile(
  serviceName: string,
  hostIp = '127.0.0.1',
  hostPort = '8080'
): StarterConfigFile | null {
  if (serviceName === SERVICE_NAMES.BLOCKY) {
    return {
      relativeSubdir: 'blocky',
      filename: 'config.yml',
      volumeTargetDir: '/app/config',
      content: `upstreams:
  groups:
    default:
      - 1.1.1.1
      - 9.9.9.9
ports:
  http: 4000
  dns: 53
blocking:
  loading:
    strategy: fast
`,
    }
  }

  if (serviceName === SERVICE_NAMES.HEADSCALE) {
    return {
      relativeSubdir: 'headscale',
      filename: 'config.yaml',
      volumeTargetDir: '/etc/headscale',
      content: `server_url: http://${hostIp}:${hostPort}
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 127.0.0.1:9090
private_key_path: /etc/headscale/private.key
noise:
  private_key_path: /etc/headscale/noise_private.key
prefixes:
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48
derp:
  server:
    enabled: false
  urls: []
  paths: []
database:
  type: sqlite
  sqlite:
    path: /etc/headscale/db.sqlite
dns:
  magic_dns: false
`,
    }
  }

  if (serviceName === SERVICE_NAMES.FRIGATE) {
    return {
      relativeSubdir: 'frigate/config',
      filename: 'config.yml',
      volumeTargetDir: '/config',
      content: `mqtt:
  enabled: false
cameras: {}
`,
    }
  }

  if (serviceName === SERVICE_NAMES.WEEWX) {
    return {
      relativeSubdir: 'weewx',
      filename: 'weewx.conf',
      volumeTargetDir: '/data',
      content: `debug = 0
WEEWX_ROOT = /data
[Station]
  location = "Estacao NOMAD"
  latitude = -23.55
  longitude = -46.63
  altitude = 760, meter
  station_type = Simulator
[Simulator]
  loop_interval = 2.5
  mode = simulator
  driver = weewx.drivers.simulator
[StdReport]
  HTML_ROOT = public_html
  [[SeasonsReport]]
    skin = Seasons
    enable = true
[DataBindings]
  [[wx_binding]]
    database = archive_sqlite
[Databases]
  [[archive_sqlite]]
    database_name = weewx.sdb
    database_type = SQLite
[Engine]
  [[Services]]
    archive_services = weewx.engine.StdArchive
    report_services = weewx.engine.StdReport
`,
    }
  }

  return null
}
