import * as assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  containerMatchesCatalogService,
  isNomadManagedContainer,
} from '../../app/utils/container_matcher.js'

test('containerMatchesCatalogService links third-party Jellyfin container to nomad_jellyfin', () => {
  assert.equal(
    containerMatchesCatalogService(
      { service_name: 'nomad_jellyfin', container_image: 'jellyfin/jellyfin:latest' },
      { name: 'jellyfin', image: 'lscr.io/linuxserver/jellyfin:latest' }
    ),
    true
  )
})

test('containerMatchesCatalogService links custom-named Navidrome via image repo/tail', () => {
  assert.equal(
    containerMatchesCatalogService(
      { service_name: 'nomad_navidrome', container_image: 'deluan/navidrome:latest' },
      { name: 'meu-player-musica', image: 'deluan/navidrome:0.53.3' }
    ),
    true
  )
})

test('containerMatchesCatalogService links compose-managed Open WebUI container', () => {
  assert.equal(
    containerMatchesCatalogService(
      { service_name: 'nomad_open_webui', container_image: 'ghcr.io/open-webui/open-webui:main' },
      {
        name: 'nomad-nomad_open_webui-open-webui-1',
        image: 'ghcr.io/open-webui/open-webui:main',
        projectName: 'nomad-nomad_open_webui',
        composeService: 'nomad_open_webui',
      }
    ),
    true
  )
})

test('containerMatchesCatalogService ignores -init sidecars and NOMAD core infra', () => {
  assert.equal(
    containerMatchesCatalogService(
      { service_name: 'nomad_kiwix_serve', container_image: 'ghcr.io/kiwix/kiwix-serve:latest' },
      { name: 'nomad-kiwix-init', image: 'ghcr.io/kiwix/kiwix-tools:latest' }
    ),
    false
  )

  assert.equal(
    containerMatchesCatalogService(
      { service_name: 'nomad_admin', container_image: 'ghcr.io/oneithan/nexus-nomad:latest' },
      { name: 'nomad_admin', image: 'ghcr.io/oneithan/nexus-nomad:latest' }
    ),
    false
  )
})

test('isNomadManagedContainer distinguishes NOMAD-managed stacks from user external containers', () => {
  assert.equal(isNomadManagedContainer('nomad_jellyfin'), true)
  assert.equal(isNomadManagedContainer('nomad-nomad_navidrome'), true)
  assert.equal(isNomadManagedContainer('jellyfin', 'media-stack'), false)
  assert.equal(isNomadManagedContainer('navidrome', 'navidrome'), false)
})
