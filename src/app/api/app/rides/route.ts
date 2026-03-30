import { NextRequest, NextResponse } from 'next/server'
import { Prisma, RideStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { fetchDrivingRoute } from '@/lib/maps/directions-route'
import { estimatePriceFromRideType } from '@/lib/ride-pricing'
import { ensurePassengerForTenant } from '@/lib/app-passenger-bearer-auth'
import { findNearestOnlineDriverId } from '@/lib/dispatch-nearest-driver'
import { resolveTenantForAppSlug } from '@/lib/tenant-resolve-app'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Body = {
  tenantSlug?: string
  rideTypeId?: string
  originLatitude?: number
  originLongitude?: number
  destinationLatitude?: number
  destinationLongitude?: number
  originAddress?: string | null
  destinationAddress?: string | null
}

/**
 * POST /api/app/rides
 * Cria corrida com tarifa e rota da central; tenta atribuir motorista online mais próximo.
 * Bearer Supabase obrigatório.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user: supabaseUser },
      error: authErr,
    } = await supabase.auth.getUser(token)
    if (authErr || !supabaseUser?.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Coordenadas inválidas.' }, { status: 400 })
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
        { error: 'Não foi possível calcular a rota.' },
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

    const passenger = await ensurePassengerForTenant(supabaseUser.id, tenant.id)
    const nearestDriverId = await findNearestOnlineDriverId(oLat, oLng)

    const now = new Date()
    const assigned = nearestDriverId != null

    const ride = await prisma.ride.create({
      data: {
        tenantId: tenant.id,
        passengerId: passenger.id,
        driverId: nearestDriverId,
        rideTypeId: rideType.id,
        status: assigned ? RideStatus.ACCEPTED : RideStatus.PENDING,
        originLatitude: new Prisma.Decimal(oLat.toFixed(8)),
        originLongitude: new Prisma.Decimal(oLng.toFixed(8)),
        originAddress: body.originAddress?.trim() || null,
        destinationLatitude: new Prisma.Decimal(dLat.toFixed(8)),
        destinationLongitude: new Prisma.Decimal(dLng.toFixed(8)),
        destinationAddress: body.destinationAddress?.trim() || null,
        estimatedPrice: new Prisma.Decimal(estimatedPrice.toFixed(2)),
        distance: new Prisma.Decimal(distanceKm.toFixed(2)),
        duration: durationMin,
        tripRouteCoords: route.coordinates as unknown as Prisma.InputJsonValue,
        acceptedAt: assigned ? now : null,
      },
      select: {
        id: true,
        status: true,
        driverId: true,
        estimatedPrice: true,
        distance: true,
        duration: true,
        tripRouteCoords: true,
      },
    })

    await prisma.rideStatusHistory.create({
      data: {
        rideId: ride.id,
        status: ride.status,
        notes: assigned
          ? 'Criada e atribuída ao motorista mais próximo'
          : 'Criada — aguardando motorista',
      },
    })

    return NextResponse.json({
      ride: {
        id: ride.id,
        status: ride.status,
        driverAssigned: assigned,
        estimatedPrice: Number(ride.estimatedPrice),
        distanceKm: ride.distance ? Number(ride.distance) : distanceKm,
        durationMin: ride.duration,
        tripRouteCoords: ride.tripRouteCoords,
      },
    })
  } catch (error) {
    console.error('[app/rides] POST', error)
    return NextResponse.json({ error: 'Erro ao criar corrida.' }, { status: 500 })
  }
}
