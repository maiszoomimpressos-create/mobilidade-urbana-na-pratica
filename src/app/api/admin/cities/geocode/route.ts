import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'

export const dynamic = 'force-dynamic'

const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

interface AutocompletePrediction {
  place_id: string
  description?: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

interface AutocompleteResponse {
  status: string
  predictions?: AutocompletePrediction[]
  error_message?: string
}

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface PlaceDetailsResult {
  geometry?: { location: { lat: number; lng: number } }
  address_components?: AddressComponent[]
}

interface PlaceDetailsResponse {
  status: string
  result?: PlaceDetailsResult
  error_message?: string
}

/** Extrai nome da cidade, UF e país dos address_components (Place Details). */
function parseAddressComponents(components: AddressComponent[]): { name: string; state: string; country: string } | null {
  let locality = ''
  let admin1 = ''
  let country = 'BR'
  for (const c of components) {
    if (c.types.includes('locality')) locality = c.long_name
    if (c.types.includes('administrative_area_level_2') && !locality) locality = c.long_name
    if (c.types.includes('administrative_area_level_1')) admin1 = c.short_name || c.long_name
    if (c.types.includes('country')) country = c.short_name || 'BR'
  }
  if (!locality) return null
  return { name: locality, state: admin1 || '', country }
}

/** Parseia secondary_text "PR, Brazil" → state + country. */
function parseSecondaryText(secondary: string): { state: string; country: string } {
  const parts = secondary.split(',').map((s) => s.trim())
  const state = parts[0]?.length === 2 ? parts[0].toUpperCase() : parts[0] || ''
  const country = parts[1] || 'Brasil'
  return { state, country: country === 'Brazil' ? 'Brasil' : country }
}

async function getGoogleApiKey(session: { user?: { email?: string | null } | null }): Promise<{ apiKey: string; tenantId: string | null } | null> {
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email ?? '' },
    select: { tenantUsers: { take: 1, select: { tenantId: true } } },
  })
  const tenantId = user?.tenantUsers?.[0]?.tenantId ?? null
  if (tenantId) {
    const tenantGoogle = await prisma.tenantMapProviderConfig.findUnique({
      where: {
        tenantId_mapProviderType: { tenantId, mapProviderType: 'GOOGLE_MAPS' },
      },
      select: { apiKey: true, isActive: true },
    })
    if (tenantGoogle?.isActive && tenantGoogle.apiKey) return { apiKey: tenantGoogle.apiKey, tenantId }
  }
  const googleGlobal = await prisma.mapProvider.findFirst({
    where: { type: 'GOOGLE_MAPS', isActive: true },
    select: { apiKey: true },
  })
  if (googleGlobal?.apiKey) return { apiKey: googleGlobal.apiKey, tenantId: null }
  return null
}

/**
 * GET /api/admin/cities/geocode?q=<termo>  → lista de cidades (Places Autocomplete)
 * GET /api/admin/cities/geocode?place_id=<id> → detalhes (lat/lng) (Place Details)
 * Usa Places Autocomplete para sugestões e Place Details para coordenadas ao selecionar.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const keyResult = await getGoogleApiKey(session)
    if (!keyResult) {
      return NextResponse.json(
        { error: 'Google Maps não configurado. Configure em Admin > Mapas.' },
        { status: 503 }
      )
    }
    const { apiKey, tenantId } = keyResult

    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('place_id')?.trim()
    const q = searchParams.get('q')?.trim()

    if (placeId) {
      const detailsUrl = new URL(PLACES_DETAILS_URL)
      detailsUrl.searchParams.set('place_id', placeId)
      detailsUrl.searchParams.set('fields', 'geometry,address_components')
      detailsUrl.searchParams.set('key', apiKey)
      detailsUrl.searchParams.set('language', 'pt-BR')

      const res = await fetch(detailsUrl.toString())
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Falha ao consultar Google Place Details' },
          { status: 502 }
        )
      }
      const data: PlaceDetailsResponse = await res.json()
      if (data.status !== 'OK') {
        return NextResponse.json(
          { error: data.error_message || 'Place não encontrado' },
          { status: 502 }
        )
      }
      const result = data.result
      if (!result?.geometry?.location || !result.address_components) {
        return NextResponse.json(
          { error: 'Resposta do Google sem geometria ou endereço' },
          { status: 502 }
        )
      }
      const parsed = parseAddressComponents(result.address_components)
      if (!parsed) {
        return NextResponse.json(
          { error: 'Não foi possível extrair nome da cidade' },
          { status: 502 }
        )
      }
      await MapProviderManager.recordUsage('GOOGLE_MAPS', 'place_details', undefined, tenantId)
      return NextResponse.json({
        name: parsed.name,
        state: parsed.state,
        country: parsed.country,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      })
    }

    if (!q || q.length < 3) {
      return NextResponse.json([])
    }

    const autocompleteUrl = new URL(PLACES_AUTOCOMPLETE_URL)
    autocompleteUrl.searchParams.set('input', q)
    autocompleteUrl.searchParams.set('types', '(cities)')
    autocompleteUrl.searchParams.set('components', 'country:br')
    autocompleteUrl.searchParams.set('language', 'pt-BR')
    autocompleteUrl.searchParams.set('key', apiKey)

    const res = await fetch(autocompleteUrl.toString())
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao consultar Google Places Autocomplete' },
        { status: 502 }
      )
    }
    const data: AutocompleteResponse = await res.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: data.error_message || 'Erro no Google Places' },
        { status: 502 }
      )
    }

    const predictions = data.predictions || []
    const seen = new Set<string>()
    const results: { name: string; state: string; country: string; place_id: string }[] = []

    for (const p of predictions) {
      if (!p.place_id) continue
      const main = p.structured_formatting?.main_text || p.description?.split(',')[0]?.trim() || ''
      const secondary = p.structured_formatting?.secondary_text || ''
      const { state, country } = parseSecondaryText(secondary)
      const key = `${main}|${state}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        name: main,
        state,
        country: country || 'Brasil',
        place_id: p.place_id,
      })
      if (results.length >= 20) break
    }

    await MapProviderManager.recordUsage('GOOGLE_MAPS', 'places_autocomplete', undefined, tenantId)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Erro no geocode:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cidades no Google' },
      { status: 500 }
    )
  }
}
