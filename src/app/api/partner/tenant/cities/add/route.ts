import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { ensureDefaultRideTypesForTenant } from '@/lib/tenant-default-ride-types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/partner/tenant/cities/add
 * Adiciona uma cidade (TenantCity) para o tenant do parceiro logado.
 * body: { tenantId, cityId? } ou { tenantId, cityName, cityState }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForServer()
    const userId = session?.user?.id ?? null
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : ''
    const cityId = typeof body?.cityId === 'string' ? body.cityId.trim() : ''
    const cityName = typeof body?.cityName === 'string' ? body.cityName.trim() : ''
    const cityState = typeof body?.cityState === 'string' ? body.cityState.trim() : ''

    if (!tenantId || (!cityId && (!cityName || !cityState))) {
      return NextResponse.json(
        { error: 'tenantId e (cityId ou cityName + cityState) são obrigatórios.' },
        { status: 400 }
      )
    }

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId, tenantId, isActive: true },
      include: {
        role: { select: { slug: true } },
        tenant: { select: { id: true, isActive: true } },
      },
    })

    if (!tenantUser?.tenant?.id) return NextResponse.json({ error: 'Central não encontrada' }, { status: 404 })
    if (tenantUser.role?.slug !== 'owner') {
      return NextResponse.json({ error: 'Apenas o owner pode gerenciar cidades.' }, { status: 403 })
    }
    if (!tenantUser.tenant.isActive) return NextResponse.json({ error: 'Central inativa.' }, { status: 409 })

    const city = cityId
      ? await prisma.city.findUnique({
          where: { id: cityId },
          select: { id: true },
        })
      : await prisma.city.findFirst({
          where: {
            name: { equals: cityName, mode: 'insensitive' },
            state: { equals: cityState, mode: 'insensitive' },
            country: 'BR',
          },
          select: { id: true },
        })

    if (!city) {
      return NextResponse.json(
        { error: 'Cidade não cadastrada no sistema.' },
        { status: 400 }
      )
    }

    const existing = await prisma.tenantCity.findFirst({
      where: { tenantId, cityId: city.id },
      select: { id: true },
    })

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.tenantCity.update({
          where: { id: existing.id },
          data: { isActive: true },
          select: { id: true },
        })
      } else {
        await tx.tenantCity.create({
          data: {
            tenantId,
            cityId: city.id,
            isActive: true,
          },
          select: { id: true },
        })
      }

      const linkedCityIds = await tx.tenantCity.findMany({
        where: { tenantId, isActive: true },
        select: { cityId: true },
      })
      await ensureDefaultRideTypesForTenant(
        tx,
        tenantId,
        linkedCityIds.map((r) => r.cityId)
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[partner/tenant/cities/add] POST', error)
    return NextResponse.json({ error: 'Erro ao adicionar cidade' }, { status: 500 })
  }
}

