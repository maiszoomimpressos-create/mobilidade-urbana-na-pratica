import { NextRequest, NextResponse } from 'next/server'
import { RideStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateAppDriver } from '@/lib/app-driver-bearer-auth'
import { resolveDynamicRouteParam } from '@/lib/next-route-params'

export const dynamic = 'force-dynamic'

/**
 * POST /api/app/driver/rides/:id/accept
 *
 * Aceita corrida de qualquer central; não compara `ride.tenantId` com `driver.tenantId`.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rideId = await resolveDynamicRouteParam(context.params, 'id')
    if (!rideId) {
      return NextResponse.json({ error: 'ID da corrida inválido.' }, { status: 400 })
    }

    const auth = await authenticateAppDriver(request)
    if (!auth.ok) return auth.response

    if (auth.driver.status !== 'online') {
      return NextResponse.json({ error: 'Fique online para aceitar corridas.' }, { status: 409 })
    }

    const busy = await prisma.ride.findFirst({
      where: {
        driverId: auth.driver.id,
        status: { in: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
      },
      select: { id: true },
    })
    if (busy) {
      return NextResponse.json(
        { error: 'Você já possui uma corrida em andamento.' },
        { status: 409 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ride.updateMany({
        where: {
          id: rideId,
          status: RideStatus.PENDING,
          driverId: null,
        },
        data: {
          driverId: auth.driver.id,
          status: RideStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      })

      if (updated.count === 0) {
        return { ok: false as const }
      }

      await tx.rideStatusHistory.create({
        data: {
          rideId,
          status: RideStatus.ACCEPTED,
          notes: 'Aceita pelo motorista (app)',
        },
      })

      return { ok: true as const }
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Corrida indisponível ou já atribuída.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ ok: true, rideId })
  } catch (error) {
    console.error('[app/driver/rides/[id]/accept] POST', error)
    return NextResponse.json({ error: 'Erro ao aceitar corrida.' }, { status: 500 })
  }
}
