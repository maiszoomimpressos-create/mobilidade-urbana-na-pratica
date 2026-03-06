"use client"

import { useEffect, useRef, useState } from "react"

interface MapPreviewProps {
  lat: number
  lng: number
  name?: string
  className?: string
  height?: number
  /** Se true, o mapa fica quadrado (aspect-ratio 1:1) em vez de altura fixa */
  aspectSquare?: boolean
  /** Zoom do mapa (ex.: 4 para Brasil, 12 para cidade) */
  zoom?: number
  /** Se false, não exibe marcador (útil para visão inicial do país) */
  showMarker?: boolean
}

/**
 * Mapa simples (Leaflet/OSM) para pré-visualizar a localização de uma cidade
 * antes de adicionar ao banco. Ajuda a se localizar no mundo.
 */
export default function MapPreview({
  lat,
  lng,
  name,
  className = "",
  height = 280,
  aspectSquare = false,
  zoom = 12,
  showMarker = true,
}: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true
    setError(null)

    const init = async () => {
      try {
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        if (!mounted || !containerRef.current) return

        if (typeof window !== "undefined") {
          delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          })
        }

        const map = L.map(containerRef.current, {
          center: [lat, lng],
          zoom,
        })
        mapRef.current = map

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map)

        if (showMarker) {
          L.marker([lat, lng]).addTo(map)
        }
      } catch (e) {
        if (mounted) setError("Erro ao carregar mapa")
      }
    }

    init()
    return () => {
      mounted = false
      if (mapRef.current && typeof (mapRef.current as { remove?: () => void }).remove === "function") {
        (mapRef.current as { remove: () => void }).remove()
      }
      mapRef.current = null
    }
  }, [lat, lng, zoom, showMarker])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground ${aspectSquare ? "aspect-square w-full" : ""} ${className}`}
        style={aspectSquare ? undefined : { height }}
      >
        {error}
      </div>
    )
  }

  return (
    <div className={aspectSquare ? `aspect-square w-full ${className}`.trim() : className}>
      {name && (
        <p className="mb-2 text-sm font-medium text-foreground">
          Localização: {name}
        </p>
      )}
      <div
        ref={containerRef}
        className={`w-full rounded-lg border border-border overflow-hidden ${aspectSquare ? "h-full min-h-0" : ""}`}
        style={aspectSquare ? undefined : { height }}
      />
    </div>
  )
}
