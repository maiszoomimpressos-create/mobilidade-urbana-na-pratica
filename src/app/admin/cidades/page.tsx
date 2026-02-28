"use client"

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Edit, Plus, Search } from "lucide-react"
import Link from "next/link"
import CitySearch from "@/components/admin/CitySearch"

// Mock data - depois será substituído por dados reais da API
const cities = [
  {
    id: "1",
    name: "São Paulo",
    state: "SP",
    country: "BR",
    isActive: true,
    hasCoverage: true,
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    id: "2",
    name: "Rio de Janeiro",
    state: "RJ",
    country: "BR",
    isActive: true,
    hasCoverage: false,
    latitude: -22.9068,
    longitude: -43.1729,
  },
  {
    id: "3",
    name: "Belo Horizonte",
    state: "MG",
    country: "BR",
    isActive: false,
    hasCoverage: false,
    latitude: -19.9167,
    longitude: -43.9345,
  },
]

interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export default function CidadesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCitySelect = (city: City) => {
    setSelectedCity(city)
    // Redirecionar para página de mapeamento
    router.push(`/admin/cidades/${city.id}/mapear`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cidades</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as cidades e áreas de cobertura
          </p>
        </div>
        <Button variant="hero" className="group">
          <Plus className="w-4 h-4 mr-2" />
          Nova Cidade
        </Button>
      </div>

      {/* Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Cidade para Mapear</CardTitle>
            <CardDescription>
              Use a busca avançada para encontrar e mapear uma cidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CitySearch
              onCitySelect={handleCitySelect}
              placeholder="Digite o nome da cidade..."
            />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Filtrar Lista</CardTitle>
            <CardDescription>
              Filtre a lista de cidades abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar na lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCities.map((city) => (
          <Card
            key={city.id}
            className="border-border hover:border-primary/30 transition-all hover:shadow-lg"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-display">{city.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {city.state}, {city.country}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {city.isActive ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      Ativa
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                      Inativa
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {city.hasCoverage ? (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      Área mapeada
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      Área não mapeada
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/cidades/${city.id}/mapear`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      {city.hasCoverage ? "Editar Mapa" : "Mapear Área"}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma cidade encontrada com o termo "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

