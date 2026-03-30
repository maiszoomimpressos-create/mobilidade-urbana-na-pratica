import { prisma } from '@/lib/prisma'
import { normalizeCompare, resolveBrazilianUf } from '@/lib/br-state-uf'
import { computeNearestTenantsForPoint, type NearestTenantRow } from '@/lib/tenants-nearest'

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  'MobilidadeUrbanaRegister/1.0 (https://github.com/)'

export type TenantAtAddressBrief = {
  id: string
  slug: string
  name: string
}

export type ResolveTenantsAtAddressResult = {
  latitude: number
  longitude: number
  cityName: string | null
  stateUf: string | null
  /** Centrais com cidade cadastrada igual ao município detectado no endereço. */
  tenantsAtLocation: TenantAtAddressBrief[]
  /** Ordenadas por proximidade (mesmo critério de /api/app/tenants/nearest). */
  nearestTenants: NearestTenantRow[]
  /** Central sugerida para vínculo (primeira da região ou a mais próxima). */
  suggestedTenant: { slug: string; name: string } | null
  /** nearest_only = nenhuma central com cidade correspondente no cadastro. */
  suggestionReason: 'city_match' | 'nearest_only'
}

async function reverseNominatimCity(
  lat: number,
  lng: number
): Promise<{ cityName: string | null; stateUf: string | null }> {
  const url = new URL(NOMINATIM_REVERSE)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'pt-BR')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': NOMINATIM_UA },
    next: { revalidate: 0 },
  })
  if (!res.ok) return { cityName: null, stateUf: null }

  const data = (await res.json()) as {
    address?: Record<string, string>
  }
  const a = data.address
  if (!a) return { cityName: null, stateUf: null }

  const cityRaw =
    a.city ||
    a.town ||
    a.municipality ||
    a.city_district ||
    a.village ||
    null

  const stateRaw = a['ISO3166-2-lvl4'] || a.state || null
  let stateUf: string | null = null
  if (typeof stateRaw === 'string' && stateRaw.startsWith('BR-')) {
    stateUf = stateRaw.replace(/^BR-/i, '').toUpperCase()
  } else if (stateRaw) {
    stateUf = resolveBrazilianUf(stateRaw)
  }

  return {
    cityName: cityRaw ? cityRaw.trim() : null,
    stateUf,
  }
}

async function findTenantsByCityNameAndUf(
  cityName: string,
  stateUf: string
): Promise<TenantAtAddressBrief[]> {
  const norm = normalizeCompare(cityName)
  const cities = await prisma.city.findMany({
    where: { state: stateUf, isActive: true },
    select: { id: true, name: true },
  })
  const cityRow = cities.find((c) => normalizeCompare(c.name) === norm)
  if (!cityRow) return []

  const links = await prisma.tenantCity.findMany({
    where: {
      isActive: true,
      cityId: cityRow.id,
      tenant: { isActive: true, approvalStatus: 'approved' },
    },
    select: {
      tenant: { select: { id: true, slug: true, name: true } },
    },
  })

  return links.map((l) => ({
    id: l.tenant.id,
    slug: l.tenant.slug,
    name: l.tenant.name,
  }))
}

/**
 * Geocodifica o centro aproximado do município (Nominatim) e aplica a mesma regra de `resolveTenantsAtAddress`.
 * Útil para fluxo CEP / cidade sem GPS.
 */
export async function resolveTenantsFromCityAndUf(
  cityName: string,
  stateUf: string
): Promise<ResolveTenantsAtAddressResult | null> {
  const trimmedCity = cityName.trim()
  const uf = stateUf.trim().toUpperCase()
  if (!trimmedCity || uf.length !== 2) return null

  const url = new URL(NOMINATIM_SEARCH)
  url.searchParams.set('q', `${trimmedCity}, ${uf}, Brasil`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'pt-BR')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': NOMINATIM_UA },
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const arr = (await res.json()) as Array<{ lat?: string; lon?: string }>
  if (!Array.isArray(arr) || arr.length === 0) return null
  const lat = Number(arr[0].lat)
  const lon = Number(arr[0].lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  return resolveTenantsAtAddress(lat, lon)
}

/**
 * Resolve centrais “no município” (nome + UF) e fallback pela mais próxima.
 */
export async function resolveTenantsAtAddress(
  latitude: number,
  longitude: number
): Promise<ResolveTenantsAtAddressResult> {
  const { cityName, stateUf } = await reverseNominatimCity(latitude, longitude)

  let tenantsAtLocation: TenantAtAddressBrief[] = []
  if (cityName && stateUf) {
    tenantsAtLocation = await findTenantsByCityNameAndUf(cityName, stateUf)
  }

  const nearestTenants = await computeNearestTenantsForPoint(latitude, longitude)

  let suggestedTenant: { slug: string; name: string } | null = null
  let suggestionReason: 'city_match' | 'nearest_only' = 'nearest_only'

  if (tenantsAtLocation.length === 1) {
    suggestedTenant = { slug: tenantsAtLocation[0].slug, name: tenantsAtLocation[0].name }
    suggestionReason = 'city_match'
  } else if (tenantsAtLocation.length > 1) {
    const firstNearestSlug = nearestTenants[0]?.slug
    const pick =
      (firstNearestSlug &&
        tenantsAtLocation.find((x) => x.slug === firstNearestSlug)) ||
      tenantsAtLocation[0]
    suggestedTenant = { slug: pick.slug, name: pick.name }
    suggestionReason = 'city_match'
  } else if (nearestTenants.length > 0) {
    suggestedTenant = {
      slug: nearestTenants[0].slug,
      name: nearestTenants[0].name,
    }
    suggestionReason = 'nearest_only'
  } else {
    const fallback = await prisma.tenant.findFirst({
      where: { isActive: true, approvalStatus: 'approved' },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true },
    })
    if (fallback) {
      suggestedTenant = { slug: fallback.slug, name: fallback.name }
      suggestionReason = 'nearest_only'
    }
  }

  return {
    latitude,
    longitude,
    cityName,
    stateUf,
    tenantsAtLocation,
    nearestTenants,
    suggestedTenant,
    suggestionReason,
  }
}
