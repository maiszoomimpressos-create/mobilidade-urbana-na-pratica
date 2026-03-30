import { getApiBaseUrl } from '@/lib/apiBaseUrl'

export type AddressSuggestion = {
  label: string
  placeId: string | null
  latitude: number | null
  longitude: number | null
}

export async function fetchAddressSuggestions(
  accessToken: string,
  input: string,
  options: {
    tenantSlug: string
    latitude?: number | null
    longitude?: number | null
  }
): Promise<AddressSuggestion[]> {
  const q = input.trim()
  if (q.length < 3) return []

  const base = getApiBaseUrl().replace(/\/$/, '')
  const params = new URLSearchParams({
    input: q,
    tenantSlug: options.tenantSlug,
  })
  if (options.latitude != null && options.longitude != null) {
    params.set('latitude', String(options.latitude))
    params.set('longitude', String(options.longitude))
  }

  const res = await fetch(`${base}/api/app/address-autocomplete?${params}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  if (!Array.isArray(data?.suggestions)) return []
  return data.suggestions as AddressSuggestion[]
}
