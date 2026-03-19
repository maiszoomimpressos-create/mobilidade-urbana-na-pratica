import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/cities/[id]
 * Atualiza dados cadastrais da cidade (não altera coverageArea — use /coverage).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cityId = params.id
    const body = await request.json().catch(() => ({}))

    const exists = await prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: 'Cidade não encontrada' }, { status: 404 })
    }

    const data: {
      name?: string
      state?: string
      country?: string
      latitude?: number
      longitude?: number
      ibgeCode?: string | null
      isActive?: boolean
    } = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim()
    }
    if (typeof body.state === 'string' && body.state.trim()) {
      data.state = body.state.trim().toUpperCase().slice(0, 2)
    }
    if (typeof body.country === 'string' && body.country.trim()) {
      data.country = body.country.trim().toUpperCase().slice(0, 2)
    }
    if (typeof body.latitude === 'number' && Number.isFinite(body.latitude)) {
      data.latitude = body.latitude
    }
    if (typeof body.longitude === 'number' && Number.isFinite(body.longitude)) {
      data.longitude = body.longitude
    }
    if (body.ibgeCode === null || body.ibgeCode === '') {
      data.ibgeCode = null
    } else if (typeof body.ibgeCode === 'string') {
      const code = body.ibgeCode.replace(/\D/g, '').slice(0, 7)
      data.ibgeCode = code || null
    }
    if (typeof body.isActive === 'boolean') {
      data.isActive = body.isActive
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar.' },
        { status: 400 }
      )
    }

    const city = await prisma.city.update({
      where: { id: cityId },
      data,
      select: {
        id: true,
        name: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        ibgeCode: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      ...city,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    })
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'Conflito de unicidade (nome+UF+país ou código IBGE já usado por outra cidade).',
        },
        { status: 409 }
      )
    }
    console.error('[admin/cities/:id] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cidade.' },
      { status: 500 }
    )
  }
}
