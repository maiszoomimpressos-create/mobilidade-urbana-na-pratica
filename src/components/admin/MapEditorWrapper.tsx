"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Importar CSS do Leaflet globalmente
if (typeof window !== "undefined") {
  import("leaflet/dist/leaflet.css")
  import("leaflet-draw/dist/leaflet.draw.css")
}

const MapEditor = dynamic(() => import("./MapEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    </div>
  ),
})

interface MapEditorWrapperProps {
  polygon: number[][]
  onPolygonChange: (polygon: number[][]) => void
  centerLat?: number
  centerLng?: number
  zoom?: number
}

export default function MapEditorWrapper(props: MapEditorWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    )
  }

  return <MapEditor {...props} />
}

