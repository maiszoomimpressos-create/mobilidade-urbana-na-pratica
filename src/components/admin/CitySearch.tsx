"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface GeoCity {
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

/** Sugestão do Places Autocomplete: pode ter só place_id; lat/lng vêm ao buscar detalhes */
export interface GooglePlaceSuggestion {
  name: string
  state: string
  country: string
  place_id: string
  latitude?: number
  longitude?: number
}

interface CitySearchProps {
  onCitySelect: (city: City) => void
  placeholder?: string
  className?: string
  /** UF do estado para restringir a busca (ex: "SP") */
  state?: string
  /** Incluir sugestões do Google Maps (geocode) além do banco */
  useGoogleGeocode?: boolean
  /** id do input para foco externo (ex.: botão "Nova Cidade") */
  inputId?: string
  /** Se informado, ao clicar em sugestão do Google abre o preview no mapa em vez de criar direto */
  onGoogleSuggestionPreview?: (geo: GeoCity) => void
  /** Chamado quando os resultados do Google chegam da API (lista pode ter place_id; lat/lng ao clicar) */
  onGoogleResultsLoaded?: (results: GooglePlaceSuggestion[]) => void
  /** Chamado quando a busca no Google falha (ex.: chave não configurada); o pai pode exibir a mensagem */
  onGeocodeError?: (message: string | null) => void
  /** Chamado quando há resultados do banco (para exibir em bloco separado, sem misturar com o Google) */
  onDbResultsLoaded?: (cities: City[]) => void
}

