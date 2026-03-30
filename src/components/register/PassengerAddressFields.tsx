'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCepInput, digitsCep, isValidCepDigits } from '@/lib/cep-br'

type GeocodeHit = { label: string; latitude: number; longitude: number }

type TenantBrief = { id: string; slug: string; name: string }

export type TenantResolvePayload = {
  cityName: string | null
  stateUf: string | null
  tenantsAtLocation: TenantBrief[]
  nearestTenants: Array<{
    slug: string
    name: string
    distanceKm: number
    primaryCityName: string | null
    primaryCityState: string | null
  }>
  suggestedTenant: { slug: string; name: string } | null
  suggestionReason: 'city_match' | 'nearest_only'
}

type ApiResolve = TenantResolvePayload & {
  addressLabel?: string
  latitude: number
  longitude: number
}

type Props = {
  addressInput: string
  setAddressInput: (v: string) => void
  selectedPlace: GeocodeHit | null
  setSelectedPlace: (v: GeocodeHit | null) => void
  tenantResolve: TenantResolvePayload | null
  setTenantResolve: (v: TenantResolvePayload | null) => void
  tenantSlug: string
  setTenantSlug: (v: string) => void
}

async function postResolveRegion(body: Record<string, unknown>): Promise<ApiResolve> {
  const res = await fetch('/api/public/tenants-resolve-region', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as ApiResolve & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao resolver região.')
  }
  return data as ApiResolve
}

