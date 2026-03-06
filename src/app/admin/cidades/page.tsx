"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Edit, Plus, Search, Loader2, MapPinned, KeyRound } from "lucide-react"
import Link from "next/link"
import CitySearch, { type City as CitySearchCity, type GeoCity } from "@/components/admin/CitySearch"
import MapPreview from "@/components/admin/MapPreview"

interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
  isActive: boolean
  hasCoverage: boolean
  regiaoIntermediariaId?: number
  regiaoIntermediariaNome?: string
  regiaoImediataId?: number
  regiaoImediataNome?: string
}

interface State {
  id: number
  sigla: string
  nome: string
}

interface RegiaoIntermediaria {
  id: number
  nome?: string
  name?: string
}

interface RegiaoImediata {
  id: number
  nome?: string
  name?: string
}

export default function CidadesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  /** Estado selecionado para carregar regiões (dropdown de filtro) */
  const [stateForRegions, setStateForRegions] = useState<string | null>(null)
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(true)
  /** Sugestão do Google selecionada para preview no mapa antes de adicionar */
  const [previewGeo, setPreviewGeo] = useState<GeoCity | null>(null)
  const [addingCity, setAddingCity] = useState(false)
  /** Erro da busca Google (ex.: chave não configurada) para exibir em destaque */
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  /** Resultado do teste da chave do Google */
  const [testResult, setTestResult] = useState<{
    ok: boolean
    keyPresent: boolean
    source: string | null
    message: string
    googleError?: string | null
  } | null>(null)
  const [testingKey, setTestingKey] = useState(false)
  /** Cidades do banco que batem com o termo da busca (exibidas no card ao lado, sem misturar com o Google) */
  const [dbSearchCities, setDbSearchCities] = useState<Pick<City, "id" | "name" | "state" | "country">[]>([])
  /** Regiões IBGE para filtro (carregadas quando seleciona estado) */
  const [regioesIntermediarias, setRegioesIntermediarias] = useState<RegiaoIntermediaria[]>([])
  const [regioesImediatas, setRegioesImediatas] = useState<RegiaoImediata[]>([])
  const [selectedRegiaoIntermediariaId, setSelectedRegiaoIntermediariaId] = useState<number | null>(null)
  const [selectedRegiaoImediataId, setSelectedRegiaoImediataId] = useState<number | null>(null)
  const [loadingRegioes, setLoadingRegioes] = useState(false)
  const [syncingRegions, setSyncingRegions] = useState(false)

  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await fetch("/api/admin/states")
        if (res.ok) {
          const data = await res.json()
          setStates(data)
        }
      } catch (e) {
        console.error("Erro ao carregar estados:", e)
      } finally {
        setLoadingStates(false)
      }
    }
    loadStates()
  }, [])

  const loadCities = async () => {
    setLoadingCities(true)
    try {
      const res = await fetch("/api/admin/cities")
      if (res.ok) {
        const data = await res.json()
        setCities(data)
      } else {
        setCities([])
      }
    } catch (e) {
      console.error("Erro ao carregar cidades:", e)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  useEffect(() => {
    loadCities()
  }, [])

  // Recarregar lista ao voltar para a página (ex.: após salvar em mapear)
  useEffect(() => {
    const onVisible = () => loadCities()
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  // Carregar regiões intermediárias quando seleciona estado (para filtro)
  useEffect(() => {
    if (!stateForRegions) {
      setRegioesIntermediarias([])
      setRegioesImediatas([])
      setSelectedRegiaoIntermediariaId(null)
      setSelectedRegiaoImediataId(null)
      return
    }
    const estado = states.find((s) => s.sigla === stateForRegions)
    if (!estado) return
    setLoadingRegioes(true)
    setSelectedRegiaoIntermediariaId(null)
    setSelectedRegiaoImediataId(null)
    setRegioesImediatas([])
    fetch(`/api/admin/ibge/regioes-intermediarias?estadoId=${estado.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RegiaoIntermediaria[]) => setRegioesIntermediarias(Array.isArray(data) ? data : []))
      .catch(() => setRegioesIntermediarias([]))
      .finally(() => setLoadingRegioes(false))
  }, [stateForRegions, states])

  // Carregar regiões imediatas quando seleciona região intermediária
  useEffect(() => {
    if (selectedRegiaoIntermediariaId == null) {
      setRegioesImediatas([])
      setSelectedRegiaoImediataId(null)
      return
    }
    setLoadingRegioes(true)
    setSelectedRegiaoImediataId(null)
    fetch(`/api/admin/ibge/regioes-imediatas?regiaoIntermediariaId=${selectedRegiaoIntermediariaId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RegiaoImediata[]) => setRegioesImediatas(Array.isArray(data) ? data : []))
      .catch(() => setRegioesImediatas([]))
      .finally(() => setLoadingRegioes(false))
  }, [selectedRegiaoIntermediariaId])

  const mappedCitiesAll = cities.filter((c) => c.hasCoverage)
  const otherCitiesAll = cities.filter((c) => !c.hasCoverage)
  const byRegion = (list: City[]) => {
    let out = list
    // Região imediata é mais específica: filtra por ela quando selecionada.
    // Inclui cidades com regiaoImediataId mesmo se regiaoIntermediariaId estiver null
    // (dados incompletos após "Preencher regiões IBGE" parcial).
    if (selectedRegiaoImediataId != null) {
      out = out.filter((c) => c.regiaoImediataId === selectedRegiaoImediataId)
      return out
    }
    if (selectedRegiaoIntermediariaId != null) {
      out = out.filter((c) => c.regiaoIntermediariaId === selectedRegiaoIntermediariaId)
    }
    return out
  }
  let mappedFiltered = byRegion(mappedCitiesAll)
  if (stateForRegions) {
    mappedFiltered = mappedFiltered.filter((c) => c.state === stateForRegions)
  }
  const otherFiltered = otherCitiesAll.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const otherFilteredByRegion = byRegion(otherFiltered)
  /** Cidades mapeadas agrupadas por estado (para os cards) */
  const mappedByState = states.reduce(
    (acc, s) => {
      const list = mappedFiltered.filter((c) => c.state === s.sigla)
      if (list.length > 0) acc[s.sigla] = { state: s, cities: list }
      return acc
    },
    {} as Record<string, { state: State; cities: City[] }>
  )

  const handleCitySelect = (city: CitySearchCity) => {
    setPreviewGeo(null)
    router.push(`/admin/cidades/${city.id}/mapear`)
  }

  const handleGoogleSuggestionPreview = (geo: GeoCity) => {
    setPreviewGeo(geo)
    setTimeout(() => document.getElementById("map-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
  }

  /** Resultados do Places Autocomplete (só têm place_id; lat/lng ao clicar na cidade) */
  const handleGoogleResultsLoaded = (_results: import("@/components/admin/CitySearch").GooglePlaceSuggestion[]) => {
    setPreviewGeo(null)
  }

  const runGeocodeTest = async () => {
    setTestingKey(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/cities/geocode/test")
      const data = await res.json()
      setTestResult({
        ok: data.ok,
        keyPresent: data.keyPresent,
        source: data.source,
        message: data.message,
        googleError: data.googleError,
      })
    } catch (e) {
      setTestResult({
        ok: false,
        keyPresent: false,
        source: null,
        message: "Falha ao chamar o teste.",
        googleError: String(e),
      })
    } finally {
      setTestingKey(false)
    }
  }

  const handleConfirmAddCity = async () => {
    if (!previewGeo) return
    setAddingCity(true)
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: previewGeo.name,
          state: previewGeo.state,
          country: previewGeo.country,
          latitude: previewGeo.latitude,
          longitude: previewGeo.longitude,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          const searchRes = await fetch(
            `/api/admin/cities/search?q=${encodeURIComponent(previewGeo.name)}&state=${previewGeo.state}`
          )
          if (searchRes.ok) {
            const list = await searchRes.json()
            const existing = list.find(
              (c: City) => c.name === previewGeo.name && c.state === previewGeo.state
            )
            if (existing) {
              setPreviewGeo(null)
              router.push(`/admin/cidades/${existing.id}/mapear`)
              return
            }
          }
        }
        throw new Error(data.error || "Erro ao criar cidade")
      }
      const created: City = await res.json()
      setPreviewGeo(null)
      router.push(`/admin/cidades/${created.id}/mapear`)
    } catch (e) {
      console.error("Erro ao criar cidade:", e)
      alert(e instanceof Error ? e.message : "Erro ao criar cidade")
    } finally {
      setAddingCity(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cidades</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as cidades e áreas de cobertura
          </p>
        </div>
        <Button
          variant="hero"
          className="group"
          onClick={() => {
            document.getElementById("city-search-card")?.scrollIntoView({ behavior: "smooth" })
            setTimeout(() => document.getElementById("city-search-input")?.focus(), 400)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Cidade
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card id="city-search-card" className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Cidade para Mapear</CardTitle>
            <CardDescription className="space-y-1">
              <span className="block">Busca apenas no Google (3+ letras). Clique em uma cidade na lista; o mapa rola para baixo com a localização e o botão &quot;Adicionar e abrir editor&quot;. Cidades já cadastradas aparecem no card ao lado.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CitySearch
              inputId="city-search-input"
              onCitySelect={handleCitySelect}
              onGoogleSuggestionPreview={handleGoogleSuggestionPreview}
              onGoogleResultsLoaded={handleGoogleResultsLoaded}
              onGeocodeError={setGeocodeError}
              onDbResultsLoaded={setDbSearchCities}
              placeholder="Digite o nome da cidade..."
              state={undefined}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runGeocodeTest}
                disabled={testingKey}
              >
                {testingKey ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Testar chave do Google
              </Button>
              {testResult && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    testResult.ok
                      ? "border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200"
                      : "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.source && (
                    <p className="mt-1 text-xs opacity-90">Origem da chave: {testResult.source}</p>
                  )}
                  {testResult.googleError && (
                    <p className="mt-1 text-xs">Google: {testResult.googleError}</p>
                  )}
                  {!testResult.ok && testResult.keyPresent && (
                    <a
                      href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-primary underline"
                    >
                      Ativar Geocoding API no Google Cloud →
                    </a>
                  )}
                </div>
              )}
            </div>
            {geocodeError && (
              <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">{geocodeError}</p>
                <p className="mt-1 text-muted-foreground">
                  Vá em Admin &gt; Mapas, clique em Configurar no card Google Maps e cole a chave de API. No Google Cloud, ative a Geocoding API.
                </p>
                <Link href="/admin/mapas">
                  <Button variant="outline" size="sm" className="mt-3">
                    Abrir Mapas e configurar
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Cidades já cadastradas
            </CardTitle>
            <CardDescription>
              Ao digitar na busca ao lado, aparecem aqui as cidades do banco com esse nome. Clique para abrir o editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbSearchCities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Digite na busca ao lado para listar cidades cadastradas com esse nome.
              </p>
            ) : (
              <ul className="space-y-1 max-h-48 overflow-auto">
                {dbSearchCities.map((city) => (
                  <li key={city.id}>
                    <Link
                      href={`/admin/cidades/${city.id}/mapear`}
                      className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted text-sm"
                    >
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{city.name}</span>
                      <span className="text-muted-foreground">{city.state}, {city.country}</span>
                      <Edit className="w-3 h-3 ml-auto text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Layout: mapa quadrado à esquerda, pesquisa cidades por estado à direita */}
      <div id="map-card" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa quadrado - lado esquerdo */}
        <div className="lg:col-span-2">
          <Card className="border-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPinned className="w-5 h-5" />
                Mapa
              </CardTitle>
              <CardDescription>
                {previewGeo
                  ? `Localização: ${previewGeo.name}, ${previewGeo.state}. Confira e clique em "Adicionar e abrir editor" para criar a cidade.`
                  : "Busque uma cidade acima para ver a localização no mapa."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="w-full h-[420px]">
                <MapPreview
                  lat={previewGeo?.latitude ?? -14.235}
                  lng={previewGeo?.longitude ?? -51.9253}
                  name={previewGeo ? `${previewGeo.name}, ${previewGeo.state}` : undefined}
                  height={420}
                  zoom={previewGeo ? 12 : 4}
                  showMarker={!!previewGeo}
                />
              </div>
              {previewGeo && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="hero"
                    onClick={handleConfirmAddCity}
                    disabled={addingCity}
                  >
                    {addingCity ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar esta cidade e abrir editor
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewGeo(null)}
                    disabled={addingCity}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pesquisa cidades mapeadas por estado - lado direito */}
        <div className="lg:col-span-1">
          <Card className="border-border h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-primary" />
                Cidades mapeadas por estado
                {!loadingCities && mappedFiltered.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({mappedFiltered.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Filtre por estado e região. Clique em uma cidade para abrir o editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros sempre visíveis - permitem voltar ou limpar */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <select
                    value={stateForRegions ?? ""}
                    onChange={(e) => setStateForRegions(e.target.value || null)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loadingStates}
                  >
                    <option value="">Todos os estados</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.sigla}>
                        {s.sigla} - {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
                {stateForRegions && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Região intermediária</label>
                      <select
                        value={selectedRegiaoIntermediariaId ?? ""}
                        onChange={(e) => setSelectedRegiaoIntermediariaId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={loadingRegioes}
                      >
                        <option value="">Todas</option>
                        {regioesIntermediarias.map((r) => (
                          <option key={r.id} value={r.id}>{r.nome ?? r.name ?? String(r.id)}</option>
                        ))}
                      </select>
                    </div>
                    {regioesIntermediarias.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Região imediata</label>
                        <select
                          value={selectedRegiaoImediataId ?? ""}
                          onChange={(e) => setSelectedRegiaoImediataId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={loadingRegioes}
                        >
                          <option value="">Todas</option>
                          {regioesImediatas.map((r) => (
                            <option key={r.id} value={r.id}>{r.nome ?? r.name ?? String(r.id)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={syncingRegions}
                  className="w-full text-xs"
                  onClick={async () => {
                    setSyncingRegions(true)
                    try {
                      const res = await fetch("/api/admin/cities/sync-regions", { method: "POST" })
                      const data = await res.json().catch(() => ({}))
                      if (res.ok) {
                        const msg = data.message ?? "Regiões atualizadas."
                        const detail = data.errors?.[0]
                        alert(detail ? `${msg}\n\nDetalhe da falha: ${detail}` : msg)
                        loadCities()
                      } else {
                        const msg = [data.error, data.detail].filter(Boolean).join(" — ")
                        alert(msg || "Erro ao preencher regiões.")
                      }
                    } finally {
                      setSyncingRegions(false)
                    }
                  }}
                >
                  {syncingRegions ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Preencher regiões IBGE
                </Button>
              </div>

              {/* Lista ou mensagem vazia */}
              {loadingCities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(mappedByState).length === 0 ? (
                <div className="py-6 text-center rounded-lg border border-dashed border-border bg-muted/30">
                  <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    {mappedCitiesAll.length === 0
                      ? "Nenhuma cidade mapeada ainda. Mapeie a área de uma cidade para ela aparecer aqui."
                      : "Nenhuma cidade mapeada com os filtros selecionados. Tente outro estado/região ou limpe os filtros."}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {(stateForRegions || selectedRegiaoIntermediariaId || selectedRegiaoImediataId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStateForRegions(null)
                          setSelectedRegiaoIntermediariaId(null)
                          setSelectedRegiaoImediataId(null)
                        }}
                      >
                        Limpar filtros
                      </Button>
                    )}
                    <Link href="#city-search-card">
                      <Button variant="outline" size="sm">
                        Adicionar e mapear cidade
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1 max-h-[calc(100vh-480px)] min-h-[180px] overflow-auto">
                  {Object.entries(mappedByState).map(([sigla, { state, cities }]) => (
                    <li key={sigla}>
                      <div className="font-medium text-sm text-foreground mb-1">
                        {state.sigla} - {state.nome}
                        <span className="text-muted-foreground font-normal ml-1">({cities.length})</span>
                      </div>
                      <ul className="space-y-0.5 pl-2 border-l border-border">
                        {cities.map((city) => (
                          <li key={city.id}>
                            <Link
                              href={`/admin/cidades/${city.id}/mapear`}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-primary/10 text-sm group"
                            >
                              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="font-medium truncate">{city.name}</span>
                              <Edit className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cidades cadastradas sem área mapeada */}
      <section className="space-y-3 mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Cidades cadastradas (sem área mapeada)
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar na lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingCities ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            otherFilteredByRegion.map((city) => (
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
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        Área não mapeada
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link href={`/admin/cidades/${city.id}/mapear`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Mapear área
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {!loadingCities && otherFilteredByRegion.length === 0 && (mappedCitiesAll.length > 0 || otherCitiesAll.length > 0) && (
        <Card className="border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {searchTerm
                ? `Nenhuma cidade encontrada com o termo "${searchTerm}".`
                : "Nenhuma cidade cadastrada sem área mapeada."}
            </p>
          </CardContent>
        </Card>
      )}
      {!loadingCities && cities.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma cidade cadastrada. Use a busca acima para adicionar e mapear.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