export default function CitySearch({
  onCitySelect,
  placeholder = "Buscar cidade...",
  className,
  state,
  useGoogleGeocode = true,
  inputId,
  onGoogleSuggestionPreview,
  onGoogleResultsLoaded,
  onGeocodeError,
  onDbResultsLoaded,
}: CitySearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [googleResults, setGoogleResults] = useState<GooglePlaceSuggestion[]>([])
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const query = searchTerm.trim()
    if (query.length < 1) {
      setGoogleResults([])
      setIsOpen(false)
      setIsLoadingGoogle(false)
      onGoogleResultsLoaded?.([])
      onGeocodeError?.(null)
      onDbResultsLoaded?.([])
      return
    }

    setGoogleResults([])
    if (query.length < 3) {
      onGoogleResultsLoaded?.([])
      setIsOpen(false)
      setIsLoadingGoogle(false)
    } else {
      setIsOpen(true)
      setIsLoadingGoogle(true)
    }

    const timer = setTimeout(async () => {
      if (query.length < 1) return

      const searchDb = async () => {
        try {
          const params = new URLSearchParams({ q: query })
          if (state) params.set("state", state)
          const response = await fetch(`/api/admin/cities/search?${params}`)
          if (!response.ok) throw new Error("Erro ao buscar")
          const data = await response.json()
          const list = Array.isArray(data) ? data : []
          onDbResultsLoaded?.(list)
        } catch (error) {
          console.error("Erro ao buscar cidades:", error)
          onDbResultsLoaded?.([])
        }
      }

      searchDb()

      if (query.length >= 3) {
        const searchGoogle = async () => {
          if (!useGoogleGeocode) return
          setIsLoadingGoogle(true)
          onGeocodeError?.(null)
          try {
            const params = new URLSearchParams({ q: query })
            if (state) params.set("state", state)
            const response = await fetch(`/api/admin/cities/geocode?${params}`)
            const errBody = await response.json().catch(() => ({}))
            if (!response.ok) {
              const msg = errBody?.error || (response.status === 503 ? "Google Maps não configurado." : "Erro ao buscar no Google.")
              setGoogleResults([])
              onGoogleResultsLoaded?.([])
              onGeocodeError?.(msg)
              return
            }
            const list = Array.isArray(errBody) ? errBody : []
            setGoogleResults(list)
            onGoogleResultsLoaded?.(list)
            onGeocodeError?.(null)
          } catch (error) {
            console.error("Erro ao buscar Google:", error)
            setGoogleResults([])
            onGoogleResultsLoaded?.([])
            onGeocodeError?.("Falha na conexão com o servidor.")
          } finally {
            setIsLoadingGoogle(false)
          }
        }
        searchGoogle()
      } else {
        setGoogleResults([])
        onGoogleResultsLoaded?.([])
        setIsLoadingGoogle(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [searchTerm, state, useGoogleGeocode, onDbResultsLoaded, onGeocodeError, onGoogleResultsLoaded])

  const hasResults = googleResults.length > 0
  const stillLoading = isLoadingGoogle

  const handleSelect = (city: City) => {
    onCitySelect(city)
    setSearchTerm(`${city.name}, ${city.state}`)
    setIsOpen(false)
  }

  const handleSelectGoogle = async (geo: GeoCity) => {
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: geo.name,
          state: geo.state,
          country: geo.country,
          latitude: geo.latitude,
          longitude: geo.longitude,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          // Cidade já existe: buscar id e redirecionar
          const searchRes = await fetch(
            `/api/admin/cities/search?q=${encodeURIComponent(geo.name)}&state=${geo.state}`
          )
          if (searchRes.ok) {
            const list = await searchRes.json()
            const existing = list.find(
              (c: City) => c.name === geo.name && c.state === geo.state
            )
            if (existing) {
              handleSelect(existing)
              return
            }
          }
        }
        throw new Error(data.error || "Erro ao criar cidade")
      }
      const created: City = await res.json()
      handleSelect(created)
    } catch (e) {
      console.error("Erro ao criar cidade:", e)
      alert(e instanceof Error ? e.message : "Erro ao criar cidade")
    }
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length >= 3 && (hasResults || stillLoading) && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isLoadingGoogle && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && searchTerm.trim().length >= 3 && stillLoading && googleResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Buscando no Google...
        </div>
      )}

      {isOpen && searchTerm.trim().length >= 3 && googleResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-72 overflow-auto">
          <div className="p-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Google Maps — criar e mapear
            </p>
            {googleResults.map((item, i) => (
              <button
                key={item.place_id || `${item.name}-${item.state}-${i}`}
                onClick={async () => {
                  let geo: GeoCity
                  if ("place_id" in item && item.place_id && (item.latitude == null || item.longitude == null)) {
                    try {
                      const res = await fetch(`/api/admin/cities/geocode?place_id=${encodeURIComponent(item.place_id)}`)
                      if (!res.ok) throw new Error("Falha ao buscar detalhes")
                      const details = await res.json()
                      geo = {
                        name: details.name,
                        state: details.state,
                        country: details.country,
                        latitude: details.latitude,
                        longitude: details.longitude,
                      }
                    } catch (e) {
                      console.error(e)
                      onGeocodeError?.("Não foi possível obter a localização da cidade.")
                      return
                    }
                  } else {
                    geo = {
                      name: item.name,
                      state: item.state,
                      country: item.country,
                      latitude: (item as GeoCity).latitude,
                      longitude: (item as GeoCity).longitude,
                    }
                  }
                  if (onGoogleSuggestionPreview) {
                    onGoogleSuggestionPreview(geo)
                    setIsOpen(false)
                  } else {
                    handleSelectGoogle(geo)
                  }
                }}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 rounded-md"
              >
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.state}, {item.country}
                  </p>
                </div>
                <span className="text-xs text-primary">Criar</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && searchTerm.trim().length >= 3 && !stillLoading && googleResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground text-sm">
          <p>Nenhuma sugestão do Google para esse nome.</p>
          <p className="mt-1">Configure a chave em Admin &gt; Mapas e ative a <strong>Places API</strong> no Google Cloud.</p>
        </div>
      )}
      {searchTerm.trim().length === 2 && (
        <p className="mt-2 text-xs text-muted-foreground">Digite 3 letras ou mais para buscar no Google.</p>
      )}
    </div>
  )
}
