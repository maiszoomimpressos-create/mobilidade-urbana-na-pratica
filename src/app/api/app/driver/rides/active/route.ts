import { NextRequest, NextResponse } from 'next/server'
import { RideStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateAppDriver } from '@/lib/app-driver-bearer-auth'
import { parseCoord } from '@/lib/geo-haversine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/app/driver/rides/active
 * Corrida atual (ACCEPTED ou IN_PROGRESS) do motorista, com rota e pontos para o mapa.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAppDriver(request)
    if (!auth.ok) return auth.response

    const ride = await prisma.ride.findFirst({
      where: {
        driverId: auth.driver.id,
        status: { in: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        originLatitude: true,
        originLongitude: true,
        originAddress: true,
        destinationLatitude: true,
        destinationLongitude: true,
        destinationAddress: true,
        estimatedPrice: true,
        distance: true,
        duration: true,
        tripRouteCoords: true,
      },
    })

    if (!ride) {
      return NextResponse.json({ ride: null })
    }

    const oLat = parseCoord(ride.originLatitude)
    const oLng = parseCoord(ride.originLongitude)
    const dLat = ride.destinationLatitude != null ? parseCoord(ride.destinationLatitude) : null
    const dLng = ride.destinationLongitude != null ? parseCoord(ride.destinationLongitude) : null

    return NextResponse.json({
      ride: {
        id: ride.id,
        status: ride.status,
        origin: oLat != null && oLng != null ? { latitude: oLat, longitude: oLng } : null,
        originAddress: ride.originAddress,
        destination:
          dLat != null && dLng != null
            ? { latitude: dLat, longitude: dLng }
            : null,
        destinationAddress: ride.destinationAddress,
        estimatedPrice: ride.estimatedPrice ? Number(ride.estimatedPrice) : null,
        distanceKm: ride.distance ? Number(ride.distance) : null,
        durationMin: ride.duration,
        tripRouteCoords: ride.tripRouteCoords,
      },
    })
  } catch (error) {
    console.error('[app/driver/rides/active] GET', error)
    return NextResponse.json({ error: 'Erro ao buscar corrida ativa.' }, { status: 500 })
  }
}
