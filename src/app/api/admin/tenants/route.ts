import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'
import { ensureDefaultRideTypesForTenant } from '@/lib/tenant-default-ride-types'

export const dynamic = 'force-dynamic'
const PASSENGER_ADS_FEATURE_SLUG = 'passenger_advertising'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function ensurePassengerAdsFeature() {
  await prisma.feature.upsert({
    where: { slug: PASSENGER_ADS_FEATURE_SLUG },
    update: {
      name: 'Publicidade no app passageiro',
      description: 'Exibe o espaço de publicidade no app do passageiro.',
    },
    create: {
      slug: PASSENGER_ADS_FEATURE_SLUG,
      name: 'Publicidade no app passageiro',
      description: 'Exibe o espaço de publicidade no app do passageiro.',
    },
  })
}

/**
 * GET /api/admin/tenants
 * Lista centrais (tenants) para gestão administrativa.
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
        createdAt: true,
        showPassengerAds: true,
        type: true,
        wlAppName: true,
        wlAppPackage: true,
        wlAppIcon: true,
        wlSplashImage: true,
        wlPassengerApkUrl: true,
        wlDriverApkUrl: true,
        wlBuildStatus: true,
        wlLastBuildAt: true,
        tenantCities: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            city: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        showPassengerAds: tenant.showPassengerAds,
        type: tenant.type,
        wlAppName: tenant.wlAppName,
        wlAppPackage: tenant.wlAppPackage,
        wlAppIcon: tenant.wlAppIcon,
        wlSplashImage: tenant.wlSplashImage,
        wlPassengerApkUrl: tenant.wlPassengerApkUrl,
        wlDriverApkUrl: tenant.wlDriverApkUrl,
        wlBuildStatus: tenant.wlBuildStatus,
        wlLastBuildAt: tenant.wlLastBuildAt,
        linkedCities: tenant.tenantCities
          .map((item) => item.city)
          .filter((city): city is { id: string; name: string; state: string } => Boolean(city)),
        linkedCity: tenant.tenantCities?.[0]?.city ?? null,
      })),
    })
  } catch (error) {
    console.error('[admin/tenants] GET', error)
    return NextResponse.json(
      { error: 'Erro ao listar centrais' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tenants
 * Cria uma nova central (brand = nossa bandeira + cidade, ou white-label).
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const customSlug = typeof body?.slug === 'string' ? body.slug.trim() : ''
    const logo = typeof body?.logo === 'string' ? body.logo.trim() : ''
    const cityId = typeof body?.cityId === 'string' ? body.cityId.trim() : ''
    const cityIdsRaw = Array.isArray(body?.cityIds) ? (body.cityIds as unknown[]) : []
    const cityIds = Array.from(
      new Set(
        cityIdsRaw
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
    const type = typeof body?.type === 'string' ? body.type.trim() : 'white-label'
    const showPassengerAds = typeof body?.showPassengerAds === 'boolean' ? body.showPassengerAds : false
    const wlAppName = typeof body?.wlAppName === 'string' ? body.wlAppName.trim() : null
    const wlAppPackage = typeof body?.wlAppPackage === 'string' ? body.wlAppPackage.trim() : null
    const wlAppIcon = typeof body?.wlAppIcon === 'string' ? body.wlAppIcon.trim() : null
    const wlSplashImage = typeof body?.wlSplashImage === 'string' ? body.wlSplashImage.trim() : null
    const rawFeatureSlugs = Array.isArray(body?.featureSlugs)
      ? (body.featureSlugs as unknown[])
      : []
    const featureSlugs: string[] = Array.from(
      new Set(
        rawFeatureSlugs
          .filter((v): v is string => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter((v): v is string => Boolean(v))
      )
    )

    if (type !== 'white-label' && type !== 'brand') {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "brand" ou "white-label".' },
        { status: 400 }
      )
    }

    const selectedCityIds = cityIds.length > 0 ? cityIds : cityId ? [cityId] : []

    if (type === 'brand' && selectedCityIds.length === 0) {
      return NextResponse.json(
        { error: 'Para centrais da nossa bandeira, informe ao menos uma cidade.' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da central é obrigatório.' },
        { status: 400 }
      )
    }

    const baseSlug = slugify(customSlug || name)
    if (!baseSlug) {
      return NextResponse.json(
        { error: 'Slug inválido. Use letras e números.' },
        { status: 400 }
      )
    }

    const exists = await prisma.tenant.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json(
        { error: 'Já existe uma central com este slug.' },
        { status: 409 }
      )
    }

    await ensurePassengerAdsFeature()

    let brandLogo: string | null = null
    if (type === 'brand') {
      const brand = await prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
        select: { logo: true },
      })
      brandLogo = brand?.logo ?? null
    }

    const tenant = await prisma.$transaction(async (tx) => {
      if (selectedCityIds.length > 0) {
        const existingCities = await tx.city.findMany({
          where: { id: { in: selectedCityIds } },
          select: { id: true },
        })
        if (existingCities.length !== selectedCityIds.length) {
          throw new Error('Cidade informada não existe.')
        }
      }

      const finalLogo = logo || brandLogo || null

      const createdTenant = await tx.tenant.create({
        data: {
          name,
          slug: baseSlug,
          logo: finalLogo,
          isActive: true,
          showPassengerAds,
          type,
          ...(type === 'white-label' ? {
            wlAppName: wlAppName || null,
            wlAppPackage: wlAppPackage || null,
            wlAppIcon: wlAppIcon || null,
            wlSplashImage: wlSplashImage || null,
          } : {}),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          isActive: true,
          createdAt: true,
          showPassengerAds: true,
          type: true,
          wlAppName: true,
          wlAppPackage: true,
          wlAppIcon: true,
          wlSplashImage: true,
          wlPassengerApkUrl: true,
          wlDriverApkUrl: true,
          wlBuildStatus: true,
          wlLastBuildAt: true,
        },
      })

      if (selectedCityIds.length > 0) {
        await tx.tenantCity.createMany({
          data: selectedCityIds.map((selectedCityId) => ({
            tenantId: createdTenant.id,
            cityId: selectedCityId,
            isActive: true,
          })),
        })
      }

      await ensureDefaultRideTypesForTenant(tx, createdTenant.id, selectedCityIds)

      if (featureSlugs.length > 0) {
        const features = await tx.feature.findMany({
          where: { slug: { in: featureSlugs } },
          select: { id: true, slug: true },
        })

        if (features.length !== featureSlugs.length) {
          throw new Error('FEATURE_NOT_FOUND')
        }

        await tx.tenantCustomFeature.createMany({
          data: features.map((feature) => ({
            tenantId: createdTenant.id,
            featureId: feature.id,
          })),
        })
      }

      const enablePassengerAds =
        featureSlugs.includes(PASSENGER_ADS_FEATURE_SLUG) || showPassengerAds
      if (enablePassengerAds !== createdTenant.showPassengerAds) {
        await tx.tenant.update({
          where: { id: createdTenant.id },
          data: { showPassengerAds: enablePassengerAds },
          select: { id: true },
        })
      }

      const linkedCities = selectedCityIds.length
        ? await tx.city.findMany({
            where: { id: { in: selectedCityIds } },
            select: {
              id: true,
              name: true,
              state: true,
            },
            orderBy: [{ state: 'asc' }, { name: 'asc' }],
          })
        : []

      return {
        ...createdTenant,
        showPassengerAds: enablePassengerAds,
        linkedCities,
        linkedCity: linkedCities[0] ?? null,
      }
    })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FEATURE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Uma ou mais funcionalidades são inválidas.' },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('Cidade informada não existe')) {
      return NextResponse.json(
        { error: 'Cidade informada não existe.' },
        { status: 400 }
      )
    }
    console.error('[admin/tenants] POST', error)
    return NextResponse.json(
      { error: 'Erro ao criar central' },
      { status: 500 }
    )
  }
}