export function PassengerAddressFields({
  addressInput,
  setAddressInput,
  selectedPlace,
  setSelectedPlace,
  tenantResolve,
  setTenantResolve,
  tenantSlug,
  setTenantSlug,
}: Props) {
  const [cepInput, setCepInput] = useState('')
  const [geoHits, setGeoHits] = useState<GeocodeHit[]>([])
  const [geoOpen, setGeoOpen] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [loadingGps, setLoadingGps] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyResolve = useCallback(
    (data: ApiResolve) => {
      const label =
        data.addressLabel ||
        (data.cityName && data.stateUf
          ? `${data.cityName} - ${data.stateUf}`
          : `Ponto (${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)})`)
      setSelectedPlace({
        label,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      setTenantResolve({
        cityName: data.cityName,
        stateUf: data.stateUf,
        tenantsAtLocation: data.tenantsAtLocation,
        nearestTenants: data.nearestTenants,
        suggestedTenant: data.suggestedTenant,
        suggestionReason: data.suggestionReason,
      })
      if (data.suggestedTenant) {
        setTenantSlug(data.suggestedTenant.slug)
      }
    },
    [setSelectedPlace, setTenantResolve, setTenantSlug]
  )

  const fetchGeo = useCallback(async (q: string) => {
    if (q.length < 4) {
      setGeoHits([])
      return
    }
    setLoadingGeo(true)
    try {
      const res = await fetch(`/api/public/geocode-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setGeoHits(Array.isArray(data.hits) ? data.hits : [])
    } catch {
      setGeoHits([])
    } finally {
      setLoadingGeo(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPlace) return
    if (geoTimer.current) clearTimeout(geoTimer.current)
    geoTimer.current = setTimeout(() => {
      void fetchGeo(addressInput.trim())
    }, 450)
    return () => {
      if (geoTimer.current) clearTimeout(geoTimer.current)
    }
  }, [addressInput, fetchGeo, selectedPlace])

  const pickAddress = async (hit: GeocodeHit) => {
    setHint(null)
    setAddressInput(hit.label)
    setGeoOpen(false)
    setGeoHits([])
    setCepInput('')
    setLoadingTenants(true)
    setTenantResolve(null)
    setTenantSlug('')
    try {
      const data = await postResolveRegion({
        latitude: hit.latitude,
        longitude: hit.longitude,
      })
      applyResolve(data)
    } catch (e) {
      setTenantResolve(null)
      setHint(e instanceof Error ? e.message : 'Não foi possível carregar as centrais.')
    } finally {
      setLoadingTenants(false)
    }
  }

  const lookupCep = async () => {
    setHint(null)
    if (!isValidCepDigits(cepInput)) {
      setHint('Informe um CEP com 8 dígitos.')
      return
    }
    setLoadingCep(true)
    setTenantResolve(null)
    setTenantSlug('')
    setSelectedPlace(null)
    setAddressInput('')
    setGeoHits([])
    try {
      const data = await postResolveRegion({ cep: digitsCep(cepInput) })
      applyResolve(data)
      setAddressInput(data.addressLabel || '')
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'CEP inválido ou não encontrado.')
    } finally {
      setLoadingCep(false)
    }
  }

  const useGps = () => {
    setHint(null)
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setHint('Geolocalização não disponível neste navegador.')
      return
    }
    setLoadingGps(true)
    setTenantResolve(null)
    setTenantSlug('')
    setSelectedPlace(null)
    setAddressInput('')
    setCepInput('')
    setGeoHits([])
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await postResolveRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          applyResolve(data)
          setAddressInput(data.addressLabel || '')
        } catch (e) {
          setHint(e instanceof Error ? e.message : 'Não foi possível usar a localização.')
        } finally {
          setLoadingGps(false)
        }
      },
      (err) => {
        setLoadingGps(false)
        if (err.code === 1) {
          setHint('Permissão de localização negada. Use CEP ou busque o endereço abaixo.')
        } else {
          setHint('Não foi possível obter sua localização. Tente CEP ou endereço.')
        }
      },
      { enableHighAccuracy: false, timeout: 18000, maximumAge: 120000 }
    )
  }

  return (
    <>
      <div className="space-y-2">
        <Label>Onde você está (escolha uma opção)</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loadingGps}
            onClick={() => void useGps()}
          >
            {loadingGps ? 'Obtendo localização…' : 'Usar minha localização'}
          </Button>
          <div className="flex flex-1 gap-2 min-w-0">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="CEP (apenas números)"
              value={cepInput}
              onChange={(e) => {
                setCepInput(formatCepInput(e.target.value))
                setHint(null)
              }}
              className="min-w-0"
              maxLength={9}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={loadingCep || !isValidCepDigits(cepInput)}
              onClick={() => void lookupCep()}
            >
              {loadingCep ? '…' : 'Buscar CEP'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Localização usa o GPS do aparelho (com sua permissão). CEP consulta os Correios (ViaCEP) e
          identifica a cidade para sugerir a central.
        </p>
      </div>

      {hint && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">{hint}</div>
      )}

      <div className="relative">
        <Label htmlFor="address">Ou busque pelo endereço completo</Label>
        <Input
          id="address"
          name="address"
          type="text"
          autoComplete="street-address"
          required
          value={addressInput}
          onChange={(e) => {
            setAddressInput(e.target.value)
            setSelectedPlace(null)
            setTenantResolve(null)
            setTenantSlug('')
            setCepInput('')
            setGeoOpen(true)
          }}
          onFocus={() => setGeoOpen(true)}
          className="mt-1"
          placeholder="Rua, número, bairro, cidade…"
        />
        {geoOpen && geoHits.length > 0 && !selectedPlace && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white text-sm shadow-md">
            {geoHits.map((h) => (
              <li key={`${h.latitude},${h.longitude}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted"
                  onClick={() => void pickAddress(h)}
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {loadingGeo && addressInput.length >= 4 && !selectedPlace && (
          <p className="mt-1 text-xs text-muted-foreground">Buscando endereços…</p>
        )}
      </div>

      {selectedPlace && (
        <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          {loadingTenants ? (
            <p>Carregando centrais para sua região…</p>
          ) : tenantResolve ? (
            <>
              {tenantResolve.cityName && tenantResolve.stateUf && (
                <p className="mb-2">
                  <span className="font-medium">Região:</span> {tenantResolve.cityName} —{' '}
                  {tenantResolve.stateUf}
                </p>
              )}
              {tenantResolve.tenantsAtLocation.length > 0 ? (
                <>
                  <p className="font-medium text-green-800">Centrais atendendo este município:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {tenantResolve.tenantsAtLocation.map((t) => (
                      <li key={t.id}>{t.name}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-amber-900">
                  Não há central cadastrada exatamente neste município no sistema. Você pode concluir o
                  cadastro normalmente; sugerimos a central mais próxima abaixo.
                </p>
              )}
              {tenantResolve.suggestedTenant && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="tenantSlug">Central para seu perfil de passageiro</Label>
                  {tenantResolve.tenantsAtLocation.length > 1 ? (
                    <select
                      id="tenantSlug"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                    >
                      {tenantResolve.tenantsAtLocation.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium">
                      {tenantResolve.suggestedTenant.name}
                      {tenantResolve.suggestionReason === 'nearest_only' &&
                        tenantResolve.nearestTenants[0] && (
                          <span className="font-normal text-muted-foreground">
                            {' '}
                            (~{tenantResolve.nearestTenants[0].distanceKm} km da referência da central)
                          </span>
                        )}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-amber-900">Não foi possível carregar as centrais. Tente outro endereço.</p>
          )}
        </div>
      )}
    </>
  )
}
