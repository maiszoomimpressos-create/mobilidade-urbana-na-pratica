import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const FALLBACK = {
  name: 'Mai Drive',
  slug: 'mai-drive',
  logo: null,
  primaryColor: '#ebb000',
  secondaryColor: '#050505',
  showPassengerAds: false,
}

function isMissingAppBrandLogosTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''
  const meta = 'meta' in error ? (error as { meta?: unknown }).meta : undefined
  const table =
    meta && typeof meta === 'object' && 'table' in meta
      ? String((meta as { table?: unknown }).table ?? '')
      : ''
  return code === 'P2021' && table.includes('app_brand_logos')
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')?.trim() || 'mai-drive'
    const app = request.nextUrl.searchParams.get('app')?.trim() || 'passenger'

    let brand:
      | {
          name: string
          logo: string | null
          primaryColor: string
          secondaryColor: string | null
          showPassengerAds: boolean
          logos: Array<{ logoUrl: string }>
        }
      | null = null
    try {
      const withLogos = await prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
        include: {
          logos: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      })
      brand = withLogos
    } catch (error) {
      if (!isMissingAppBrandLogosTableError(error)) throw error
      const withoutLogos = await prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
      })
      brand = withoutLogos ? { ...withoutLogos, logos: [] } : null
    }
    const brandLogo = brand?.logos?.[0]?.logoUrl ?? brand?.logo ?? FALLBACK.logo
    const brandPrimaryColor = brand?.primaryColor ?? FALLBACK.primaryColor
    const brandSecondaryColor = brand?.secondaryColor ?? FALLBACK.secondaryColor
    const brandShowPassengerAds = brand?.showPassengerAds ?? FALLBACK.showPassengerAds

    // App passageiro: sempre usa bandeira Mai Drive (logo/cores fixas).
    if (app === 'passenger') {
      if (slug === 'mai-drive' || slug === '') {
        return NextResponse.json({
          name: brand?.name ?? FALLBACK.name,
          slug: 'mai-drive',
          logo: brandLogo,
          primaryColor: brandPrimaryColor,
          secondaryColor: brandSecondaryColor,
          showPassengerAds: brandShowPassengerAds,
        })
      }

      const tenant = await prisma.tenant.findFirst({
        where: { slug, isActive: true },
        select: { name: true, slug: true, showPassengerAds: true },
      })

      if (!tenant) {
        return NextResponse.json({
          ...FALLBACK,
          logo: brandLogo,
          primaryColor: brandPrimaryColor,
          secondaryColor: brandSecondaryColor,
        })
      }

      return NextResponse.json({
        name: tenant.name,
        slug: tenant.slug,
        logo: brandLogo,
        primaryColor: brandPrimaryColor,
        secondaryColor: brandSecondaryColor,
        showPassengerAds: tenant.showPassengerAds ?? brandShowPassengerAds,
      })
    }

    // App motorista (ou outros apps): usam logo/cores do próprio tenant (white label),
    // caindo para a bandeira Mai Drive se o tenant não tiver customização.
    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
      select: {
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        showPassengerAds: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({
        ...FALLBACK,
        logo: brandLogo,
        primaryColor: brandPrimaryColor,
        secondaryColor: brandSecondaryColor,
      })
    }

    return NextResponse.json({
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo ?? brandLogo,
      primaryColor: tenant.primaryColor ?? brandPrimaryColor,
      secondaryColor: tenant.secondaryColor ?? brandSecondaryColor,
      showPassengerAds: tenant.showPassengerAds ?? brandShowPassengerAds,
    })
  } catch (error) {
    console.error('[tenant-config]', error)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}
