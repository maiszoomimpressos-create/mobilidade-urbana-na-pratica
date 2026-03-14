import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const FALLBACK = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
}

/**
 * Config de branding para o app do passageiro.
 * Sempre usa nossa logo e cores (Mai Drive). O tenant só pode customizar o subnome da central.
 * GET /api/app/tenant-config?slug=xyz
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.trim() || 'mai-drive'

    const brand = await prisma.appBrand.findFirst({
      where: { slug: 'mai-drive' },
    })
    const logo = brand?.logo ?? FALLBACK.logo
    const primaryColor = brand?.primaryColor ?? FALLBACK.primaryColor
    const secondaryColor = brand?.secondaryColor ?? FALLBACK.secondaryColor

    if (slug === 'mai-drive' || slug === '') {
      return NextResponse.json({
        name: brand?.name ?? FALLBACK.name,
        slug: 'mai-drive',
        logo,
        primaryColor,
        secondaryColor,
      })
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
      select: { name: true, slug: true },
    })

    if (!tenant) {
      return NextResponse.json(FALLBACK)
    }

    return NextResponse.json({
      name: tenant.name,
      slug: tenant.slug,
      logo,
      primaryColor,
      secondaryColor,
    })
  } catch (error) {
    console.error('[tenant-config]', error)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}
