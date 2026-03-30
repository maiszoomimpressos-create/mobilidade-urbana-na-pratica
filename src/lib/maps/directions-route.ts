import { MapProviderManager } from '@/lib/maps/MapProviderManager'
import { decodeGooglePolyline } from '@/lib/polyline-decode'

export type RouteCoordinate = { latitude: number; longitude: number }

export type DirectionsRouteResult = {
  distanceM: number
  durationSec: number
  coordinates: RouteCoordinate[]
}

function flipLngLatToLatLng(ring: number[][]): RouteCoordinate[] {
  const out: RouteCoordinate[] = []
  for (const pt of ring) {
    if (pt.length >= 2) out.push({ latitude: pt[1], longitude: pt[0] })
  }
  return out
}

async function directionsGoogle(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number,
  apiKey: string,
  tenantId: string | null
): Promise<DirectionsRouteResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
  url.searchParams.set('origin', `${oLat},${oLng}`)
  url.searchParams.set('destination', `${dLat},${dLng}`)
  url.searchParams.set('mode', 'driving')
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = (await res.json()) as {
    status: string
    routes?: Array<{
      legs?: Array<{ distance?: { value: number }; duration?: { value: number } }>
      overview_polyline?: { points?: string }
    }>
  }
  if (data.status !== 'OK' || !data.routes?.[0]) return null

  await MapProviderManager.recordUsage('GOOGLE_MAPS', 'directions', undefined, tenantId)

  const route = data.routes[0]
  const leg = route.legs?.[0]
  const enc = route.overview_polyline?.points
  if (!leg || !enc) return null

  return {
    distanceM: leg.distance?.value ?? 0,
    durationSec: leg.duration?.value ?? 0,
    coordinates: decodeGooglePolyline(enc),
  }
}

async function directionsMapbox(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number,
  token: string,
  tenantId: string | null
): Promise<DirectionsRouteResult | null> {
  const coords = `${oLng},${oLat};${dLng},${dLat}`
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`
  )
  url.searchParams.set('access_token', token)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = (await res.json()) as {
    routes?: Array<{
      distance?: number
      duration?: number
      geometry?: { coordinates?: number[][] }
    }>
  }
  const r = data.routes?.[0]
  if (!r?.geometry?.coordinates?.length) return null

  await MapProviderManager.recordUsage('MAPBOX', 'directions', undefined, tenantId)

  return {
    distanceM: r.distance ?? 0,
    durationSec: Math.round(r.duration ?? 0),
    coordinates: flipLngLatToLatLng(r.geometry.coordinates),
  }
}

/** OSRM demo público — fallback sem chave (não usar volume alto). */
async function directionsOsrm(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number
): Promise<DirectionsRouteResult | null> {
  const path = `${oLng},${oLat};${dLng},${dLat}`
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as {
    routes?: Array<{
      distance?: number
      duration?: number
      geometry?: { coordinates?: number[][] }
    }>
  }
  const r = data.routes?.[0]
  if (!r?.geometry?.coordinates?.length) return null

  return {
    distanceM: r.distance ?? 0,
    durationSec: Math.round(r.duration ?? 0),
    coordinates: flipLngLatToLatLng(r.geometry.coordinates),
  }
}

/**
 * Rota veicular entre dois pontos. Usa provedor ativo (Google/Mapbox) ou OSRM.
 */
export async function fetchDrivingRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  tenantId: string | null
): Promise<DirectionsRouteResult | null> {
  const provider = await MapProviderManager.getActiveProvider(tenantId)

  if (provider?.type === 'GOOGLE_MAPS' && provider.apiKey) {
    const r = await directionsGoogle(
      originLat,
      originLng,
      destLat,
      destLng,
      provider.apiKey,
      tenantId
    )
    if (r?.coordinates.length) return r
  }

  if (provider?.type === 'MAPBOX' && provider.apiKey) {
    const r = await directionsMapbox(
      originLat,
      originLng,
      destLat,
      destLng,
      provider.apiKey,
      tenantId
    )
    if (r?.coordinates.length) return r
  }

  return directionsOsrm(originLat, originLng, destLat, destLng)
}
