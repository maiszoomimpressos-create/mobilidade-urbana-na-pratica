import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/cities/options?q=<texto>
 * Lista cidades ativas para seleção no cadastro de central.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

    const cities = await prisma.city.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { state: { contains: q.toUpperCase(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
      take: 50,
      select: {
        id: true,
        name: true,
        state: true,
        latitude: true,
        longitude: true,
      },
    })

    return NextResponse.json({
      cities: cities.map((city) => ({
        id: city.id,
        name: city.name,
        state: city.state,
        latitude: Number(city.latitude),
        longitude: Number(city.longitude),
      })),
    })
  } catch (error) {
    console.error('[partner/cities/options] GET', error)
    return NextResponse.json({ error: 'Erro ao listar cidades.' }, { status: 500 })
  }
}
