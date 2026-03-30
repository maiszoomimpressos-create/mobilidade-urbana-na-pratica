import { getApiBaseUrl } from '@/lib/apiBaseUrl'

export type NearestTenant = {
  slug: string
  name: string
  distanceKm: number
  primaryCityId: string | null
  primaryCityName: string | null
  primaryCityState: string | null
}

export async function fetchNearestTenants(
  latitude: number,
  longitude: number
): Promise<NearestTenant[]> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  })
  try {
    const res = await fetch(`${base}/api/app/tenants/nearest?${params}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json().catch(() => ({}))
    if (!Array.isArray(data?.tenants)) return []
    return data.tenants as NearestTenant[]
  } catch {
    return []
  }
}
