import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'

import MapsLayout from '~/layouts/MapsLayout'
import MapComponent from '~/components/maps/MapComponent'
import StyledButton from '~/components/StyledButton'
import { IconArrowLeft, IconCrosshair, IconMapPin, IconPlaneTilt } from '@tabler/icons-react'
import { FileEntry } from '../../types/files'
import Alert from '~/components/Alert'

type MapCommand = {
  id: number
  lat: number
  lng: number
  action: 'fly' | 'marker'
}

export default function Maps(props: {
  maps: { baseAssetsExist: boolean; worldBasemapExists: boolean; regionFiles: FileEntry[] }
}) {
  const [isHoveringUI, setIsHoveringUI] = useState(false)

  const [coordinateSearch, setCoordinateSearch] = useState('')
  const [mapCommand, setMapCommand] = useState<MapCommand | null>(null)
  const [showCoordinatesEnabled, setShowCoordinatesEnabled] = useState(true)

  const parseCoordinates = () => {
    const [latRaw, lngRaw] = coordinateSearch.split(',').map((value) => value.trim())
    const lat = Number(latRaw)
    const lng = Number(lngRaw)

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null
    }

    return { lat, lng }
  }

  const handleCoordinateAction = (action: 'fly' | 'marker') => {
    const coordinates = parseCoordinates()
    if (!coordinates) return

    setMapCommand({
      id: Date.now(),
      ...coordinates,
      action,
    })
  }

  const alertMessage = !props.maps.baseAssetsExist
    ? 'Os recursos base do mapa ainda não foram instalados. Baixe-os primeiro para habilitar a funcionalidade de mapas.'
    : !props.maps.worldBasemapExists
    ? 'O mapa-múndi base ainda não foi baixado, portanto o mapa pode aparecer em branco fora das regiões baixadas. Conecte este NOMAD à internet e baixe-o (~15 MB) nas Configurações de Mapas.'
    : props.maps.regionFiles.length === 0
    ? 'Nenhuma região de mapa foi baixada ainda. Baixe algumas regiões para habilitar a funcionalidade de mapas.'
    : null

  return (
    <MapsLayout>
      <Head title="Mapas" />

      <div className="relative w-full h-screen overflow-hidden">
        {/* Navbar */}
        <div
          className="absolute top-0 left-0 right-0 z-50 flex justify-between p-4 bg-surface-secondary backdrop-blur-sm shadow-sm"
          onMouseEnter={() => setIsHoveringUI(true)}
          onMouseLeave={() => setIsHoveringUI(false)}
        >
          <Link href="/home" className="flex items-center">
            <IconArrowLeft className="mr-2" size={24} />
            <p className="text-lg text-text-secondary">Voltar ao Início</p>
          </Link>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="lat,lng"
              value={coordinateSearch}
              onChange={(event) => setCoordinateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCoordinateAction('fly')
              }}
              className="w-52 rounded border border-border-default bg-surface-primary px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:border-desert-green focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleCoordinateAction('fly')}
              className="rounded border border-border-default bg-surface-primary p-2 text-text-secondary hover:bg-surface-secondary"
              title="Ir para as coordenadas"
            >
              <IconPlaneTilt size={18}/>
            </button>

            <button
              type="button"
              onClick={() => handleCoordinateAction('marker')}
              className="rounded border border-border-default bg-surface-primary p-2 text-text-secondary hover:bg-surface-secondary"
              title="Adicionar marcador nas coordenadas"
            >
              <IconMapPin size={18}/>
            </button>

            <button
              type="button"
              onClick={() => setShowCoordinatesEnabled((prev) => !prev)}
              className={`rounded border border-border-default p-2 transition-colors ${
                showCoordinatesEnabled
                  ? 'bg-desert-green text-white'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
              }`}
              title={showCoordinatesEnabled ? 'Ocultar coordenadas' : 'Mostrar coordenadas'}
            >
              <IconCrosshair size={18}/>
            </button>

            <Link href="/settings/maps" className="mr-4">
              <StyledButton variant="primary" icon="IconSettings">
                Gerenciar Regiões de Mapa
              </StyledButton>
            </Link>
          </div>
        </div>

        {/* Alert */}
        {alertMessage && (
          <div
            className="absolute top-20 left-4 right-4 z-50"
            onMouseEnter={() => setIsHoveringUI(true)}
            onMouseLeave={() => setIsHoveringUI(false)}
          >
            <Alert
              title={alertMessage}
              type="warning"
              variant="solid"
              className="w-full"
              buttonProps={{
                variant: 'secondary',
                children: 'Ir para Configurações de Mapas',
                icon: 'IconSettings',
                onClick: () => router.visit('/settings/maps'),
              }}
            />
          </div>
        )}

        {/* Map */}

        <div className="absolute inset-0">
          <MapComponent
            mapCommand={mapCommand}
            isHoveringUI={isHoveringUI}
            showCoordinatesEnabled={showCoordinatesEnabled}
          />
        </div>
      </div>
    </MapsLayout>
  )
}
