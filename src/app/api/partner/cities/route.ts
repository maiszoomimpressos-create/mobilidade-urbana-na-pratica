import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPartnerDbUserIdFromRequest } from '@/lib/partner-tenant-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/cities
 * Lista as cidades atreladas ao tenant do parceiro logado.
 * Retorna latitude/longitude para o mapa.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantIdParam = request.nextUrl.searchParams.get('tenantId')?.trim() || null

    const userId = await getPartnerDbUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ cities: [] })

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId,
        ...(tenantIdParam ? { tenantId: tenantIdParam } : {}),
        isActive: true,
        tenant: { isActive: true },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        tenant: { select: { id: true } },
      },
    })

    if (!tenantUser?.tenant?.id) return NextResponse.json({ cities: [] })
    const tenantId = tenantUser.tenant.id

    const tenantCities = await prisma.tenantCity.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        city: { name: 'asc' },
      },
    })

    return NextResponse.json({
      cities: tenantCities
        .map((tc) => {
          const c = tc.city
          if (!c) return null
          return {
            id: c.id,
            name: c.name,
            state: c.state,
            latitude: Number(c.latitude),
            longitude: Number(c.longitude),
          }
        })
        .filter(
          (c): c is {
            id: string
            name: string
            state: string
            latitude: number
            longitude: number
          } => c !== null
        ),
    })
  } catch (error) {
    console.error('[partner/cities] GET', error)
    return NextResponse.json({ cities: [] }, { status: 500 })
  }
}

