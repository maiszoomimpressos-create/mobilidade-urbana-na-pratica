import { prisma } from '@/lib/prisma'
import { haversineKm, parseCoord } from '@/lib/geo-haversine'

export type NearestTenantRow = {
  slug: string
  name: string
  distanceKm: number
  primaryCityId: string | null
  primaryCityName: string | null
  primaryCityState: string | null
}

/**
 * Centrais ativas/aprovadas ordenadas pela distância até o centro da cidade vinculada mais próxima do ponto.
 */
export async function computeNearestTenantsForPoint(
  lat: number,
  lng: number
): Promise<NearestTenantRow[]> {
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      approvalStatus: 'approved',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      tenantCities: {
        where: { isActive: true },
        select: {
          city: {
            select: {
              id: true,
              name: true,
              state: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  })

  const rows: NearestTenantRow[] = []

  for (const t of tenants) {
    let bestKm = Number.POSITIVE_INFINITY
    let bestCity: {
      id: string
      name: string
      state: string
    } | null = null

    for (const tc of t.tenantCities) {
      const c = tc.city
      const clat = parseCoord(c.latitude)
      const clng = parseCoord(c.longitude)
      if (clat == null || clng == null) continue
      const km = haversineKm(lat, lng, clat, clng)
      if (km < bestKm) {
        bestKm = km
        bestCity = { id: c.id, name: c.name, state: c.state }
      }
    }

    if (bestCity != null && Number.isFinite(bestKm)) {
      rows.push({
        slug: t.slug,
        name: t.name,
        distanceKm: Math.round(bestKm * 10) / 10,
        primaryCityId: bestCity.id,
        primaryCityName: bestCity.name,
        primaryCityState: bestCity.state,
      })
    }
  }

  rows.sort((a, b) => a.distanceKm - b.distanceKm)
  return rows
}
