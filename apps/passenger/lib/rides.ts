import { getApiBaseUrl } from '@/lib/apiBaseUrl'

export type LatLng = { latitude: number; longitude: number }

export type RideEstimateResponse = {
  distanceKm: number
  durationMin: number
  estimatedPrice: number
  currency: string
  tripRouteCoords: LatLng[]
  rideType: { id: string; name: string; slug: string }
}

export type CreateRideResponse = {
  ride: {
    id: string
    status: string
    driverAssigned: boolean
    estimatedPrice: number
    distanceKm: number
    durationMin: number | null
    tripRouteCoords: unknown
  }
}

export type TrackRideResponse = {
  rideId: string
  status: string
  estimatedPrice: number | null
  origin: LatLng | null
  originAddress: string | null
  destination: LatLng | null
  destinationAddress: string | null
  tripRouteCoords: LatLng[] | null
  driverPosition: LatLng | null
  approachRouteCoords: LatLng[] | null
}

const base = () => getApiBaseUrl().replace(/\/$/, '')

export async function postRideEstimate(body: {
  tenantSlug: string
  rideTypeId: string
  originLatitude: number
  originLongitude: number
  destinationLatitude: number
  destinationLongitude: number
}): Promise<RideEstimateResponse> {
  const res = await fetch(`${base()}/api/app/rides/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Falha na estimativa')
  }
  return data as RideEstimateResponse
}

export async function postCreateRide(
  token: string,
  body: {
    tenantSlug: string
    rideTypeId: string
    originLatitude: number
    originLongitude: number
    destinationLatitude: number
    destinationLongitude: number
    originAddress?: string | null
    destinationAddress?: string | null
  }
): Promise<CreateRideResponse> {
  const res = await fetch(`${base()}/api/app/rides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Falha ao criar corrida')
  }
  return data as CreateRideResponse
}

export async function getRideTrack(token: string, rideId: string): Promise<TrackRideResponse> {
  const res = await fetch(`${base()}/api/app/rides/${encodeURIComponent(rideId)}/track`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Falha no rastreamento')
  }
  return data as TrackRideResponse
}

export async function postPassengerEnsure(token: string, tenantSlug: string): Promise<void> {
  const res = await fetch(`${base()}/api/app/passenger/ensure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenantSlug }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(typeof data?.error === 'string' ? data.error : 'Falha ao preparar perfil')
  }
}

function asCoordList(raw: unknown): LatLng[] {
  if (!Array.isArray(raw)) return []
  const out: LatLng[] = []
  for (const p of raw) {
    if (p && typeof p === 'object' && 'latitude' in p && 'longitude' in p) {
      const lat = Number((p as LatLng).latitude)
      const lng = Number((p as LatLng).longitude)
      if (Number.isFinite(lat) && Number.isFinite(lng)) out.push({ latitude: lat, longitude: lng })
    }
  }
  return out
}

export function parseTripCoords(raw: unknown): LatLng[] {
  return asCoordList(raw)
}
