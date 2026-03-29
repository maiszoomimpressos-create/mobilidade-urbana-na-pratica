import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextResponseFromPrismaError, nextResponseInternalError } from '@/lib/prisma-http-error'
import { fetchRideTypeImageUrlMap } from '@/lib/tenant-ride-type-image-raw'

export const dynamic = 'force-dynamic'

/**
 * GET /api/app/ride-types?slug=central-slug&cityId=opcional
 * Lista tipos de corrida ativos da central para o app passageiro (público).
 * Com cityId: inclui tipos daquela cidade e tipos sem cidade (todas).
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.trim()
    const cityId = request.nextUrl.searchParams.get('cityId')?.trim() || null

    if (!slug) {
      return NextResponse.json({ error: 'Parâmetro slug é obrigatório.' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        slug,
        isActive: true,
        approvalStatus: 'approved',
      },
      select: { id: true },
    })

    if (!tenant) {
      return NextResponse.json({ rideTypes: [] })
    }

    const cityFilter =
      cityId != null && cityId.length > 0
        ? {
            OR: [{ cityId: null }, { cityId }],
          }
        : {}

    const rows = await prisma.tenantRideType.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        ...cityFilter,
      },
      include: {
        city: { select: { name: true, state: true } },
      },
      orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    })

    const imageMap = await fetchRideTypeImageUrlMap(tenant.id)

    const rideTypes = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      imageUrl: imageMap.get(r.id) ?? null,
      basePrice: r.basePrice.toString(),
      pricePerKm: r.pricePerKm.toString(),
      pricePerMin: r.pricePerMin.toString(),
      cityId: r.cityId,
      cityLabel: r.city ? `${r.city.name} (${r.city.state})` : null,
    }))

    return NextResponse.json({ rideTypes })
  } catch (error) {
    const prismaResp = nextResponseFromPrismaError(error, '[app/ride-types] GET')
    if (prismaResp) return prismaResp
    console.error('[app/ride-types] GET', error)
    return nextResponseInternalError(error)
  }
}
