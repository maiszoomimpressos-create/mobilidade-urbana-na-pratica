import { prisma } from '@/lib/prisma'
import { haversineKm, parseCoord } from '@/lib/geo-haversine'

const MAX_ASSIGN_KM = 50

/**
 * Motorista online com posição mais recente mais próximo da origem da corrida.
 */
export async function findNearestOnlineDriverId(
  originLat: number,
  originLng: number
): Promise<string | null> {
  const drivers = await prisma.driver.findMany({
    where: {
      status: 'online',
      isActive: true,
    },
    select: {
      id: true,
      positions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { latitude: true, longitude: true },
      },
    },
  })

  let bestId: string | null = null
  let bestKm = Number.POSITIVE_INFINITY

  for (const d of drivers) {
    const p = d.positions[0]
    if (!p) continue
    const lat = parseCoord(p.latitude)
    const lng = parseCoord(p.longitude)
    if (lat == null || lng == null) continue
    const km = haversineKm(originLat, originLng, lat, lng)
    if (km < bestKm && km <= MAX_ASSIGN_KM) {
      bestKm = km
      bestId = d.id
    }
  }

  return bestId
}
