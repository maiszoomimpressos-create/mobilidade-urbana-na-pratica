import { API_URL } from '@/lib/api'

export type LatLng = { latitude: number; longitude: number }

export type ActiveRidePayload = {
  id: string
  status: string
  origin: LatLng | null
  originAddress: string | null
  destination: LatLng | null
  destinationAddress: string | null
  estimatedPrice: number | null
  distanceKm: number | null
  durationMin: number | null
  tripRouteCoords: unknown
}

function parseCoords(raw: unknown): LatLng[] {
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

export { parseCoords as parseTripCoords }

export async function fetchDriverActiveRide(token: string): Promise<ActiveRidePayload | null> {
  const res = await fetch(`${API_URL}/api/app/driver/rides/active`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  if (!data?.ride) return null
  return data.ride as ActiveRidePayload
}

export async function postDriverLocation(
  token: string,
  body: {
    latitude: number
    longitude: number
    accuracy?: number | null
    heading?: number | null
    speed?: number | null
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/app/driver/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(typeof j?.error === 'string' ? j.error : 'Falha ao enviar localização')
  }
}
