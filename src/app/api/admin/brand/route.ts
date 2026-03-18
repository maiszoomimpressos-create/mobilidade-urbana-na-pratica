import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

type BrandLogoInput = {
  url?: unknown
  label?: unknown
  isActive?: unknown
}

function normalizeLogoList(input: unknown) {
  if (!Array.isArray(input)) return null

  const parsed = input
    .map((item): { logoUrl: string; label: string | null; isActive: boolean } | null => {
      const candidate = item as BrandLogoInput
      const logoUrl = typeof candidate?.url === 'string' ? candidate.url.trim() : ''
      if (!logoUrl) return null
      const label =
        typeof candidate?.label === 'string' && candidate.label.trim()
          ? candidate.label.trim().slice(0, 80)
          : null
      return {
        logoUrl,
        label,
        isActive: candidate?.isActive === true,
      }
    })
    .filter((item): item is { logoUrl: string; label: string | null; isActive: boolean } => !!item)

  return parsed
}

function pickActiveLogoUrl(
  logos: Array<{ logoUrl: string; isActive: boolean }>,
  fallbackUrl: string | null
): string | null {
  const explicitActive = logos.find((logo) => logo.isActive)
  if (explicitActive) return explicitActive.logoUrl
  if (logos.length > 0) return logos[0].logoUrl
  return fallbackUrl
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

/**
 * GET /api/admin/brand - Retorna config da bandeira Mai Drive (master only).
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    let brand:
      | {
          id: string
          name: string
          slug: string
          logo: string | null
          primaryColor: string
          secondaryColor: string | null
          logos: Array<{ id: string; logoUrl: string; label: string | null; isActive: boolean }>
        }
      | null = null

    try {
      const withLogos = await prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
        include: {
          logos: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
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

    if (!brand) {
      return NextResponse.json({
        name: 'Mai Drive',
        slug: 'mai-drive',
        logo: null,
        logos: [],
        primaryColor: '#ebb000',
        secondaryColor: '#050505',
      })
    }

    const activeLogoUrl = pickActiveLogoUrl(brand.logos, brand.logo ?? null)

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: activeLogoUrl,
      logos: brand.logos.map((logo) => ({
        id: logo.id,
        url: logo.logoUrl,
        label: logo.label,
        isActive: logo.isActive,
      })),
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
    })
  } catch (error) {
    console.error('[admin/brand] GET', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração da marca' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/brand - Atualiza config da bandeira Mai Drive (master only).
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const logo = typeof body.logo === 'string' ? body.logo.trim() || null : undefined
    const primaryColor = typeof body.primaryColor === 'string' ? body.primaryColor.trim() : undefined
    const secondaryColor = typeof body.secondaryColor === 'string' ? body.secondaryColor.trim() || null : undefined
    const logosInput = normalizeLogoList(body.logos)

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (logo !== undefined) update.logo = logo
    if (primaryColor !== undefined) update.primaryColor = primaryColor
    if (secondaryColor !== undefined) update.secondaryColor = secondaryColor

    const brand = await prisma.appBrand.upsert({
      where: { slug: 'mai-drive' },
      update,
      create: {
        name: name ?? 'Mai Drive',
        slug: 'mai-drive',
        logo: logo ?? null,
        primaryColor: primaryColor ?? '#ebb000',
        secondaryColor: secondaryColor ?? null,
      },
    })

    let logosFeatureAvailable = true
    if (logosInput) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.appBrandLogo.deleteMany({
            where: { appBrandId: brand.id },
          })

          if (logosInput.length > 0) {
            await tx.appBrandLogo.createMany({
              data: logosInput.map((logoItem, index) => ({
                appBrandId: brand.id,
                logoUrl: logoItem.logoUrl,
                label: logoItem.label,
                isActive: false,
                sortOrder: index,
              })),
            })

            const activeIndex = logosInput.findIndex((item) => item.isActive)
            const activeSortOrder = activeIndex >= 0 ? activeIndex : 0

            const active = await tx.appBrandLogo.findFirst({
              where: { appBrandId: brand.id, sortOrder: activeSortOrder },
              select: { id: true, logoUrl: true },
            })

            if (active?.id) {
              await tx.appBrandLogo.update({
                where: { id: active.id },
                data: { isActive: true },
              })

              await tx.appBrand.update({
                where: { id: brand.id },
                data: { logo: active.logoUrl },
              })
            } else {
              await tx.appBrand.update({
                where: { id: brand.id },
                data: { logo: null },
              })
            }
          } else {
            await tx.appBrand.update({
              where: { id: brand.id },
              data: { logo: null },
            })
          }
        })
      } catch (error) {
        if (!isMissingAppBrandLogosTableError(error)) throw error
        logosFeatureAvailable = false
      }
    }

    let updatedBrand:
      | {
          id: string
          name: string
          slug: string
          logo: string | null
          primaryColor: string
          secondaryColor: string | null
          logos: Array<{ id: string; logoUrl: string; label: string | null; isActive: boolean }>
        }
      | null = null

    if (logosFeatureAvailable) {
      try {
        const withLogos = await prisma.appBrand.findUnique({
          where: { id: brand.id },
          include: {
            logos: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        })
        updatedBrand = withLogos
      } catch (error) {
        if (!isMissingAppBrandLogosTableError(error)) throw error
        logosFeatureAvailable = false
      }
    }

    if (!updatedBrand) {
      const withoutLogos = await prisma.appBrand.findUnique({
        where: { id: brand.id },
      })
      updatedBrand = withoutLogos
        ? {
            ...withoutLogos,
            logos: withoutLogos.logo
              ? [
                  {
                    id: 'fallback-single-logo',
                    logoUrl: withoutLogos.logo,
                    label: 'Logo principal',
                    isActive: true,
                  },
                ]
              : [],
          }
        : null
    }

    const activeLogoUrl = updatedBrand
      ? pickActiveLogoUrl(updatedBrand.logos, updatedBrand.logo ?? null)
      : brand.logo

    return NextResponse.json({
      id: updatedBrand?.id ?? brand.id,
      name: updatedBrand?.name ?? brand.name,
      slug: updatedBrand?.slug ?? brand.slug,
      logo: activeLogoUrl,
      logos:
        updatedBrand?.logos.map((logoItem) => ({
          id: logoItem.id,
          url: logoItem.logoUrl,
          label: logoItem.label,
          isActive: logoItem.isActive,
        })) ?? [],
      primaryColor: updatedBrand?.primaryColor ?? brand.primaryColor,
      secondaryColor: updatedBrand?.secondaryColor ?? brand.secondaryColor,
    })
  } catch (error) {
    console.error('[admin/brand] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração da marca' },
      { status: 500 }
    )
  }
}
