import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const GOOGLE_AUTOCOMPLETE = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export type AddressSuggestion = {
  label: string
  placeId: string | null
  latitude: number | null
  longitude: number | null
}

const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  'MobilidadeUrbanaPassenger/1.0 (https://github.com/)'

async function resolveTenantIdFromSlug(slug: string | null): Promise<string | null> {
  if (!slug || slug === 'mai-drive') return null
  const t = await prisma.tenant.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  })
  return t?.id ?? null
}

async function suggestionsGoogle(
  input: string,
  apiKey: string,
  tenantId: string | null,
  lat: number | null,
  lng: number | null
): Promise<AddressSuggestion[]> {
  const url = new URL(GOOGLE_AUTOCOMPLETE)
  url.searchParams.set('input', input)
  url.searchParams.set('types', 'geocode')
  url.searchParams.set('components', 'country:br')
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('key', apiKey)
  if (lat != null && lng != null) {
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', '50000')
  }

  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = (await res.json()) as {
    status: string
    predictions?: Array<{
      description?: string
      place_id?: string
    }>
  }
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return []

  await MapProviderManager.recordUsage('GOOGLE_MAPS', 'places_autocomplete', undefined, tenantId)

  const out: AddressSuggestion[] = []
  for (const p of data.predictions || []) {
    if (!p.description) continue
    out.push({
      label: p.description,
      placeId: p.place_id ?? null,
      latitude: null,
      longitude: null,
    })
    if (out.length >= 10) break
  }
  return out
}

async function suggestionsMapbox(
  input: string,
  token: string,
  tenantId: string | null,
  lat: number | null,
  lng: number | null
): Promise<AddressSuggestion[]> {
  const path = encodeURIComponent(input.trim())
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${path}.json`)
  url.searchParams.set('access_token', token)
  url.searchParams.set('country', 'br')
  url.searchParams.set('limit', '10')
  url.searchParams.set('language', 'pt')
  url.searchParams.set('types', 'address,place,locality,neighborhood')
  if (lat != null && lng != null) {
    url.searchParams.set('proximity', `${lng},${lat}`)
  }

  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = (await res.json()) as {
    features?: Array<{
      place_name?: string
      center?: [number, number]
    }>
  }

  await MapProviderManager.recordUsage('MAPBOX', 'geocoding_forward', undefined, tenantId)

  const out: AddressSuggestion[] = []
  for (const f of data.features || []) {
    if (!f.place_name) continue
    const [x, y] = f.center ?? []
    out.push({
      label: f.place_name,
      placeId: null,
      latitude: typeof y === 'number' ? y : null,
      longitude: typeof x === 'number' ? x : null,
    })
    if (out.length >= 10) break
  }
  return out
}

async function suggestionsNominatim(
  input: string,
  lat: number | null,
  lng: number | null
): Promise<AddressSuggestion[]> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', input)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '10')
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('addressdetails', '0')
  if (lat != null && lng != null) {
    const d = 0.35
    url.searchParams.set('viewbox', `${lng - d},${lat + d},${lng + d},${lat - d}`)
    url.searchParams.set('bounded', '1')
  }

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
  })
  if (!res.ok) return []
  const rows = (await res.json()) as Array<{
    display_name?: string
    lat?: string
    lon?: string
  }>

  await MapProviderManager.recordUsage('OPENSTREETMAP', 'nominatim_search', undefined, null)

  const out: AddressSuggestion[] = []
  for (const r of rows) {
    if (!r.display_name) continue
    const la = r.lat != null ? Number(r.lat) : NaN
    const lo = r.lon != null ? Number(r.lon) : NaN
    out.push({
      label: r.display_name,
      placeId: null,
      latitude: Number.isFinite(la) ? la : null,
      longitude: Number.isFinite(lo) ? lo : null,
    })
    if (out.length >= 10) break
  }
  return out
}

/**
 * GET /api/app/address-autocomplete?input=&latitude=&longitude=&tenantSlug=
 * Sugestões de endereço com viés pela localização do passageiro (quando informada).
 * Requer usuário autenticado (Supabase Bearer).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user: authUser },
      error: authErr,
    } = await supabase.auth.getUser(token)
    if (authErr || !authUser?.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const input = sp.get('input')?.trim() ?? ''
    if (input.length < 3) {
      return NextResponse.json({ suggestions: [] as AddressSuggestion[] })
    }

    const latRaw = sp.get('latitude')
    const lngRaw = sp.get('longitude')
    const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : null
    const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : null
    const latOk = lat != null && Number.isFinite(lat)
    const lngOk = lng != null && Number.isFinite(lng)
    const biasLat = latOk && lngOk ? lat : null
    const biasLng = latOk && lngOk ? lng : null

    const tenantSlug = sp.get('tenantSlug')?.trim() || null
    const tenantId = await resolveTenantIdFromSlug(tenantSlug)

    const provider = await MapProviderManager.getActiveProvider(tenantId)

    let suggestions: AddressSuggestion[] = []

    if (provider?.type === 'GOOGLE_MAPS' && provider.apiKey) {
      suggestions = await suggestionsGoogle(input, provider.apiKey, tenantId, biasLat, biasLng)
    } else if (provider?.type === 'MAPBOX' && provider.apiKey) {
      suggestions = await suggestionsMapbox(input, provider.apiKey, tenantId, biasLat, biasLng)
    } else if (provider?.type === 'OPENSTREETMAP') {
      suggestions = await suggestionsNominatim(input, biasLat, biasLng)
    }

    if (suggestions.length === 0) {
      suggestions = await suggestionsNominatim(input, biasLat, biasLng)
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[app/address-autocomplete] GET', error)
    return NextResponse.json({ error: 'Erro ao buscar endereços.' }, { status: 500 })
  }
}
