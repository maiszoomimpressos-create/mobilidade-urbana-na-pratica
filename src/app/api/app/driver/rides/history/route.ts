import { NextRequest, NextResponse } from 'next/server'
import { RideStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateAppDriver } from '@/lib/app-driver-bearer-auth'

export const dynamic = 'force-dynamic'

function numFromDecimal(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0
  const n = Number(v.toString())
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/app/driver/rides/history
 *
 * Corridas concluídas ou canceladas pelo motorista logado (qualquer central).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAppDriver(request)
    if (!auth.ok) return auth.response

    const rows = await prisma.ride.findMany({
      where: {
        driverId: auth.driver.id,
        status: { in: [RideStatus.COMPLETED, RideStatus.CANCELLED] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        originAddress: true,
        destinationAddress: true,
        distance: true,
        estimatedPrice: true,
        finalPrice: true,
        completedAt: true,
        cancelledAt: true,
        updatedAt: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
    })

    const rides = rows.map((r) => {
      const fare = numFromDecimal(r.finalPrice) || numFromDecimal(r.estimatedPrice)
      const ts = r.status === RideStatus.COMPLETED ? r.completedAt : r.cancelledAt
      const when = ts ?? r.updatedAt
      return {
        id: r.id,
        passengerName: 'Passageiro',
        pickupAddress: r.originAddress ?? 'Endereço não informado',
        dropoffAddress: r.destinationAddress ?? '—',
        distance: numFromDecimal(r.distance),
        fare,
        status: r.status === RideStatus.COMPLETED ? 'completed' : 'cancelled',
        completedAt: when.toISOString(),
        rideTenantId: r.tenantId,
        rideCentralName: r.tenant.name,
        rideCentralSlug: r.tenant.slug,
      }
    })

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('[app/driver/rides/history] GET', error)
    return NextResponse.json({ error: 'Erro ao carregar histórico.' }, { status: 500 })
  }
}
