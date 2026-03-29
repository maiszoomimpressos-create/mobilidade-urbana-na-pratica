import { getApiBaseUrl } from '@/lib/apiBaseUrl'

export type AppRideType = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  basePrice: string
  pricePerKm: string
  pricePerMin: string
  cityId: string | null
  cityLabel: string | null
}

export async function fetchAppRideTypes(
  tenantSlug: string,
  cityId?: string | null
): Promise<AppRideType[]> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const params = new URLSearchParams({ slug: tenantSlug })
  if (cityId) {
    params.set('cityId', cityId)
  }
  const res = await fetch(`${base}/api/app/ride-types?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    return []
  }
  const json = await res.json().catch(() => ({}))
  if (!Array.isArray(json?.rideTypes)) {
    return []
  }
  return json.rideTypes as AppRideType[]
}
