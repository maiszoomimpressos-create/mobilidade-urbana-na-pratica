import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cities?state=SP&regiaoIntermediariaId=4101&regiaoImediataId=41001
 * Lista cidades do banco com filtro opcional por estado e/ou região IBGE.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')?.trim().toUpperCase()
    const regiaoIntermediariaId = searchParams.get('regiaoIntermediariaId')
    const regiaoImediataId = searchParams.get('regiaoImediataId')

    const where: { state?: string; regiaoIntermediariaId?: number; regiaoImediataId?: number } = {}
    if (state) where.state = state
    if (regiaoIntermediariaId) {
      const n = parseInt(regiaoIntermediariaId, 10)
      if (!Number.isNaN(n)) where.regiaoIntermediariaId = n
    }
    if (regiaoImediataId) {
      const n = parseInt(regiaoImediataId, 10)
      if (!Number.isNaN(n)) where.regiaoImediataId = n
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        isActive: true,
        coverageArea: true,
        regiaoIntermediariaId: true,
        regiaoIntermediariaNome: true,
        regiaoImediataId: true,
        regiaoImediataNome: true,
      },
    })

    const list = cities.map((c) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      country: c.country,
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      isActive: c.isActive,
      hasCoverage: !!c.coverageArea && typeof c.coverageArea === 'object',
      regiaoIntermediariaId: c.regiaoIntermediariaId ?? undefined,
      regiaoIntermediariaNome: c.regiaoIntermediariaNome ?? undefined,
      regiaoImediataId: c.regiaoImediataId ?? undefined,
      regiaoImediataNome: c.regiaoImediataNome ?? undefined,
    }))

    return NextResponse.json(list)
  } catch (error) {
    console.error('Erro ao listar cidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cities
 * Cria uma cidade (ex.: a partir do resultado do Google Geocoding).
 * Body: { name, state, country?, latitude, longitude }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, state, country = 'BR', latitude, longitude } = body

    if (!name || !state || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, state, latitude, longitude' },
        { status: 400 }
      )
    }

    const city = await prisma.city.create({
      data: {
        name: String(name).trim(),
        state: String(state).trim().toUpperCase().slice(0, 2),
        country: String(country || 'BR').trim().slice(0, 2),
        latitude,
        longitude,
      },
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    })

    return NextResponse.json({
      id: city.id,
      name: city.name,
      state: city.state,
      country: city.country,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cidade já cadastrada com esse nome e estado' },
        { status: 409 }
      )
    }
    console.error('Erro ao criar cidade:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cidade' },
      { status: 500 }
    )
  }
}
