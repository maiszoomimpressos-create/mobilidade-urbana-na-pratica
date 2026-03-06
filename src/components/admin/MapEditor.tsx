"use client"

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react"

interface MapEditorProps {
  polygon: number[][]
  onPolygonChange: (polygon: number[][]) => void
  centerLat?: number
  centerLng?: number
  zoom?: number
}

export default function MapEditor({
  polygon,
  onPolygonChange,
  centerLat = -23.5505,
  centerLng = -46.6333,
  zoom = 12,
}: MapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawnItemsRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current) {
      console.log("MapEditor: mapRef.current não existe")
      return
    }

    // Se já existe um mapa, remover antes de criar novo
    if (mapInstanceRef.current) {
      console.log("MapEditor: Removendo mapa existente")
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      drawnItemsRef.current = null
    }

    let isMounted = true
    setError(null)

    const initMap = async () => {
      try {
        console.log("MapEditor: Iniciando carregamento do mapa...")
        
        // Importar Leaflet (compatível com diferentes formas de export)
        const leafletModule = await import("leaflet")
        const L = (leafletModule as any).default ?? leafletModule
        console.log("MapEditor: Leaflet importado")
        
        // Importar CSS do Leaflet
        await import("leaflet/dist/leaflet.css")
        await import("leaflet-draw/dist/leaflet.draw.css")
        console.log("MapEditor: CSS importado")

        if (!isMounted || !mapRef.current) {
          console.log("MapEditor: Componente desmontado ou ref não existe")
          return
        }

        // Fix para ícones do Leaflet
        if (typeof window !== "undefined") {
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          })
        }

        console.log("MapEditor: Criando mapa...", { centerLat, centerLng, zoom })
        
        // Criar mapa
        const map = L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: zoom,
        })

        console.log("MapEditor: Mapa criado, adicionando tiles...")

        // Adicionar tiles do OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        console.log("MapEditor: Tiles adicionados")

        // FeatureGroup para armazenar polígonos desenhados
        const drawnItems = new L.FeatureGroup()
        map.addLayer(drawnItems)
        drawnItemsRef.current = drawnItems

        // Carregar polígono existente se houver
        if (polygon.length > 0) {
          console.log("MapEditor: Carregando polígono existente", polygon.length)
          const latlngs = polygon.map(([lng, lat]) => [lat, lng] as [number, number])
          const existingPoly = L.polygon(latlngs, {
            color: "#2d2d2d",
            fillColor: "#e5e5e5",
            fillOpacity: 0.25,
            weight: 2,
            dashArray: "8, 8",
          })
          drawnItems.addLayer(existingPoly)
          map.fitBounds(existingPoly.getBounds())
        }

        // Importar Leaflet Draw (side-effect, sem default)
        await import("leaflet-draw")

        if (!isMounted) {
          console.log("MapEditor: Componente desmontado antes de adicionar controles")
          return
        }

        console.log("MapEditor: Adicionando controles de desenho...")

        // Configurar controles de desenho usando L.Control.Draw
        const drawControl = new (L as any).Control.Draw({
          edit: {
            featureGroup: drawnItems,
            remove: true,
          },
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: {
                color: "#2d2d2d",
                fillColor: "#e5e5e5",
                fillOpacity: 0.25,
                weight: 2,
                dashArray: "8, 8",
              },
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
        })

        map.addControl(drawControl)

        // Eventos de desenho usando L.Draw.Event
        map.on((L as any).Draw.Event.CREATED, (e: any) => {
          const layer = e.layer
          drawnItems.clearLayers()
          drawnItems.addLayer(layer)
          const latlngs = layer.getLatLngs()[0]
          const coordinates: number[][] = latlngs.map((ll: any) => [ll.lng, ll.lat])
          onPolygonChange(coordinates)
        })

        map.on((L as any).Draw.Event.EDITED, (e: any) => {
          const layers = e.layers
          layers.eachLayer((layer: any) => {
            const latlngs = layer.getLatLngs()[0]
            const coordinates: number[][] = latlngs.map((ll: any) => [ll.lng, ll.lat])
            onPolygonChange(coordinates)
          })
        })

        map.on((L as any).Draw.Event.DELETED, () => {
          onPolygonChange([])
        })

        mapInstanceRef.current = map
        setIsMapReady(true)
        console.log("MapEditor: Mapa inicializado com sucesso!")

        // Forçar redraw do mapa após um pequeno delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 100)

        // Registrar uso do mapa (opcional)
        try {
          await fetch('/api/maps/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerType: 'OPENSTREETMAP', requestType: 'map_load' }),
          })
        } catch (err) {
          // Ignorar erro de registro
        }
      } catch (error) {
        console.error("MapEditor: Erro ao inicializar mapa:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido")
        setIsMapReady(false)
      }
    }

    // Pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      initMap()
    }, 100)

    return () => {
      clearTimeout(timer)
      isMounted = false
      if (mapInstanceRef.current) {
        console.log("MapEditor: Limpando mapa")
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        drawnItemsRef.current = null
      }
    }
  }, [centerLat, centerLng, zoom])

  // Atualizar polígono quando mudar externamente
  useEffect(() => {
    if (!mapInstanceRef.current || !drawnItemsRef.current || !isMapReady) return

    const updatePolygon = async () => {
      try {
        const L = await import("leaflet")
        drawnItemsRef.current.clearLayers()

        if (polygon.length > 0) {
          const latlngs = polygon.map(([lng, lat]) => [lat, lng] as [number, number])
          const poly = L.polygon(latlngs, {
            color: "#2d2d2d",
            fillColor: "#e5e5e5",
            fillOpacity: 0.25,
            weight: 2,
            dashArray: "8, 8",
          })
          drawnItemsRef.current.addLayer(poly)
          mapInstanceRef.current.fitBounds(poly.getBounds())
        }
      } catch (error) {
        console.error("Erro ao atualizar polígono:", error)
      }
    }

    updatePolygon()
  }, [polygon, isMapReady])

  // Atualizar centro do mapa quando mudar
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return
    
    mapInstanceRef.current.setView([centerLat, centerLng], zoom)
    // Forçar redraw
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)
  }, [centerLat, centerLng, zoom, isMapReady])

  return (
    <div className="relative w-full">
      <div
        ref={mapRef}
        className="w-full h-[600px] rounded-lg border border-border overflow-hidden"
        style={{ 
          minHeight: '600px',
          zIndex: 0,
        }}
      />
      {!isMapReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg z-10">
          <div className="text-center p-4">
            <p className="text-destructive font-medium mb-2">Erro ao carregar mapa</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}
      {isMapReady && (
        <div className="absolute top-2 right-2 bg-hero/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-hero-foreground z-[1000]">
          Provedor: OpenStreetMap
        </div>
      )}
    </div>
  )
}
