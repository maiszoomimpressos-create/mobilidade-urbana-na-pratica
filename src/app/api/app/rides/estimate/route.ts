import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchDrivingRoute } from '@/lib/maps/directions-route'
import { estimatePriceFromRideType } from '@/lib/ride-pricing'
import { resolveTenantForAppSlug } from '@/lib/tenant-resolve-app'

export const dynamic = 'force-dynamic'

type Body = {
  tenantSlug?: string
  rideTypeId?: string
  originLatitude?: number
  originLongitude?: number
  destinationLatitude?: number
  destinationLongitude?: number
  destinationAddress?: string | null
}

/**
 * POST /api/app/rides/estimate
 * Corpo JSON: tenantSlug, rideTypeId, originLatitude, originLongitude, destinationLatitude, destinationLongitude
 * Calcula distância/tempo por rota e preço conforme TenantRideType da central.
 * Público (sem Bearer) para pré-visualização no app.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body
    const slug = typeof body.tenantSlug === 'string' ? body.tenantSlug.trim() : ''
    const rideTypeId = typeof body.rideTypeId === 'string' ? body.rideTypeId.trim() : ''
    const oLat = Number(body.originLatitude)
    const oLng = Number(body.originLongitude)
    const dLat = Number(body.destinationLatitude)
    const dLng = Number(body.destinationLongitude)

    if (!slug || !rideTypeId) {
      return NextResponse.json(
        { error: 'Informe tenantSlug e rideTypeId.' },
        { status: 400 }
      )
    }
    if (
      !Number.isFinite(oLat) ||
      !Number.isFinite(oLng) ||
      !Number.isFinite(dLat) ||
      !Number.isFinite(dLng)
    ) {
      return NextResponse.json(
        { error: 'Coordenadas de origem e destino inválidas.' },
        { status: 400 }
      )
    }

    const tenant = await resolveTenantForAppSlug(slug)
    if (!tenant) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    const rideType = await prisma.tenantRideType.findFirst({
      where: {
        id: rideTypeId,
        tenantId: tenant.id,
        isActive: true,
      },
    })
    if (!rideType) {
      return NextResponse.json({ error: 'Tipo de corrida inválido.' }, { status: 404 })
    }

    const route = await fetchDrivingRoute(oLat, oLng, dLat, dLng, tenant.id)
    if (!route || route.coordinates.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível calcular a rota. Tente outro destino ou configure mapas (Google/Mapbox).' },
        { status: 503 }
      )
    }

    const distanceKm = route.distanceM / 1000
    const durationMin = Math.max(1, Math.ceil(route.durationSec / 60))
    const estimatedPrice = estimatePriceFromRideType(
      rideType.basePrice,
      rideType.pricePerKm,
      rideType.pricePerMin,
      distanceKm,
      durationMin
    )

    return NextResponse.json({
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMin,
      estimatedPrice,
      currency: 'BRL',
      tripRouteCoords: route.coordinates,
      rideType: {
        id: rideType.id,
        name: rideType.name,
        slug: rideType.slug,
      },
    })
  } catch (error) {
    console.error('[app/rides/estimate] POST', error)
    return NextResponse.json({ error: 'Erro ao estimar corrida.' }, { status: 500 })
  }
}
