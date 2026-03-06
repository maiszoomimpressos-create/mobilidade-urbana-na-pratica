import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const state = searchParams.get('state')?.trim().toUpperCase()

    if (!query || query.length < 1) {
      return NextResponse.json([])
    }

    const where = {
      ...(state ? { state } : {}),
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { state: { contains: query, mode: 'insensitive' as const } },
      ],
    }

    const cities = await prisma.city.findMany({
      where,
      take: 10,
      orderBy: [
        { name: 'asc' },
        { state: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    })

    // Converter Decimal para number
    const formattedCities = cities.map((city) => ({
      id: city.id,
      name: city.name,
      state: city.state,
      country: city.country,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    }))

    return NextResponse.json(formattedCities)
  } catch (error) {
    console.error('Erro ao buscar cidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

