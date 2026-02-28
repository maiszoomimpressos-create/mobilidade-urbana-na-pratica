"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Trash2, MapPin, Search } from "lucide-react"
import CitySearch from "@/components/admin/CitySearch"
import MapEditorWrapper from "@/components/admin/MapEditorWrapper"

interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export default function MapearCidadePage() {
  const params = useParams()
  const router = useRouter()
  const cityId = params.id as string
  const [city, setCity] = useState<City | null>(null)
  const [polygon, setPolygon] = useState<number[][]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState(12)

  // Carregar cidade do banco
  useEffect(() => {
    const loadCity = async () => {
      try {
        const response = await fetch(`/api/admin/cities/${cityId}/coverage`)
        if (!response.ok) {
          // Se a cidade não existe, usar coordenadas padrão (São Paulo)
          console.warn("Cidade não encontrada, usando coordenadas padrão")
          setCity({
            id: cityId,
            name: "Cidade",
            state: "SP",
            country: "BR",
            latitude: -23.5505,
            longitude: -46.6333,
          })
          setMapCenter({
            lat: -23.5505,
            lng: -46.6333,
          })
          return
        }
        
        const data = await response.json()
        setCity({
          id: data.id,
          name: data.name,
          state: data.state,
          country: data.country,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        })
        setMapCenter({
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        })

        // Se já existe área de cobertura, carregar polígono
        if (data.coverageArea && data.coverageArea.coordinates) {
          const coords = data.coverageArea.coordinates[0]
          setPolygon(coords)
        }
      } catch (error) {
        console.error("Erro ao carregar cidade:", error)
        // Fallback para coordenadas padrão
        setCity({
          id: cityId,
          name: "Cidade",
          state: "SP",
          country: "BR",
          latitude: -23.5505,
          longitude: -46.6333,
        })
        setMapCenter({
          lat: -23.5505,
          lng: -46.6333,
        })
      }
    }

    if (cityId) {
      loadCity()
    } else {
      // Se não tem cityId, usar coordenadas padrão
      setMapCenter({
        lat: -23.5505,
        lng: -46.6333,
      })
    }
  }, [cityId])

  const handleCitySelect = (selectedCity: City) => {
    setCity(selectedCity)
    setMapCenter({
      lat: selectedCity.latitude,
      lng: selectedCity.longitude,
    })
    setMapZoom(12)
    // Atualizar URL se necessário
    if (selectedCity.id !== cityId) {
      router.push(`/admin/cidades/${selectedCity.id}/mapear`)
    }
  }

  const handleSave = async () => {
    try {
      // Salvar polígono no banco
      const response = await fetch(`/api/admin/cities/${cityId}/coverage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverageArea: {
            type: "Polygon",
            coordinates: [polygon],
          },
        }),
      })

      if (!response.ok) throw new Error("Erro ao salvar")

      alert("Área de cobertura salva com sucesso!")
      router.push("/admin/cidades")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar área de cobertura")
    }
  }

  const handleClear = () => {
    if (confirm("Deseja limpar o polígono desenhado?")) {
      setPolygon([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Mapear Área de Cobertura
          </h1>
          <p className="text-muted-foreground mt-2">
            {city ? `${city.name}, ${city.state}` : "Carregando..."} - Desenhe o polígono que define a área de cobertura
          </p>
        </div>
      </div>

      {/* Busca de Cidade */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cidade
          </CardTitle>
          <CardDescription>
            Busque e selecione uma cidade para mapear ou alterar a cidade atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CitySearch
            onCitySelect={handleCitySelect}
            placeholder="Digite o nome da cidade..."
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Editor */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Editor de Mapa</CardTitle>
              <CardDescription>
                Clique no mapa para adicionar pontos e formar o polígono
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {mapCenter ? (
                <MapEditorWrapper
                  polygon={polygon}
                  onPolygonChange={setPolygon}
                  centerLat={mapCenter.lat}
                  centerLng={mapCenter.lng}
                  zoom={mapZoom}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Carregando cidade...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions and Actions */}
        <div className="space-y-6">
          {/* Instructions */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p>Clique no mapa para adicionar pontos ao polígono</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p>Clique no último ponto para fechar o polígono</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p>Arraste os pontos para ajustar a área</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p>Mínimo de 3 pontos para formar um polígono</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pontos:</span>
                <span className="font-medium text-foreground">{polygon.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-foreground">
                  {polygon.length >= 3 ? (
                    <span className="text-primary">Válido</span>
                  ) : (
                    <span className="text-muted-foreground">Incompleto</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="hero"
              className="w-full group"
              onClick={handleSave}
              disabled={polygon.length < 3}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Área
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClear}
              disabled={polygon.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

