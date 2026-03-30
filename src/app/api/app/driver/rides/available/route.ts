import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateAppDriver } from '@/lib/app-driver-bearer-auth'

export const dynamic = 'force-dynamic'

function numFromDecimal(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0
  const n = Number(v.toString())
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/app/driver/rides/available
 *
 * Lista corridas PENDING sem motorista, de qualquer central ativa.
 * Preço e tipo já vêm da corrida (central da corrida = `ride.tenantId`).
 * O `driver.tenantId` é só a central de vínculo/cadastro.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAppDriver(request)
    if (!auth.ok) return auth.response

    if (auth.driver.status !== 'online') {
      return NextResponse.json({ rides: [] })
    }

    const rows = await prisma.ride.findMany({
      where: {
        status: 'PENDING',
        driverId: null,
        tenant: { isActive: true, approvalStatus: 'approved' },
      },
      orderBy: { requestedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        requestedAt: true,
        originAddress: true,
        destinationAddress: true,
        distance: true,
        estimatedPrice: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
    })

    const rides = rows.map((r) => ({
      id: r.id,
      passengerName: 'Passageiro',
      pickupAddress: r.originAddress ?? 'Endereço não informado',
      dropoffAddress: r.destinationAddress ?? '—',
      distance: numFromDecimal(r.distance),
      estimatedFare: numFromDecimal(r.estimatedPrice),
      createdAt: r.requestedAt.toISOString(),
      rideTenantId: r.tenantId,
      rideCentralName: r.tenant.name,
      rideCentralSlug: r.tenant.slug,
    }))

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('[app/driver/rides/available] GET', error)
    return NextResponse.json({ error: 'Erro ao listar corridas.' }, { status: 500 })
  }
}
