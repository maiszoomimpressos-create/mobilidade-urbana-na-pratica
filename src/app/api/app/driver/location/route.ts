import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticateAppDriver } from '@/lib/app-driver-bearer-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/app/driver/location
 * Body: { latitude, longitude, accuracy?, heading?, speed? }
 * Grava posição para rastreamento pelo passageiro.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAppDriver(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const lat = Number(body?.latitude)
    const lng = Number(body?.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'latitude e longitude obrigatórios.' }, { status: 400 })
    }

    const accuracy = body?.accuracy != null ? Number(body.accuracy) : null
    const heading = body?.heading != null ? Number(body.heading) : null
    const speed = body?.speed != null ? Number(body.speed) : null

    await prisma.driverPosition.create({
      data: {
        driverId: auth.driver.id,
        latitude: new Prisma.Decimal(lat.toFixed(8)),
        longitude: new Prisma.Decimal(lng.toFixed(8)),
        accuracy: Number.isFinite(accuracy ?? NaN) ? accuracy : null,
        heading: Number.isFinite(heading ?? NaN) ? heading : null,
        speed: Number.isFinite(speed ?? NaN) ? speed : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[app/driver/location] POST', error)
    return NextResponse.json({ error: 'Erro ao gravar localização.' }, { status: 500 })
  }
}
