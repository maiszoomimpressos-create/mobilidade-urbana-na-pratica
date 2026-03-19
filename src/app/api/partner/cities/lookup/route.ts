import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/cities/lookup?name=<nome>&state=<uf>
 * Retorna coords da cidade cadastrada no banco para o mapa do parceiro.
 */
export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name')?.trim() || ''
    const state = request.nextUrl.searchParams.get('state')?.trim() || ''

    if (!name || !state) {
      return NextResponse.json({ city: null })
    }

    const city = await prisma.city.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
        country: 'BR',
      },
      select: {
        id: true,
        name: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    })

    return NextResponse.json({
      city: city
        ? {
            id: city.id,
            name: city.name,
            state: city.state,
            latitude: Number(city.latitude),
            longitude: Number(city.longitude),
          }
        : null,
    })
  } catch (error) {
    console.error('[partner/cities/lookup] GET', error)
    return NextResponse.json({ city: null }, { status: 500 })
  }
}

