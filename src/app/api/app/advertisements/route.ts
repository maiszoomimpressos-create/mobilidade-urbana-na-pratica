import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.nextUrl.searchParams.get('tenant') || ''
    const position = request.nextUrl.searchParams.get('position') || 'PASSENGER_HOME'

    const now = new Date()

    let tenantId: string | null = null
    if (tenantSlug && tenantSlug !== 'mai-drive') {
      const tenant = await prisma.tenant.findFirst({
        where: { slug: tenantSlug, isActive: true },
        select: { id: true },
      })
      tenantId = tenant?.id ?? null
    }

    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        position: position as 'PASSENGER_HOME' | 'PASSENGER_RIDE' | 'DRIVER_HOME' | 'SITE_BANNER',
        OR: [
          { tenantId: null },
          ...(tenantId ? [{ tenantId }] : []),
        ],
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        priority: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    })

    return NextResponse.json({ ads })
  } catch (error) {
    console.error('[app/advertisements GET]', error)
    return NextResponse.json({ ads: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adId, action } = body

    if (!adId || !action) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (action === 'impression') {
      await prisma.advertisement.update({
        where: { id: adId },
        data: { impressions: { increment: 1 } },
      })
    } else if (action === 'click') {
      await prisma.advertisement.update({
        where: { id: adId },
        data: { clicks: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[app/advertisements POST]', error)
    return NextResponse.json({ success: false })
  }
}
