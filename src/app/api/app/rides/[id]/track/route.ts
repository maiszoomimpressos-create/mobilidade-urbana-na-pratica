import { NextRequest, NextResponse } from 'next/server'
import { RideStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateAppPassenger } from '@/lib/app-passenger-bearer-auth'
import { parseCoord } from '@/lib/geo-haversine'
import { fetchDrivingRoute } from '@/lib/maps/directions-route'
import { resolveDynamicRouteParam } from '@/lib/next-route-params'

export const dynamic = 'force-dynamic'

type Coord = { latitude: number; longitude: number }

const approachCache = new Map<string, { expires: number; coordinates: Coord[] }>()
const APPROACH_TTL_MS = 12_000

function cacheKey(rideId: string, lat: number, lng: number): string {
  return `${rideId}:${lat.toFixed(3)}:${lng.toFixed(3)}`
}

/**
 * GET /api/app/rides/:id/track
 * Posição do motorista, rota da viagem e rota aproximada até o embarque (quando aplicável).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rideId = await resolveDynamicRouteParam(context.params, 'id')
    if (!rideId) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const auth = await authenticateAppPassenger(request)
    if (!auth.ok) return auth.response

    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        passengerId: auth.passenger.id,
      },
      select: {
        id: true,
        status: true,
        tenantId: true,
        driverId: true,
        originLatitude: true,
        originLongitude: true,
        originAddress: true,
        destinationLatitude: true,
        destinationLongitude: true,
        destinationAddress: true,
        estimatedPrice: true,
        tripRouteCoords: true,
      },
    })

    if (!ride) {
      return NextResponse.json({ error: 'Corrida não encontrada.' }, { status: 404 })
    }

    const oLat = parseCoord(ride.originLatitude)
    const oLng = parseCoord(ride.originLongitude)
    const dLat = ride.destinationLatitude != null ? parseCoord(ride.destinationLatitude) : null
    const dLng = ride.destinationLongitude != null ? parseCoord(ride.destinationLongitude) : null

    let driverPosition: Coord | null = null
    if (ride.driverId) {
      const last = await prisma.driverPosition.findFirst({
        where: { driverId: ride.driverId },
        orderBy: { createdAt: 'desc' },
        select: { latitude: true, longitude: true },
      })
      if (last) {
        const la = parseCoord(last.latitude)
        const lo = parseCoord(last.longitude)
        if (la != null && lo != null) driverPosition = { latitude: la, longitude: lo }
      }
    }

    let approachRouteCoords: Coord[] | null = null
    const needsApproach =
      ride.driverId &&
      driverPosition &&
      oLat != null &&
      oLng != null &&
      (ride.status === RideStatus.ACCEPTED || ride.status === RideStatus.PENDING)

    if (needsApproach && driverPosition) {
      const key = cacheKey(ride.id, driverPosition.latitude, driverPosition.longitude)
      const cached = approachCache.get(key)
      const now = Date.now()
      if (cached && cached.expires > now) {
        approachRouteCoords = cached.coordinates
      } else {
        const approach = await fetchDrivingRoute(
          driverPosition.latitude,
          driverPosition.longitude,
          oLat,
          oLng,
          ride.tenantId
        )
        if (approach?.coordinates.length) {
          approachRouteCoords = approach.coordinates
          approachCache.set(key, {
            expires: now + APPROACH_TTL_MS,
            coordinates: approach.coordinates,
          })
        }
      }
    }

    return NextResponse.json({
      rideId: ride.id,
      status: ride.status,
      estimatedPrice: ride.estimatedPrice ? Number(ride.estimatedPrice) : null,
      origin:
        oLat != null && oLng != null ? { latitude: oLat, longitude: oLng } : null,
      originAddress: ride.originAddress,
      destination:
        dLat != null && dLng != null ? { latitude: dLat, longitude: dLng } : null,
      destinationAddress: ride.destinationAddress,
      tripRouteCoords: ride.tripRouteCoords,
      driverPosition,
      approachRouteCoords,
    })
  } catch (error) {
    console.error('[app/rides/[id]/track] GET', error)
    return NextResponse.json({ error: 'Erro ao rastrear corrida.' }, { status: 500 })
  }
}
